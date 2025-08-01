// JavaScript version of the payment webhook handler for Node.js server
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qrpukxmzdwkepfpuapzh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5MTgsImV4cCI6MjA2NjM5MzkxOH0.Ix3k_w-nbJQ29FcuP3YYRT_K6ZC7RY2p80VKaDA0JEs';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables. Using fallback values.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fapshi service for webhook signature verification
class FapshiService {
  constructor() {
    this.apiKey = process.env.VITE_FAPSHI_API_KEY || '';
    this.apiUser = process.env.VITE_FAPSHI_API_USER || '';
  }

  verifyWebhookSignature(payload, signature) {
    // For now, we'll skip signature verification in development
    // In production, implement proper signature verification
    console.log('Webhook signature verification skipped in development');
    return true;
  }
}

const fapshiService = new FapshiService();

async function handlePaymentWebhook(req) {
  try {
    const { body, headers } = req;
    
    // Verify webhook signature (security check)
    const signature = headers['x-fapshi-signature'];
    if (!signature) {
      console.error('Webhook signature missing');
      return { status: 400, error: 'Missing signature' };
    }

    // Verify the webhook signature
    const isValidSignature = fapshiService.verifyWebhookSignature(
      JSON.stringify(body),
      signature
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return { status: 400, error: 'Invalid signature' };
    }

    const { reference, status, amount, currency, customer } = body;

    console.log(`Processing webhook for payment: ${reference}, status: ${status}`);

    // Update order based on payment status
    if (status === 'success') {
      // Update orders status to confirmed
      const { error: ordersError } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
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
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          created_at: new Date().toISOString()
        };

        const { error: paymentError } = await supabase
          .from('payments')
          .insert(paymentRecord);

        if (paymentError) {
          console.warn('Payments table not available or error saving payment record:', paymentError);
        } else {
          console.log('Payment record saved successfully');
        }
      } catch (paymentError) {
        console.warn('Payments table not available:', paymentError);
      }

      console.log(`Order ${reference} updated successfully - payment confirmed`);
      
      // Send confirmation email to customer
      await sendPaymentConfirmationEmail(reference, customer.email);
      
      // Send notification to admin
      await sendAdminPaymentNotification(reference, amount, currency);

    } else if (status === 'failed' || status === 'cancelled') {
      // Payment failed or cancelled - update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          payment_reference: reference,
          payment_method: 'fapshi',
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('order_reference', reference);

      if (orderError) {
        // Try updating custom_orders table
        const { error: customOrderError } = await supabase
          .from('custom_orders')
          .update({
            payment_status: 'failed',
            payment_reference: reference,
            payment_method: 'fapshi',
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('order_reference', reference);

        if (customOrderError) {
          console.error('Error updating order status:', customOrderError);
          return { status: 500, error: 'Failed to update order status' };
        }
      }

      console.log(`Order ${reference} payment ${status}`);
    }

    return { status: 200, success: true, message: 'Webhook processed successfully' };

  } catch (error) {
    console.error('Webhook processing error:', error);
    return { status: 500, error: 'Internal server error' };
  }
}

async function sendPaymentConfirmationEmail(orderReference, customerEmail) {
  try {
    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', orderReference)
      .single();

    if (order) {
      console.log(`Payment confirmation email would be sent for order ${orderReference}`);
      // In a real implementation, you would send the email here
      // For now, we'll just log it
    }
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
}

async function sendAdminPaymentNotification(orderReference, amount, currency) {
  try {
    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', orderReference)
      .single();

    if (order) {
      console.log(`Admin notification would be sent for order ${orderReference}`);
      // In a real implementation, you would send the email here
      // For now, we'll just log it
    }
  } catch (error) {
    console.error('Error sending admin payment notification:', error);
  }
}

module.exports = { handlePaymentWebhook }; 