# Fapshi Payment Integration Setup

This guide will help you set up Fapshi payments for your ChopTime application.

## What is Fapshi?

Fapshi is a payment gateway that enables businesses to accept **MTN MoMo** and **Orange Money** payments online in Cameroon. It provides a fast and secure way to collect funds from customers.

## Features Implemented

- ✅ Secure online payment processing
- ✅ MTN MoMo and Orange Money support
- ✅ Real-time payment status checking
- ✅ Payment success/failure handling
- ✅ Order confirmation emails
- ✅ Payment history tracking

## Environment Variables Setup

Add the following environment variables to your `.env` file:

```env
# Fapshi API Configuration
VITE_FAPSHI_API_KEY=your_fapshi_api_key_here
VITE_FAPSHI_TEST_MODE=true

# Optional: Custom callback URLs (if you have a custom domain)
VITE_FAPSHI_CALLBACK_URL=https://yourdomain.com/api/payment-webhook
VITE_FAPSHI_RETURN_URL=https://yourdomain.com/payment-success
```

### Getting Your Fapshi API Key

1. Visit [Fapshi Dashboard](https://dashboard.fapshi.com)
2. Create an account or sign in
3. Navigate to API Settings
4. Generate a new API key
5. Copy the API key to your environment variables

## Payment Flow

### 1. Order Placement
- Customer selects items and proceeds to checkout
- Chooses "Fapshi Payment" as payment method
- System initializes payment with Fapshi API

### 2. Payment Processing
- Customer is redirected to Fapshi payment page
- Chooses between MTN MoMo or Orange Money
- Enters mobile money PIN to complete payment

### 3. Payment Confirmation
- Fapshi processes the payment
- Customer is redirected back to your site
- System verifies payment status
- Order is confirmed and email sent

## API Endpoints Used

### Payment Initialization
```typescript
POST /payments/initialize
{
  "amount": 5000, // Amount in cents
  "currency": "XAF",
  "reference": "CHT-123456789",
  "description": "ChopTime Order - Restaurant Name - Dish Name",
  "customer": {
    "name": "Customer Name",
    "phone": "237612345678",
    "email": "customer@example.com"
  },
  "callback_url": "https://yourdomain.com/api/payment-webhook",
  "return_url": "https://yourdomain.com/payment-success?reference=CHT-123456789"
}
```

### Payment Status Check
```typescript
GET /payments/{reference}
```

## Database Schema Updates

The following fields have been added to the `orders` table:

```sql
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255);
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);
```

## Testing

### Test Mode
Set `VITE_FAPSHI_TEST_MODE=true` for testing with sandbox credentials.

### Test Phone Numbers
- MTN MoMo: 6XXXXXXXX
- Orange Money: 6XXXXXXXX

### Test Amounts
- Minimum: 100 XAF
- Maximum: 1,000,000 XAF

## Production Deployment

### 1. Update Environment Variables
```env
VITE_FAPSHI_TEST_MODE=false
VITE_FAPSHI_API_KEY=your_production_api_key
```

### 2. Configure Webhooks
Set up webhook endpoints to handle payment notifications:

```typescript
// Example webhook handler
app.post('/api/payment-webhook', async (req, res) => {
  const { reference, status, amount } = req.body;
  
  // Verify webhook signature
  const isValid = fapshiService.verifyWebhookSignature(
    JSON.stringify(req.body),
    req.headers['x-fapshi-signature']
  );
  
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  // Update order status
  if (status === 'success') {
    await updateOrderPaymentStatus(reference, 'paid');
  }
  
  res.json({ success: true });
});
```

### 3. SSL Certificate
Ensure your domain has a valid SSL certificate for secure payment processing.

## Security Considerations

1. **API Key Security**: Never expose your API key in client-side code
2. **Webhook Verification**: Always verify webhook signatures
3. **HTTPS**: Use HTTPS in production for all payment-related requests
4. **Input Validation**: Validate all payment data before processing

## Support

- **Fapshi Documentation**: [https://docs.fapshi.com/en](https://docs.fapshi.com/en)
- **Fapshi Support**: Contact via Slack, Email, or WhatsApp
- **ChopTime Support**: support@choptime.app

## Troubleshooting

### Common Issues

1. **Payment Initialization Fails**
   - Check API key is correct
   - Verify test mode setting
   - Ensure all required fields are provided

2. **Payment Status Not Updating**
   - Check webhook configuration
   - Verify callback URLs are accessible
   - Review server logs for errors

3. **Customer Not Receiving Payment Prompt**
   - Verify phone number format (237XXXXXXXX)
   - Check if customer has sufficient balance
   - Ensure customer is in Cameroon

### Debug Mode

Enable debug logging by adding to your environment:

```env
VITE_DEBUG_MODE=true
```

This will log all API requests and responses to the console.

## Migration from Manual Mobile Money

If you're migrating from the manual mobile money system:

1. Update existing orders to use new payment fields
2. Notify customers about the new secure payment option
3. Keep manual option as fallback during transition
4. Monitor payment success rates

## Performance Optimization

1. **Caching**: Cache payment status to reduce API calls
2. **Polling**: Use reasonable intervals for status checking
3. **Error Handling**: Implement retry logic for failed requests
4. **Monitoring**: Track payment success/failure rates

## Compliance

- Ensure compliance with Cameroonian financial regulations
- Follow PCI DSS guidelines for payment data handling
- Implement proper data retention policies
- Provide clear terms of service and privacy policy 