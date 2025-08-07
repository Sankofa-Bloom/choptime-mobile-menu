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
      headers: req.headers,
      ip: req.ip,
      get: (header) => req.get(header)
    });

    // Return the webhook processing result
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

// Payment redirect endpoint - handles redirects based on payment status
app.get('/payment-redirect/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const { status } = req.query;
    
    console.log(`Payment redirect for reference: ${reference}, status: ${status}`);
    
    // Determine redirect URL based on payment status
    let redirectUrl;
    
    switch (status) {
      case 'success':
        redirectUrl = `${process.env.FAPSHI_RETURN_URL || 'https://choptym.com/payment-success'}?reference=${reference}&status=success`;
        break;
      case 'failed':
        redirectUrl = `${process.env.FAPSHI_RETURN_URL || 'https://choptym.com/payment-success'}?reference=${reference}&status=failed&error=payment_failed`;
        break;
      case 'pending':
        redirectUrl = `${process.env.FAPSHI_RETURN_URL || 'https://choptym.com/payment-success'}?reference=${reference}&status=pending`;
        break;
      default:
        redirectUrl = `${process.env.FAPSHI_RETURN_URL || 'https://choptym.com/payment-success'}?reference=${reference}&status=unknown`;
    }
    
    console.log(`Redirecting to: ${redirectUrl}`);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Payment redirect error:', error);
    // Fallback redirect to success page with error
    const fallbackUrl = `${process.env.FAPSHI_RETURN_URL || 'https://choptym.com/payment-success'}?error=redirect_failed`;
    res.redirect(fallbackUrl);
  }
});

// Payment success page endpoint (legacy)
app.get('/payment-success', (req, res) => {
  const { reference, status } = req.query;
  
  // Redirect to the React app's payment success page
  const redirectUrl = `${process.env.FAPSHI_RETURN_URL || 'https://choptym.com/payment-success'}?reference=${reference || ''}&status=${status || 'success'}`;
  res.redirect(redirectUrl);
});

// Start server
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/api/payment-webhook`);
  console.log(`Payment redirect endpoint: http://localhost:${PORT}/payment-redirect/:reference`);
  console.log(`Payment success redirect: http://localhost:${PORT}/payment-success`);
});

module.exports = app; 