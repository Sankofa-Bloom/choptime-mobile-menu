require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
  credentials: true
}));
app.use(express.json());

// Campay API configuration
const CAMPAY_API_KEY = process.env.CAMPAY_API_KEY || '2cb88565d515795af1dccf928126f82526bfb34a';
const CAMPAY_TEST_MODE = process.env.CAMPAY_TEST_MODE === 'true';
const CAMPAY_BASE_URL = CAMPAY_TEST_MODE ? 'https://sandbox-api.campay.net' : 'https://api.campay.net';

// Initialize Campay payment
app.post('/api/campay/initialize', async (req, res) => {
  try {
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

    const response = await fetch(`${CAMPAY_BASE_URL}/api/collect/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${CAMPAY_API_KEY}`
      },
      body: JSON.stringify(campayRequest)
    });

    const data = await response.json();

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
      error: 'Payment initialization failed'
    });
  }
});

// Check payment status
app.get('/api/campay/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await fetch(`${CAMPAY_BASE_URL}/api/transaction/${reference}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${CAMPAY_API_KEY}`
      }
    });

    const data = await response.json();

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
      error: 'Status check failed'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Campay API server running on port ${PORT}`);
  console.log(`Campay Test Mode: ${CAMPAY_TEST_MODE}`);
  console.log(`Campay Base URL: ${CAMPAY_BASE_URL}`);
});

module.exports = app; 