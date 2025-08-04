const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Load environment variables
require('dotenv').config();

// Campay API configuration
const CAMPAY_API_KEY = process.env.CAMPAY_API_KEY;
const CAMPAY_TEST_MODE = process.env.CAMPAY_TEST_MODE === 'true' || false;
const CAMPAY_BASE_URL = process.env.CAMPAY_BASE_URL || (CAMPAY_TEST_MODE ? 'https://sandbox-api.campay.net' : 'https://api.campay.net');

console.log('Campay API Server Starting...');
console.log('Test Mode:', CAMPAY_TEST_MODE);
console.log('Base URL:', CAMPAY_BASE_URL);

// Test endpoint
app.get('/api/campay/test', (req, res) => {
  res.json({ 
    message: 'Campay API server is running!',
    testMode: CAMPAY_TEST_MODE,
    baseUrl: CAMPAY_BASE_URL
  });
});

// Initialize Campay payment
app.post('/api/campay/initialize', async (req, res) => {
  try {
    console.log('Received payment initialization request:', req.body);
    
    const { amount, currency, reference, description, customer, callback_url, return_url } = req.body;

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

    const response = await fetch(`${CAMPAY_BASE_URL}/api/collect/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${CAMPAY_API_KEY}`
      },
      body: JSON.stringify(campayRequest)
    });

    const data = await response.json();
    console.log('Campay response:', data);

    if (response.ok && data.status === 'success') {
      res.json({
        success: true,
        data: {
          payment_url: data.payment_url,
          reference: reference,
          status: 'pending',
          transaction_id: data.transaction_id
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: data.message || 'Failed to initialize payment'
      });
    }
  } catch (error) {
    console.error('Campay API error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment initialization failed: ' + error.message
    });
  }
});

// Check payment status
app.get('/api/campay/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    console.log('Checking payment status for:', reference);

    const response = await fetch(`${CAMPAY_BASE_URL}/api/transaction/${reference}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${CAMPAY_API_KEY}`
      }
    });

    const data = await response.json();
    console.log('Status check response:', data);

    if (response.ok && data.status === 'success') {
      res.json({
        success: true,
        data: {
          reference: data.external_reference,
          status: data.status,
          amount: data.amount,
          currency: data.currency,
          customer: {
            name: data.customer_name || '',
            phone: data.customer_phone || '',
            email: data.customer_email || ''
          },
          created_at: data.created_at,
          updated_at: data.updated_at,
          transaction_id: data.transaction_id
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: data.message || 'Failed to check payment status'
      });
    }
  } catch (error) {
    console.error('Campay status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed: ' + error.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Campay API server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/campay/test`);
  console.log(`Initialize endpoint: http://localhost:${PORT}/api/campay/initialize`);
  console.log(`Status endpoint: http://localhost:${PORT}/api/campay/status/:reference`);
});

module.exports = app; 