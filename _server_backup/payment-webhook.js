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
    
    // Verify webhook signature (security check) - bypass in development
    const signature = headers['x-fapshi-signature'] || headers['x-campay-signature'];
    let sanitizedBody = {};
    
    if (!signature) {
      console.error('Webhook signature missing');
      // In development, allow requests without signature for testing
      if (process.env.NODE_ENV === 'development' && headers['x-fapshi-signature'] === 'test-signature-for-development') {
        console.log('Development mode: bypassing signature verification for testing');
        // Sanitize input data for development
        Object.keys(body).forEach(key => {
          sanitizedBody[key] = sanitizeInput(body[key]);
        });
      } else {
        return { status: 400, error: 'Missing signature' };
      }
    } else {
      // Sanitize input data
      Object.keys(body).forEach(key => {
        sanitizedBody[key] = sanitizeInput(body[key]);
      });

      // Verify the webhook signature (skip in development test mode)
      if (process.env.NODE_ENV !== 'development' || signature !== 'test-signature-for-development') {
        const isValidSignature = fapshiService.verifyWebhookSignature(
          JSON.stringify(sanitizedBody),
          signature
        );

        if (!isValidSignature) {
          console.error('Invalid webhook signature');
          return { status: 400, error: 'Invalid signature' };
        }
      }
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

      // Send admin notification for failed payment
      try {
        await sendAdminPaymentFailureNotification(reference, amount, currency, customer);
      } catch (emailError) {
        console.warn('Error sending admin failure notification:', emailError);
      }

      return { 
        status: 200, 
        message: 'Payment failed - order updated',
        reference: reference
      };

    } else {
      // Handle pending status
      // Send admin notification for pending payment
      try {
        await sendAdminPaymentPendingNotification(reference, amount, currency, customer);
      } catch (emailError) {
        console.warn('Error sending admin pending notification:', emailError);
      }

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
  if (!customerEmail) {
    console.log('Skipping payment confirmation email');
    return;
  }

  try {
    // Get order details from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', orderReference)
      .single();

    if (orderError || !order) {
      console.warn('Order not found for email:', orderReference);
      return;
    }

    // Create order data for email
    const orderData = {
      orderReference: orderReference,
      customerName: order.customer_name || 'Customer',
      customerEmail: customerEmail,
      customerPhone: order.customer_phone || '',
      restaurantName: order.restaurant_name || 'Restaurant',
      dishName: order.dish_name || 'Dish',
      quantity: order.quantity || 1,
      totalAmount: `${order.total_amount || 0} FCFA`,
      deliveryAddress: order.delivery_address || 'Delivery Address'
    };

    // Use dual email service
    const { sendEmailWithFallback, createOrderConfirmationEmail } = require('./dual-email-service');
    
    const subject = `Order Confirmation - ${orderReference}`;
    const html = createOrderConfirmationEmail(orderData);
    
    const emailResult = await sendEmailWithFallback(
      customerEmail,
      subject,
      html,
      { priority: process.env.EMAIL_PRIORITY || 'gmail' }
    );
    
    if (emailResult.success) {
      console.log(`✅ Payment confirmation email sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`);
    } else {
      console.warn('❌ Failed to send payment confirmation email:', emailResult.error);
    }
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
}

async function sendAdminPaymentNotification(orderReference, amount, currency) {
  // Remove skip email check - always send emails in production
    console.log('Skipping admin payment notification');
    return;
  }

  try {
    // Get order details from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', orderReference)
      .single();

    if (orderError || !order) {
      console.warn('Order not found for admin notification:', orderReference);
      return;
    }

    // Create order data for admin email
    const orderData = {
      orderReference: orderReference,
      customerName: order.customer_name || 'Customer',
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || '',
      restaurantName: order.restaurant_name || 'Restaurant',
      dishName: order.dish_name || 'Dish',
      quantity: order.quantity || 1,
      totalAmount: `${order.total_amount || amount} FCFA`,
      deliveryAddress: order.delivery_address || 'Delivery Address'
    };

    // Use dual email service for admin notification
    const { sendEmailWithFallback } = require('./dual-email-service');
    
    const subject = `New Order - ${orderReference}`;
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order - ChopTym</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #D57A1F 0%, #E89A4D 100%); padding: 30px; text-align: center;">
            <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 40px; color: white;">🆕</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">New Order Received!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Payment confirmed - Action required</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">New Order Alert! 🚨</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              A new order has been placed and payment has been confirmed. Please process this order immediately.
            </p>

            <!-- Order Details Card -->
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border-left: 5px solid #D57A1F;">
              <h3 style="color: #D57A1F; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
                <span style="margin-right: 10px;">📋</span>
                Order Details
              </h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Order Reference</p>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${orderData.orderReference}</p>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Restaurant</p>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${orderData.restaurantName}</p>
                </div>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <span style="font-size: 24px; margin-right: 15px;">🍽️</span>
                  <div>
                    <p style="margin: 0; color: #2c3e50; font-size: 18px; font-weight: 600;">${orderData.dishName}</p>
                    <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Quantity: ${orderData.quantity}</p>
                  </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #e9ecef;">
                  <span style="color: #6c757d; font-size: 14px;">Total Amount:</span>
                  <span style="color: #D57A1F; font-size: 20px; font-weight: 600;">${orderData.totalAmount}</span>
                </div>
              </div>

              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Customer Information</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;"><strong>Name:</strong> ${orderData.customerName}</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;"><strong>Email:</strong> ${orderData.customerEmail}</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;"><strong>Phone:</strong> ${orderData.customerPhone}</p>
              </div>

              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Delivery Address</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">${orderData.deliveryAddress}</p>
              </div>
            </div>

            <!-- Action Required -->
            <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                <span style="margin-right: 10px;">⚡</span>
                Action Required
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #856404;">
                <li style="margin-bottom: 8px;">Process this order immediately</li>
                <li style="margin-bottom: 8px;">Contact the restaurant to confirm preparation</li>
                <li style="margin-bottom: 8px;">Assign delivery personnel</li>
                <li>Update order status in the system</li>
              </ul>
            </div>

            <!-- Contact Info -->
            <div style="text-align: center; margin: 40px 0 20px 0;">
              <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">Need help? Contact support:</p>
              <div style="display: flex; justify-content: center; gap: 20px;">
                <div style="text-align: center;">
                  <span style="font-size: 20px; color: #D57A1F;">📧</span>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">support@choptym.com</p>
                </div>
                <div style="text-align: center;">
                  <span style="font-size: 20px; color: #D57A1F;">📞</span>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">+237 670 416 449</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-size: 12px;">
              © 2024 ChopTym. All rights reserved. | Delicious meals delivered to your doorstep.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const adminEmail = process.env.ADMIN_EMAIL || 'choptym237@gmail.com';
    const emailResult = await sendEmailWithFallback(
      adminEmail,
      subject,
      html,
      { priority: process.env.EMAIL_PRIORITY || 'gmail' }
    );
    
    if (emailResult.success) {
      console.log(`✅ Admin payment notification sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`);
    } else {
      console.warn('❌ Failed to send admin payment notification:', emailResult.error);
    }
  } catch (error) {
    console.error('Error sending admin payment notification:', error);
  }
}

