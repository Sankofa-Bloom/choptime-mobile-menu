const express = require('express');
const cors = require('cors');
const { handlePaymentWebhook } = require('./payment-webhook');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Webhook server is running' });
});

// Fapshi payment webhook endpoint
app.post('/api/payment-webhook', async (req, res) => {
  try {
    console.log('Received webhook:', req.body);
    
    const result = await handlePaymentWebhook({
      body: req.body,
      headers: req.headers
    });

    res.status(result.status).json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      status: 500, 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Payment success page endpoint
app.get('/payment-success', (req, res) => {
  const { reference } = req.query;
  
  // Redirect to the React app's payment success page
  res.redirect(`http://localhost:3000/payment-success?reference=${reference}`);
});

// Start server
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/api/payment-webhook`);
  console.log(`Payment success redirect: http://localhost:${PORT}/payment-success`);
});

module.exports = app; 