require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { sendEmail, createOrderConfirmationEmail, createAdminNotificationEmail, createOrderStatusUpdateEmail } = require('./email-service');
const { 
  setupSecurityMiddleware, 
  corsOptions, 
  validatePaymentWebhook,
  sanitizeInput,
  generateJWT,
  verifyJWT
} = require('./security-config');
const apiRoutes = require('./api-routes');

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
const FAPSHI_TEST_MODE = process.env.FAPSHI_TEST_MODE === 'true' || true;
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
  
  // Validate phone format (basic validation)
  if (!customer.phone || customer.phone.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number'
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

// Test endpoint
app.get('/api/payment/test', (req, res) => {
  res.json({ 
    message: 'Unified Payment API server is running!',
    testMode: true,
    baseUrl: 'unified-server',
    defaultPaymentMethod: DEFAULT_PAYMENT_METHOD,
    campayEnabled: ENABLE_CAMPAY_PAYMENTS,
    fapshiEnabled: ENABLE_FAPSHI_PAYMENTS,
    campayTestMode: CAMPAY_TEST_MODE,
    fapshiTestMode: FAPSHI_TEST_MODE
  });
});

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
      // Handle Fapshi payment
      const fapshiRequest = {
        amount: Math.round(amount * 100), // Convert to cents
        email: customer.email,
        redirectUrl: return_url,
        userId: customer.phone,
        externalId: reference,
        message: description,
        currency: currency.toUpperCase(),
        phone: customer.phone,
        callbackUrl: callback_url
      };

      console.log('Sending request to Fapshi:', fapshiRequest);

      // For now, use mock response for Fapshi as well
      const mockResponse = {
        success: true,
        data: {
          payment_url: `https://fapshi.com/pay/${reference}`,
          reference: reference,
          status: 'pending',
          transaction_id: `mock_fapshi_${Date.now()}`
        }
      };

      console.log('Fapshi mock response:', mockResponse);
      res.json(mockResponse);
      
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

    // Handle Fapshi payment
    const fapshiRequest = {
      amount: Math.round(amount * 100), // Convert to cents
      email: customer.email,
      redirectUrl: return_url,
      userId: customer.phone,
      externalId: reference,
      message: description,
      currency: currency.toUpperCase(),
      phone: customer.phone,
      callbackUrl: callback_url
    };

    console.log('Sending request to Fapshi:', fapshiRequest);

    // For now, use mock response for Fapshi as well
    const mockResponse = {
      success: true,
      data: {
        payment_url: `https://fapshi.com/pay/${reference}`,
        reference: reference,
        status: 'pending',
        transaction_id: `mock_fapshi_${Date.now()}`
      }
    };

    console.log('Fapshi mock response:', mockResponse);
    res.json(mockResponse);
    
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
    const { paymentMethod } = req.query;
    
    const method = paymentMethod || DEFAULT_PAYMENT_METHOD;
    
    console.log('Checking payment status for:', reference, 'using method:', method);

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

    console.log('Status check response:', mockStatus);
    res.json(mockStatus);
    
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed: ' + error.message
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
    
    console.log('Sending email to:', to);
    console.log('Subject:', subject);
    
    // Mock email sending
    const emailSent = await sendEmail(to, subject, html, text);
    
    res.json({
      success: emailSent,
      message: emailSent ? 'Email sent successfully' : 'Failed to send email'
    });
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
    
    console.log('Sending order confirmation email:', orderData);
    
    // Create email content
    const subject = `Order Confirmation - ${orderData.orderReference}`;
    const html = `
      <h2>Order Confirmation</h2>
      <p>Dear ${orderData.customerName},</p>
      <p>Your order has been confirmed and is being prepared.</p>
      <p><strong>Order Reference:</strong> ${orderData.orderReference}</p>
      <p><strong>Restaurant:</strong> ${orderData.restaurantName}</p>
      <p><strong>Dish:</strong> ${orderData.dishName}</p>
      <p><strong>Quantity:</strong> ${orderData.quantity}</p>
      <p><strong>Total Amount:</strong> ${orderData.totalAmount}</p>
      <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
      <p>We'll notify you when your order is ready for delivery.</p>
    `;
    
    // Mock email sending
    const emailSent = await sendEmail(orderData.customerEmail, subject, html, html);
    
    res.json({
      success: emailSent,
      message: emailSent ? 'Order confirmation email sent successfully' : 'Failed to send order confirmation email'
    });
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
    
    console.log('Sending admin notification email:', orderData);
    
    // Create email content
    const subject = `New Order - ${orderData.orderReference}`;
    const html = `
      <h2>New Order Received</h2>
      <p><strong>Order Reference:</strong> ${orderData.orderReference}</p>
      <p><strong>Customer:</strong> ${orderData.customerName}</p>
      <p><strong>Email:</strong> ${orderData.customerEmail}</p>
      <p><strong>Phone:</strong> ${orderData.customerPhone}</p>
      <p><strong>Restaurant:</strong> ${orderData.restaurantName}</p>
      <p><strong>Dish:</strong> ${orderData.dishName}</p>
      <p><strong>Quantity:</strong> ${orderData.quantity}</p>
      <p><strong>Total Amount:</strong> ${orderData.totalAmount}</p>
      <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
    `;
    
    // Send to admin email
    const adminEmail = process.env.VITE_ADMIN_EMAIL || 'admin@choptym.com';
    const emailSent = await sendEmail(adminEmail, subject, html, html);
    
    res.json({
      success: emailSent,
      message: emailSent ? 'Admin notification email sent successfully' : 'Failed to send admin notification email'
    });
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
    
    console.log('Sending order status update email:', { orderData, status, message });
    
    // Create email content
    const subject = `Order Status Update - ${orderData.orderReference}`;
    const html = `
      <h2>Order Status Update</h2>
      <p>Dear ${orderData.customerName},</p>
      <p>Your order status has been updated.</p>
      <p><strong>Order Reference:</strong> ${orderData.orderReference}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Message:</strong> ${message}</p>
      <p>Thank you for choosing ChopTym!</p>
    `;
    
    // Mock email sending
    const emailSent = await sendEmail(orderData.customerEmail, subject, html, html);
    
    res.json({
      success: emailSent,
      message: emailSent ? 'Status update email sent successfully' : 'Failed to send status update email'
    });
  } catch (error) {
    console.error('Status update email error:', error);
    res.status(500).json({
      success: false,
      error: 'Status update email failed: ' + error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Unified Payment API server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/payment/test`);
  console.log(`Initialize endpoint: http://localhost:${PORT}/api/payment/initialize`);
  console.log(`Status endpoint: http://localhost:${PORT}/api/payment/status/:reference`);
  console.log(`Email endpoints: http://localhost:${PORT}/api/email/*`);
});

module.exports = app; 