async function sendAdminPaymentFailureNotification(orderReference, amount, currency, customer) {
  // Remove skip email check - always send emails in production
    console.log('Skipping admin payment failure notification');
    return;
  }

  try {
    // Get order details from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', orderReference)
      .single();

    if (orderError || !order) {
      console.warn('Order not found for admin failure notification:', orderReference);
      return;
    }

    // Create order data for admin email
    const orderData = {
      orderReference: orderReference,
      customerName: order.customer_name || 'Customer',
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || '',
      restaurantName: order.restaurant_name || 'Restaurant',
      dishName: order.dish_name || 'Dish',
      quantity: order.quantity || 1,
      totalAmount: `${order.total_amount || amount} FCFA`,
      deliveryAddress: order.delivery_address || 'Delivery Address'
    };

    // Use dual email service for admin notification
    const { sendEmailWithFallback } = require('./dual-email-service');
    
    const subject = `Payment Failed - ${orderReference}`;
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed - ChopTym</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #D57A1F 0%, #E89A4D 100%); padding: 30px; text-align: center;">
            <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 40px; color: white;">❌</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Payment Failed!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Payment for your order could not be processed.</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Payment Failed Alert! 🚨</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Payment for your order with reference number ${orderData.orderReference} has failed. Please check your payment details and try again.
            </p>

            <!-- Order Details Card -->
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border-left: 5px solid #D57A1F;">
              <h3 style="color: #D57A1F; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
                <span style="margin-right: 10px;">📋</span>
                Order Details
              </h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Order Reference</p>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${orderData.orderReference}</p>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Restaurant</p>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${orderData.restaurantName}</p>
                </div>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <span style="font-size: 24px; margin-right: 15px;">🍽️</span>
                  <div>
                    <p style="margin: 0; color: #2c3e50; font-size: 18px; font-weight: 600;">${orderData.dishName}</p>
                    <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Quantity: ${orderData.quantity}</p>
                  </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #e9ecef;">
                  <span style="color: #6c757d; font-size: 14px;">Total Amount:</span>
                  <span style="color: #D57A1F; font-size: 20px; font-weight: 600;">${orderData.totalAmount}</span>
                </div>
              </div>

              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Customer Information</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;"><strong>Name:</strong> ${orderData.customerName}</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;"><strong>Email:</strong> ${orderData.customerEmail}</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;"><strong>Phone:</strong> ${orderData.customerPhone}</p>
              </div>

              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Delivery Address</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">${orderData.deliveryAddress}</p>
              </div>
            </div>

            <!-- Action Required -->
            <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                <span style="margin-right: 10px;">⚡</span>
                Action Required
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #856404;">
                <li style="margin-bottom: 8px;">Review your payment details</li>
                <li style="margin-bottom: 8px;">Try a different payment method if available</li>
                <li style="margin-bottom: 8px;">Contact the restaurant for assistance</li>
                <li>Update order status in the system</li>
              </ul>
            </div>

            <!-- Contact Info -->
            <div style="text-align: center; margin: 40px 0 20px 0;">
              <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">Need help? Contact support:</p>
              <div style="display: flex; justify-content: center; gap: 20px;">
                <div style="text-align: center;">
                  <span style="font-size: 20px; color: #D57A1F;">📧</span>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">support@choptym.com</p>
                </div>
                <div style="text-align: center;">
                  <span style="font-size: 20px; color: #D57A1F;">📞</span>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">+237 670 416 449</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-size: 12px;">
              © 2024 ChopTym. All rights reserved. | Delicious meals delivered to your doorstep.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const adminEmail = process.env.ADMIN_EMAIL || 'choptym237@gmail.com';
    const emailResult = await sendEmailWithFallback(
      adminEmail,
      subject,
      html,
      { priority: process.env.EMAIL_PRIORITY || 'gmail' }
    );
    
    if (emailResult.success) {
      console.log(`✅ Admin payment failure notification sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`);
    } else {
      console.warn('❌ Failed to send admin payment failure notification:', emailResult.error);
    }
  } catch (error) {
    console.error('Error sending admin payment failure notification:', error);
  }
}

