// Load environment-specific configuration
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${env}` });
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const { sendEmailWithFallback, createOrderConfirmationEmail: createDualOrderConfirmationEmail } = require('./dual-email-service');
const FapshiAPI = require('./fapshi-api');
const { 
  setupSecurityMiddleware, 
  corsOptions, 
  validatePaymentWebhook,
  sanitizeInput,
  generateJWT,
  verifyJWT
} = require('./security-config');
const apiRoutes = require('./api-routes');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://qrpukxmzdwkepfpuapzh.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5MTgsImV4cCI6MjA2NjM5MzkxOH0.Ix3k_w-nbJQ29FcuP3YYRT_K6ZC7RY2p80VKaDA0JEs';
const supabase = createClient(supabaseUrl, supabaseKey);

// Load environment variables
const DEFAULT_PAYMENT_METHOD = process.env.DEFAULT_PAYMENT_METHOD || 'fapshi';
const ENABLE_CAMPAY_PAYMENTS = process.env.ENABLE_CAMPAY_PAYMENTS === 'true' || false;
const ENABLE_FAPSHI_PAYMENTS = process.env.ENABLE_FAPSHI_PAYMENTS === 'true' || true;

// Campay API configuration
const CAMPAY_API_KEY = process.env.CAMPAY_API_KEY;
const CAMPAY_TEST_MODE = process.env.CAMPAY_TEST_MODE === 'true' || false;
const CAMPAY_BASE_URL = process.env.CAMPAY_BASE_URL || (CAMPAY_TEST_MODE ? 'https://sandbox-api.campay.net' : 'https://api.campay.net');

// Fapshi API configuration
const FAPSHI_API_USER = process.env.FAPSHI_API_USER;
const FAPSHI_API_KEY = process.env.FAPSHI_API_KEY;
const FAPSHI_TEST_MODE = process.env.FAPSHI_TEST_MODE === 'true' || false;
const FAPSHI_BASE_URL = process.env.FAPSHI_BASE_URL || 'https://api.fapshi.com';

const app = express();

// Setup comprehensive security middleware
setupSecurityMiddleware(app);

// CORS configuration
app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Favicon endpoint to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response
});

// API routes for frontend data access
app.use('/api', apiRoutes);

// Input validation middleware
const validatePaymentRequest = (req, res, next) => {
  const { amount, currency, reference, description, customer, callback_url, return_url } = req.body;
  
  // Sanitize input
  const sanitizedBody = {};
  Object.keys(req.body).forEach(key => {
    sanitizedBody[key] = sanitizeInput(req.body[key]);
  });
  req.body = sanitizedBody;
  
  // Validate required fields
  if (!amount || !currency || !reference || !description || !customer) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: amount, currency, reference, description, customer'
    });
  }
  
  // Validate amount
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid amount: must be a positive number'
    });
  }
  
  // Validate currency
  if (typeof currency !== 'string' || currency.length !== 3) {
    return res.status(400).json({
      success: false,
      error: 'Invalid currency: must be a 3-letter currency code'
    });
  }
  
  // Validate customer data
  if (!customer.name || !customer.phone || !customer.email) {
    return res.status(400).json({
      success: false,
      error: 'Missing customer information: name, phone, email required'
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }
  
  next();
};

console.log('Unified Payment API Server Starting...');
console.log('Default Payment Method:', DEFAULT_PAYMENT_METHOD);
console.log('Campay Payments Enabled:', ENABLE_CAMPAY_PAYMENTS);
console.log('Fapshi Payments Enabled:', ENABLE_FAPSHI_PAYMENTS);
console.log('Campay Test Mode:', CAMPAY_TEST_MODE);
console.log('Fapshi Test Mode:', FAPSHI_TEST_MODE);

// Security validation
if (ENABLE_CAMPAY_PAYMENTS && !CAMPAY_API_KEY) {
  console.warn('⚠️  WARNING: Campay payments enabled but no API key configured');
}
if (ENABLE_FAPSHI_PAYMENTS && (!FAPSHI_API_USER || !FAPSHI_API_KEY)) {
  console.warn('⚠️  WARNING: Fapshi payments enabled but API credentials not configured');
}

// Function to check for incomplete payments
async function checkIncompletePayments() {
  try {
    console.log('🔍 Checking for incomplete payments...');
    
    // Get orders that have been pending for more than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_status', 'pending')
      .lt('created_at', thirtyMinutesAgo);

    if (ordersError) {
      console.error('Error fetching pending orders:', ordersError);
      return;
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      console.log('✅ No incomplete payments found');
      return;
    }

    console.log(`Found ${pendingOrders.length} incomplete payments`);

    // Check each pending order with the payment gateway
    for (const order of pendingOrders) {
      try {
        let gatewayStatus = null;
        
        if (order.payment_method === 'fapshi') {
          const fapshiAPI = new FapshiAPI();
          const statusResponse = await fapshiAPI.checkPaymentStatus(order.order_reference);
          if (statusResponse.success) {
            gatewayStatus = statusResponse.data.status;
          }
        }

        // If gateway status is different, update the order
        if (gatewayStatus && gatewayStatus !== order.payment_status) {
          console.log(`Updating order ${order.order_reference} status from ${order.payment_status} to ${gatewayStatus}`);
          
          const updateData = {
            payment_status: gatewayStatus,
            updated_at: new Date().toISOString()
          };

          if (gatewayStatus === 'success') {
            updateData.status = 'confirmed';
          } else if (gatewayStatus === 'failed') {
            updateData.status = 'failed';
          }

          const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('order_reference', order.order_reference);

          if (!updateError) {
            console.log(`✅ Updated order ${order.order_reference} status to ${gatewayStatus}`);
          }
        } else if (!gatewayStatus) {
          // If we can't get gateway status, send admin notification for incomplete payment
          console.log(`⚠️ Order ${order.order_reference} still pending, sending admin notification`);
          
          try {
            const { sendAdminPaymentFailureNotification } = require('./payment-webhook');
            await sendAdminPaymentFailureNotification(
              order.order_reference, 
              order.total_amount, 
              'XAF', 
              {
                name: order.customer_name,
                email: order.customer_email,
                phone: order.customer_phone
              }
            );
          } catch (emailError) {
            console.warn('Error sending incomplete payment notification:', emailError);
          }
        }
      } catch (error) {
        console.error(`Error processing order ${order.order_reference}:`, error);
      }
    }
  } catch (error) {
    console.error('Error checking incomplete payments:', error);
  }
}

// Schedule incomplete payment checks (every 15 minutes)
setInterval(checkIncompletePayments, 15 * 60 * 1000);

// Run initial check after 5 minutes
setTimeout(checkIncompletePayments, 5 * 60 * 1000);

// Unified payment initialization endpoint
app.post('/api/payment/initialize', validatePaymentRequest, async (req, res) => {
  try {
    console.log('Received payment initialization request:', req.body);
    
    const { amount, currency, reference, description, customer, callback_url, return_url, paymentMethod } = req.body;
    
    // Determine which payment method to use
    const method = paymentMethod || DEFAULT_PAYMENT_METHOD;
    
    if (method === 'campay' && !ENABLE_CAMPAY_PAYMENTS) {
      return res.status(400).json({
        success: false,
        error: 'Campay payments are disabled'
      });
    }
    
    if (method === 'campay' && !CAMPAY_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Campay API key not configured'
      });
    }
    
    if (method === 'fapshi' && !ENABLE_FAPSHI_PAYMENTS) {
      return res.status(400).json({
        success: false,
        error: 'Fapshi payments are disabled'
      });
    }
    
    if (method === 'fapshi' && (!FAPSHI_API_USER || !FAPSHI_API_KEY)) {
      return res.status(500).json({
        success: false,
        error: 'Fapshi API credentials not configured'
      });
    }

    if (method === 'campay') {
      // Handle Campay payment
      const campayRequest = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toUpperCase(),
        external_reference: reference,
        description: description,
        callback_url: callback_url,
        return_url: return_url,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email,
      };

      console.log('Sending request to Campay:', campayRequest);

      // For now, use mock response since Campay API is not accessible
      const mockResponse = {
        success: true,
        data: {
          payment_url: null,
          reference: reference,
          status: 'success',
          transaction_id: `mock_campay_${Date.now()}`
        }
      };

      console.log('Campay mock response:', mockResponse);
      res.json(mockResponse);
      
    } else if (method === 'fapshi') {
      // Handle Fapshi payment using real API
      const fapshiAPI = new FapshiAPI();
      
      // Handle Fapshi payment
      const fapshiRequest = {
        amount: amount,
        currency: currency.toUpperCase(),
        reference: reference,
        description: description,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        },
        callback_url: callback_url,
        return_url: `${process.env.FAPSHI_CALLBACK_URL?.replace('/api/payment-webhook', '') || 'http://localhost:8080'}/payment-redirect/${reference}`
      };

      console.log('Sending request to Fapshi:', fapshiRequest);

      const fapshiResponse = await fapshiAPI.initializePayment(fapshiRequest);
      
      if (fapshiResponse.success) {
        console.log('Fapshi payment initialized successfully:', fapshiResponse);
        res.json(fapshiResponse);
      } else {
        console.error('Fapshi payment initialization failed:', fapshiResponse.error);
        res.status(500).json({
          success: false,
          error: 'Fapshi payment initialization failed: ' + fapshiResponse.error
        });
      }
      
    } else {
      res.status(400).json({
        success: false,
        error: `Unsupported payment method: ${method}`
      });
    }
  } catch (error) {
    console.error('Payment API error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment initialization failed: ' + error.message
    });
  }
});

// Campay-specific endpoint (for backward compatibility)
app.post('/api/campay/initialize', validatePaymentRequest, async (req, res) => {
  req.body.paymentMethod = 'campay';
  
  try {
    const { amount, currency, reference, description, customer, callback_url, return_url } = req.body;
    
    if (!ENABLE_CAMPAY_PAYMENTS) {
      return res.status(400).json({
        success: false,
        error: 'Campay payments are disabled'
      });
    }
    
    if (!CAMPAY_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Campay API key not configured'
      });
    }

    // Handle Campay payment
    const campayRequest = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toUpperCase(),
      external_reference: reference,
      description: description,
      callback_url: callback_url,
      return_url: return_url,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
    };

    console.log('Sending request to Campay:', campayRequest);

    // For now, use mock response since Campay API is not accessible
    const mockResponse = {
      success: true,
      data: {
        payment_url: null,
        reference: reference,
        status: 'success',
        transaction_id: `mock_campay_${Date.now()}`
      }
    };

    console.log('Campay mock response:', mockResponse);
    res.json(mockResponse);
    
  } catch (error) {
    console.error('Campay API error:', error);
    res.status(500).json({
      success: false,
      error: 'Campay payment initialization failed: ' + error.message
    });
  }
});

// Fapshi-specific endpoint (for backward compatibility)
app.post('/api/fapshi/initialize', validatePaymentRequest, async (req, res) => {
  req.body.paymentMethod = 'fapshi';
  
  try {
    const { amount, currency, reference, description, customer, callback_url, return_url } = req.body;
    
    if (!ENABLE_FAPSHI_PAYMENTS) {
      return res.status(400).json({
        success: false,
        error: 'Fapshi payments are disabled'
      });
    }
    
    if (!FAPSHI_API_USER || !FAPSHI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Fapshi API credentials not configured'
      });
    }

    // Handle Fapshi payment using real API
    const fapshiAPI = new FapshiAPI();
    
    const fapshiRequest = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toUpperCase(),
      reference: reference,
      description: description,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      },
      callback_url: callback_url,
      return_url: return_url
    };

    console.log('Sending request to Fapshi:', fapshiRequest);

    const fapshiResponse = await fapshiAPI.initializePayment(fapshiRequest);
    
    if (fapshiResponse.success) {
      console.log('Fapshi payment initialized successfully:', fapshiResponse);
      res.json(fapshiResponse);
    } else {
      console.error('Fapshi payment initialization failed:', fapshiResponse.error);
      res.status(500).json({
        success: false,
        error: 'Fapshi payment initialization failed: ' + fapshiResponse.error
      });
    }
    
  } catch (error) {
    console.error('Fapshi API error:', error);
    res.status(500).json({
      success: false,
      error: 'Fapshi payment initialization failed: ' + error.message
    });
  }
});

// Payment status check endpoint
app.get('/api/payment/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    
    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Payment reference is required'
      });
    }

    console.log(`Checking payment status for reference: ${reference}`);

    // Check database for order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', reference)
      .single();

    if (orderError || !order) {
      // Check custom orders table
      const { data: customOrder, error: customOrderError } = await supabase
        .from('custom_orders')
        .select('*')
        .eq('order_reference', reference)
        .single();

      if (customOrderError || !customOrder) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      return res.json({
        success: true,
        data: {
          reference: reference,
          status: customOrder.status || 'pending',
          payment_status: customOrder.payment_status || 'pending',
          amount: customOrder.total_amount,
          currency: 'XAF',
          created_at: customOrder.created_at,
          updated_at: customOrder.updated_at
        }
      });
    }

    // Check with payment gateway for latest status
    let gatewayStatus = null;
    if (order.payment_method === 'fapshi') {
      const fapshiAPI = new FapshiAPI();
      try {
        const statusResponse = await fapshiAPI.checkPaymentStatus(reference);
        if (statusResponse.success) {
          gatewayStatus = statusResponse.data.status;
        }
      } catch (error) {
        console.warn('Failed to check Fapshi status:', error.message);
      }
    }

    // Determine final status
    let finalStatus = order.status;
    let paymentStatus = order.payment_status;

    // If gateway status is different from database, update database
    if (gatewayStatus && gatewayStatus !== order.payment_status) {
      console.log(`Updating payment status from ${order.payment_status} to ${gatewayStatus}`);
      
      const updateData = {
        payment_status: gatewayStatus,
        updated_at: new Date().toISOString()
      };

      if (gatewayStatus === 'success') {
        updateData.status = 'confirmed';
      } else if (gatewayStatus === 'failed') {
        updateData.status = 'failed';
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('order_reference', reference);

      if (!updateError) {
        finalStatus = updateData.status;
        paymentStatus = gatewayStatus;
      }
    }

    // Check for incomplete payments (pending for more than 30 minutes)
    const orderTime = new Date(order.created_at);
    const currentTime = new Date();
    const timeDiff = currentTime - orderTime;
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

    if (paymentStatus === 'pending' && timeDiff > thirtyMinutes) {
      console.log(`Payment ${reference} has been pending for more than 30 minutes`);
      
      // Send admin notification for incomplete payment
      try {
        const { sendAdminPaymentFailureNotification } = require('./payment-webhook');
        await sendAdminPaymentFailureNotification(
          reference, 
          order.total_amount, 
          'XAF', 
          {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone
          }
        );
      } catch (emailError) {
        console.warn('Error sending incomplete payment notification:', emailError);
      }
    }

    res.json({
      success: true,
      data: {
        reference: reference,
        status: finalStatus,
        payment_status: paymentStatus,
        amount: order.total_amount,
        currency: 'XAF',
        created_at: order.created_at,
        updated_at: order.updated_at,
        gateway_status: gatewayStatus
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check payment status: ' + error.message
    });
  }
});

// Campay status endpoint (for backward compatibility)
app.get('/api/campay/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const method = 'campay';
    
    console.log('Checking Campay payment status for:', reference);

    // Mock status response
    const mockStatus = {
      success: true,
      data: {
        reference: reference,
        status: 'success',
        amount: 100000, // 1000 XAF in cents
        currency: 'XAF',
        customer: {
          name: 'Test Customer',
          phone: '237612345678',
          email: 'test@example.com'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        transaction_id: `mock_${method}_${Date.now()}`
      }
    };

    console.log('Campay status check response:', mockStatus);
    res.json(mockStatus);
    
  } catch (error) {
    console.error('Campay status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Campay status check failed: ' + error.message
    });
  }
});

// Fapshi status endpoint (for backward compatibility)
app.get('/api/fapshi/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const method = 'fapshi';
    
    console.log('Checking Fapshi payment status for:', reference);

    // Mock status response
    const mockStatus = {
      success: true,
      data: {
        reference: reference,
        status: 'success',
        amount: 100000, // 1000 XAF in cents
        currency: 'XAF',
        customer: {
          name: 'Test Customer',
          phone: '237612345678',
          email: 'test@example.com'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        transaction_id: `mock_${method}_${Date.now()}`
      }
    };

    console.log('Fapshi status check response:', mockStatus);
    res.json(mockStatus);
    
  } catch (error) {
    console.error('Fapshi status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Fapshi status check failed: ' + error.message
    });
  }
});

// Email endpoints
app.post('/api/email/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    
    console.log('📧 Sending email via dual service to:', to);
    console.log('Subject:', subject);
    
    // Send email using dual service with fallback
    const emailResult = await sendEmailWithFallback(
      to, 
      subject, 
      html, 
      { priority: process.env.EMAIL_PRIORITY || 'gmail' }
    );
    
    if (emailResult.success) {
      console.log(`✅ Email sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`);
      res.json({
        success: true,
        message: `Email sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`,
        messageId: emailResult.messageId,
        provider: emailResult.provider,
        fallback: emailResult.fallback
      });
    } else {
      console.error('❌ Email failed:', emailResult.error);
      res.status(500).json({
        success: false,
        error: 'Email failed: ' + emailResult.error
      });
    }
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      error: 'Email sending failed: ' + error.message
    });
  }
});

// Order confirmation email endpoint
app.post('/api/email/send-order-confirmation', async (req, res) => {
  try {
    const { orderData } = req.body;
    
    console.log('📧 Sending order confirmation email via dual service:', orderData);
    
    // Create enhanced email content using dual service template
    const subject = `Order Confirmation - ${orderData.orderReference}`;
    const html = createDualOrderConfirmationEmail(orderData);
    
    // Send email using dual service with fallback
    const emailResult = await sendEmailWithFallback(
      orderData.customerEmail, 
      subject, 
      html, 
      { priority: process.env.EMAIL_PRIORITY || 'gmail' }
    );
    
    if (emailResult.success) {
      console.log(`✅ Order confirmation email sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`);
      res.json({
        success: true,
        message: `Order confirmation email sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`,
        messageId: emailResult.messageId,
        provider: emailResult.provider,
        fallback: emailResult.fallback
      });
    } else {
      console.error('❌ Order confirmation email failed:', emailResult.error);
      res.status(500).json({
        success: false,
        error: 'Order confirmation email failed: ' + emailResult.error
      });
    }
  } catch (error) {
    console.error('Order confirmation email error:', error);
    res.status(500).json({
      success: false,
      error: 'Order confirmation email failed: ' + error.message
    });
  }
});

// Admin notification email endpoint
app.post('/api/email/send-admin-notification', async (req, res) => {
  try {
    const { orderData } = req.body;
    
    console.log('📧 Sending admin notification email via dual service:', orderData);
    
    // Create enhanced admin notification email
    const subject = `New Order - ${orderData.orderReference}`;
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
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Action required - Please process this order</p>
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
                  <span style="color: #D57A1F; font-size: 20px; font-weight: 600;">${orderData.totalAmount} FCFA</span>
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
    
    // Send to admin email using dual service
    const adminEmail = process.env.ADMIN_EMAIL || 'choptym237@gmail.com';
    const emailResult = await sendEmailWithFallback(
      adminEmail, 
      subject, 
      html, 
      { priority: process.env.EMAIL_PRIORITY || 'gmail' }
    );
    
    if (emailResult.success) {
      console.log(`✅ Admin notification email sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`);
      res.json({
        success: true,
        message: `Admin notification email sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`,
        messageId: emailResult.messageId,
        provider: emailResult.provider,
        fallback: emailResult.fallback
      });
    } else {
      console.error('❌ Admin notification email failed:', emailResult.error);
      res.status(500).json({
        success: false,
        error: 'Admin notification email failed: ' + emailResult.error
      });
    }
  } catch (error) {
    console.error('Admin notification email error:', error);
    res.status(500).json({
      success: false,
      error: 'Admin notification email failed: ' + error.message
    });
  }
});

// Order status update email endpoint
app.post('/api/email/send-status-update', async (req, res) => {
  try {
    const { orderData, status, message } = req.body;
    
    console.log('📧 Sending order status update email via dual service:', { orderData, status, message });
    
    // Create enhanced status update email
    const subject = `Order Status Update - ${orderData.orderReference}`;
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update - ChopTym</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #D57A1F 0%, #E89A4D 100%); padding: 30px; text-align: center;">
            <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 40px; color: white;">📊</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Order Status Update!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Your order status has been updated</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Hello ${orderData.customerName}! 👋</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Your order status has been updated. Here are the latest details:
            </p>

            <!-- Status Update Card -->
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border-left: 5px solid #D57A1F;">
              <h3 style="color: #D57A1F; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
                <span style="margin-right: 10px;">📋</span>
                Status Update
              </h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Order Reference</p>
                  <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${orderData.orderReference}</p>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Current Status</p>
                  <p style="margin: 5px 0 0 0; color: #D57A1F; font-size: 16px; font-weight: 600;">${status}</p>
                </div>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Update Message</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; line-height: 1.5;">${message}</p>
              </div>
            </div>

            <!-- Order Details -->
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
              <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Order Details</h3>
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 15px;">🍽️</span>
                <div>
                  <p style="margin: 0; color: #2c3e50; font-size: 18px; font-weight: 600;">${orderData.dishName}</p>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Quantity: ${orderData.quantity} | Restaurant: ${orderData.restaurantName}</p>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #e9ecef;">
                <span style="color: #6c757d; font-size: 14px;">Total Amount:</span>
                <span style="color: #D57A1F; font-size: 20px; font-weight: 600;">${orderData.totalAmount} FCFA</span>
              </div>
            </div>

            <!-- Contact Info -->
            <div style="text-align: center; margin: 40px 0 20px 0;">
              <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">Need help? Contact us:</p>
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
    
    // Send email using dual service with fallback
    const emailResult = await sendEmailWithFallback(
      orderData.customerEmail, 
      subject, 
      html, 
      { priority: process.env.EMAIL_PRIORITY || 'gmail' }
    );
    
    if (emailResult.success) {
      console.log(`✅ Order status update email sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`);
      res.json({
        success: true,
        message: `Order status update email sent successfully via ${emailResult.provider.toUpperCase()}${emailResult.fallback ? ' (fallback)' : ''}`,
        messageId: emailResult.messageId,
        provider: emailResult.provider,
        fallback: emailResult.fallback
      });
    } else {
      console.error('❌ Order status update email failed:', emailResult.error);
      res.status(500).json({
        success: false,
        error: 'Order status update email failed: ' + emailResult.error
      });
    }
  } catch (error) {
    console.error('Order status update email error:', error);
    res.status(500).json({
      success: false,
      error: 'Order status update email failed: ' + error.message
    });
  }
});

// Dual email service test endpoint
app.post('/api/email/test-dual', async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: to (email address)'
      });
    }

    console.log('🧪 Testing dual email service...');
    console.log('Test email to:', to);

    const results = await sendEmailWithFallback(to, 'Test Email', 'This is a test email from the dual email service.', { priority: 'gmail' });
    
    res.json({
      success: results.success,
      message: results.success ? 'Email service test completed' : 'Email service test failed',
      messageId: results.messageId,
      provider: results.provider,
      fallback: results.fallback
    });
  } catch (error) {
    console.error('Dual email test error:', error);
    res.status(500).json({
      success: false,
      error: 'Dual email test failed: ' + error.message
    });
  }
});

// Dual email service send endpoint
app.post('/api/email/send-dual', async (req, res) => {
  try {
    const { to, subject, html, priority = 'gmail' } = req.body;
    
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      });
    }

    console.log('📧 Sending email via dual service...');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Priority:', priority);

    const result = await sendEmailWithFallback(to, subject, html, { priority });
    
    if (result.success) {
      res.json({
        success: true,
        message: `Email sent successfully via ${result.provider.toUpperCase()}${result.fallback ? ' (fallback)' : ''}`,
        messageId: result.messageId,
        provider: result.provider,
        fallback: result.fallback
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email: ' + result.error
      });
    }
  } catch (error) {
    console.error('Dual email send error:', error);
    res.status(500).json({
      success: false,
      error: 'Dual email send failed: ' + error.message
    });
  }
});

// Fapshi-specific status endpoint
app.get('/api/fapshi/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    
    console.log('Checking Fapshi payment status for:', reference);

    const fapshiAPI = new FapshiAPI();
    const statusResponse = await fapshiAPI.checkPaymentStatus(reference);
    
    if (statusResponse.success) {
      console.log('Fapshi status check response:', statusResponse);
      res.json(statusResponse);
    } else {
      console.error('Fapshi status check failed:', statusResponse.error);
      res.status(500).json({
        success: false,
        error: 'Fapshi status check failed: ' + statusResponse.error
      });
    }
    
  } catch (error) {
    console.error('Fapshi payment status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed: ' + error.message
    });
  }
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Unified Payment API server running on port ${PORT}`);
  console.log(`Initialize endpoint: http://localhost:${PORT}/api/payment/initialize`);
  console.log(`Status endpoint: http://localhost:${PORT}/api/payment/status/:reference`);
  console.log(`Email endpoints: http://localhost:${PORT}/api/email/*`);
});

module.exports = app; 