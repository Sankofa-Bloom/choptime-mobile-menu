require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendEmail, createOrderConfirmationEmail, createAdminNotificationEmail } = require('./email-service');

const app = express();

app.use(cors({
  origin: 'http://localhost:8081',
  credentials: true
}));

app.use(express.json());

console.log('Mock Campay API Server Starting...');

// Test endpoint
app.get('/api/campay/test', (req, res) => {
  res.json({ 
    message: 'Mock Campay API server is running!',
    testMode: true,
    baseUrl: 'mock-server'
  });
});

// Mock payment initialization
app.post('/api/campay/initialize', async (req, res) => {
  try {
    console.log('Received mock payment initialization request:', req.body);
    
    const { amount, currency, reference, description, customer, callback_url, return_url } = req.body;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For testing: simulate immediate success (no redirect)
    // For production: this would return a real payment URL
    const isTestMode = process.env.NODE_ENV === 'development' || true; // Force test mode for now
    
    if (isTestMode) {
      // Mock successful response - simulate immediate payment success for testing
      res.json({
        success: true,
        data: {
          payment_url: null, // No redirect needed for mock
          reference: reference,
          status: 'success', // Simulate immediate success
          transaction_id: `mock_${Date.now()}`
        }
      });
    } else {
      // Production mode - would return real payment URL
      res.json({
        success: true,
        data: {
          payment_url: `https://api.campay.net/pay/${reference}`,
          reference: reference,
          status: 'pending',
          transaction_id: `mock_${Date.now()}`
        }
      });
    }
  } catch (error) {
    console.error('Mock API error:', error);
    res.status(500).json({
      success: false,
      error: 'Mock payment initialization failed: ' + error.message
    });
  }
});

// Mock payment status check
app.get('/api/campay/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    console.log('Checking mock payment status for:', reference);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock status response (randomly return success or pending)
    const isSuccess = Math.random() > 0.7; // 30% chance of success
    
    res.json({
      success: true,
      data: {
        reference: reference,
        status: isSuccess ? 'success' : 'pending',
        amount: 100000, // 1000 XAF in cents
        currency: 'XAF',
        customer: {
          name: 'Test Customer',
          phone: '237612345678',
          email: 'test@example.com'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        transaction_id: `mock_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Mock status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Mock status check failed: ' + error.message
    });
  }
});

// Email endpoints
app.post('/api/email/send-order-confirmation', async (req, res) => {
  try {
    const { orderData } = req.body;
    
    const html = createOrderConfirmationEmail(orderData);
    const result = await sendEmail(
      orderData.customerEmail,
      'Order Confirmed - KwataLink',
      html
    );
    
    res.json({ success: result.success, messageId: result.messageId });
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/email/send-admin-notification', async (req, res) => {
  try {
    const { orderData } = req.body;
    
    const html = createAdminNotificationEmail(orderData);
    const result = await sendEmail(
      process.env.ADMIN_EMAIL || 'admin@kwatalink.com',
      'New Order Notification - KwataLink',
      html
    );
    
    res.json({ success: result.success, messageId: result.messageId });
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Mock Campay API server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/campay/test`);
  console.log(`Initialize endpoint: http://localhost:${PORT}/api/campay/initialize`);
  console.log(`Status endpoint: http://localhost:${PORT}/api/campay/status/:reference`);
  console.log(`Email endpoints: http://localhost:${PORT}/api/email/*`);
});

module.exports = app; 