async function sendAdminPaymentPendingNotification(orderReference, amount, currency, customer) {
  // Remove skip email check - always send emails in production
    console.log('Skipping admin payment pending notification');
    return;
  }

  try {
    // Get order details from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', orderReference)
      .single();

    if (orderError || !order) {
      console.warn('Order not found for admin pending notification:', orderReference);
      return;
    }

    // Create order data for admin email
    const orderData = {
      orderReference: orderReference,
      customerName: order.customer_name || 'Customer',
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || '',
      restaurantName: order.restaurant_name || 'Restaurant',
      dishName: order.dish_name || 'Dish',
      quantity: order.quantity || 1,
      totalAmount: `${order.total_amount || amount} FCFA`,
      deliveryAddress: order.delivery_address || 'Delivery Address'
    };

    // Use dual email service for admin notification
    const { sendEmailWithFallback } = require('./dual-email-service');
    
    const subject = `Payment Pending - ${orderReference}`;
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Pending - ChopTym</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #D57A1F 0%, #E89A4D 100%); padding: 30px; text-align: center;">
            <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 40px; color: white;">⚠️</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Payment Pending!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Payment for your order is pending confirmation.</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Payment Pending Alert! 🚨</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Payment for your order with reference number ${orderData.orderReference} is pending. Please complete the payment as soon as possible.
            </p>

            <!-- Order Details Card -->
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border-left: 5px solid #D57A1F;">
              <h3 style="color: #D57A1F; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
                <span style="margin-right: 10px;">📋</span>
                Order Details
              </h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Order Reference</p>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${orderData.orderReference}</p>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Restaurant</p>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${orderData.restaurantName}</p>
                </div>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <span style="font-size: 24px; margin-right: 15px;">🍽️</span>
                  <div>
                    <p style="margin: 0; color: #2c3e50; font-size: 18px; font-weight: 600;">${orderData.dishName}</p>
                    <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Quantity: ${orderData.quantity}</p>
                  </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #e9ecef;">
                  <span style="color: #6c757d; font-size: 14px;">Total Amount:</span>
                  <span style="color: #D57A1F; font-size: 20px; font-weight: 600;">${orderData.totalAmount}</span>
                </div>
              </div>

              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Customer Information</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;"><strong>Name:</strong> ${orderData.customerName}</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;"><strong>Email:</strong> ${orderData.customerEmail}</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;"><strong>Phone:</strong> ${orderData.customerPhone}</p>
              </div>

              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Delivery Address</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">${orderData.deliveryAddress}</p>
              </div>
            </div>

            <!-- Action Required -->
            <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                <span style="margin-right: 10px;">⚡</span>
                Action Required
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #856404;">
                <li style="margin-bottom: 8px;">Complete the payment as soon as possible</li>
                <li style="margin-bottom: 8px;">Contact the restaurant for assistance</li>
                <li style="margin-bottom: 8px;">Update order status in the system</li>
                <li>Assign delivery personnel</li>
              </ul>
            </div>

            <!-- Contact Info -->
            <div style="text-align: center; margin: 40px 0 20px 0;">
              <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">Need help? Contact support:</p>
              <div style="display: flex; justify-content: center; gap: 20px;">
                <div style="text-align: center;">
                  <span style="font-size: 20px; color: #D57A1F;">📧</span>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">support@choptym.com</p>
                </div>
                <div style="text-align: center;">
                  <span style="font-size: 20px; color: #D57A1F;">📞</span>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">+237 670 416 449</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-size: 12px;">
              © 2024 ChopTym. All rights reserved. | Delicious meals delivered to your doorstep.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const adminEmail = process.env.ADMIN_EMAIL || 'choptym237@gmail.com';
    const emailResult = await sendEmailWithFallback(
      adminEmail,
      subject,
      html,
      { priority: process.env.EMAIL_PRIORITY || 'gmail' }
    );
    
    if (emailResult.success) {
      console.log(`✅ Admin payment pending notification sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`);
    } else {
      console.warn('❌ Failed to send admin payment pending notification:', emailResult.error);
    }
  } catch (error) {
    console.error('Error sending admin payment pending notification:', error);
  }
}

module.exports = {
  handlePaymentWebhook,
  FapshiService,
  sendPaymentConfirmationEmail,
  sendAdminPaymentNotification,
  sendAdminPaymentFailureNotification,
  sendAdminPaymentPendingNotification
}; 