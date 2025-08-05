// JavaScript version of the payment webhook handler for Node.js server
const { createClient } = require('@supabase/supabase-js');
const { verifyWebhookSignature, sanitizeInput } = require('./security-config');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://qrpukxmzdwkepfpuapzh.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5MTgsImV4cCI6MjA2NjM5MzkxOH0.Ix3k_w-nbJQ29FcuP3YYRT_K6ZC7RY2p80VKaDA0JEs';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables. Using fallback values.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fapshi service for webhook signature verification
class FapshiService {
  constructor() {
    this.apiKey = process.env.FAPSHI_API_KEY || '';
    this.apiUser = process.env.FAPSHI_API_USER || '';
    this.webhookSecret = process.env.FAPSHI_WEBHOOK_SECRET || '';
  }

  verifyWebhookSignature(payload, signature) {
    // Use the security config function for proper signature verification
    return verifyWebhookSignature(payload, signature, this.webhookSecret);
  }

  // Additional security: validate payment data
  validatePaymentData(paymentData) {
    const requiredFields = ['reference', 'status', 'amount', 'currency'];
    const missingFields = requiredFields.filter(field => !paymentData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate amount
    if (typeof paymentData.amount !== 'number' || paymentData.amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Validate currency
    if (typeof paymentData.currency !== 'string' || paymentData.currency.length !== 3) {
      throw new Error('Invalid currency format');
    }

    // Validate status
    const validStatuses = ['success', 'failed', 'pending'];
    if (!validStatuses.includes(paymentData.status)) {
      throw new Error('Invalid payment status');
    }

    return true;
  }
}

const fapshiService = new FapshiService();

async function handlePaymentWebhook(req) {
  try {
    const { body, headers } = req;
    
    // Security: Log webhook attempt
    console.log(`Webhook received from IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
    
    // Verify webhook signature (security check)
    const signature = headers['x-fapshi-signature'] || headers['x-campay-signature'];
    if (!signature) {
      console.error('Webhook signature missing');
      return { status: 400, error: 'Missing signature' };
    }

    // Sanitize input data
    const sanitizedBody = {};
    Object.keys(body).forEach(key => {
      sanitizedBody[key] = sanitizeInput(body[key]);
    });

    // Verify the webhook signature
    const isValidSignature = fapshiService.verifyWebhookSignature(
      JSON.stringify(sanitizedBody),
      signature
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return { status: 400, error: 'Invalid signature' };
    }

    // Validate payment data
    try {
      fapshiService.validatePaymentData(sanitizedBody);
    } catch (validationError) {
      console.error('Payment data validation failed:', validationError.message);
      return { status: 400, error: validationError.message };
    }

    const { reference, status, amount, currency, customer } = sanitizedBody;

    console.log(`Processing webhook for payment: ${reference}, status: ${status}`);

    // Update order based on payment status
    if (status === 'success') {
      // Update orders status to confirmed
      const { error: ordersError } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_amount: amount,
          payment_currency: currency,
          updated_at: new Date().toISOString()
        })
        .eq('order_reference', reference);

      if (ordersError) {
        console.warn('Error updating orders:', ordersError);
      }

      // Update custom orders status to confirmed
      const { error: customOrdersError } = await supabase
        .from('custom_orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_amount: amount,
          payment_currency: currency,
          updated_at: new Date().toISOString()
        })
        .eq('order_reference', reference);

      if (customOrdersError) {
        console.warn('Error updating custom orders:', customOrdersError);
      }

      // Try to save payment record to payments table (if it exists)
      try {
        const paymentRecord = {
          order_reference: reference,
          payment_reference: reference,
          payment_method: 'fapshi',
          payment_status: 'paid',
          amount: amount,
          currency: currency,
          customer_name: customer?.name || '',
          customer_phone: customer?.phone || '',
          customer_email: customer?.email || '',
          created_at: new Date().toISOString()
        };

        const { error: paymentError } = await supabase
          .from('payments')
          .insert([paymentRecord]);

        if (paymentError) {
          console.warn('Error saving payment record:', paymentError);
        } else {
          console.log('Payment record saved successfully');
        }
      } catch (paymentTableError) {
        console.warn('Payments table might not exist:', paymentTableError.message);
      }

      // Send confirmation emails
      try {
        await sendPaymentConfirmationEmail(reference, customer?.email);
        await sendAdminPaymentNotification(reference, amount, currency);
      } catch (emailError) {
        console.warn('Error sending confirmation emails:', emailError);
      }

      return { 
        status: 200, 
        message: 'Payment processed successfully',
        reference: reference
      };

    } else if (status === 'failed') {
      // Update order status to failed
      const { error: ordersError } = await supabase
        .from('orders')
        .update({
          status: 'failed',
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('order_reference', reference);

      if (ordersError) {
        console.warn('Error updating orders:', ordersError);
      }

      const { error: customOrdersError } = await supabase
        .from('custom_orders')
        .update({
          status: 'failed',
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('order_reference', reference);

      if (customOrdersError) {
        console.warn('Error updating custom orders:', customOrdersError);
      }

      return { 
        status: 200, 
        message: 'Payment failed - order updated',
        reference: reference
      };

    } else {
      // Handle pending status
      return { 
        status: 200, 
        message: 'Payment pending',
        reference: reference
      };
    }

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return { 
      status: 500, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}

async function sendPaymentConfirmationEmail(orderReference, customerEmail) {
  if (!customerEmail || process.env.SKIP_EMAIL_SENDING === 'true') {
    console.log('Skipping payment confirmation email');
    return;
  }

  try {
    const emailService = require('./email-service');
    const emailResult = await emailService.sendPaymentConfirmationEmail(orderReference, customerEmail);
    
    if (emailResult.success) {
      console.log('Payment confirmation email sent successfully');
    } else {
      console.warn('Failed to send payment confirmation email:', emailResult.error);
    }
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
}

async function sendAdminPaymentNotification(orderReference, amount, currency) {
  if (process.env.SKIP_EMAIL_SENDING === 'true') {
    console.log('Skipping admin payment notification');
    return;
  }

  try {
    const emailService = require('./email-service');
    const emailResult = await emailService.sendAdminPaymentNotification(orderReference, amount, currency);
    
    if (emailResult.success) {
      console.log('Admin payment notification sent successfully');
    } else {
      console.warn('Failed to send admin payment notification:', emailResult.error);
    }
  } catch (error) {
    console.error('Error sending admin payment notification:', error);
  }
}

module.exports = {
  handlePaymentWebhook,
  FapshiService,
  sendPaymentConfirmationEmail,
  sendAdminPaymentNotification
}; 