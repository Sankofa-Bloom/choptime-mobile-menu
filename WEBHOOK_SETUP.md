# Webhook Server Setup Guide

## Overview

This guide explains how to set up and run the webhook server for processing Fapshi payment notifications in your ChopTime application.

## Webhook Endpoint Configuration

### Current Setup
- **Webhook URL**: `http://localhost:8080/api/payment-webhook`
- **Return URL**: `http://localhost:8080/payment-success`
- **API Key**: `b0a2c523-01e3-4557-a2f2-9eccf2fee731`

## Server Setup

### 1. Install Dependencies

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

### 2. Start the Webhook Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on port 8080 by default.

### 3. Verify Server is Running

Check the health endpoint:
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Webhook server is running"
}
```

## Webhook Processing

### Payment Success Flow

1. **Customer completes payment** on Fapshi
2. **Fapshi sends webhook** to `http://localhost:8080/api/payment-webhook`
3. **Webhook server processes** the payment notification
4. **Order status updated** in database
5. **Email notifications sent** to customer and admin
6. **Customer redirected** to success page

### Webhook Payload Example

```json
{
  "reference": "CHT-123456789",
  "status": "success",
  "amount": 5000,
  "currency": "XAF",
  "customer": {
    "name": "John Doe",
    "phone": "237612345678",
    "email": "john@example.com"
  },
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:05:00Z"
}
```

## Database Updates

### Successful Payment
- `payment_status`: `paid`
- `payment_reference`: Fapshi reference
- `payment_method`: `fapshi`
- `status`: `confirmed`

### Failed Payment
- `payment_status`: `failed`
- `payment_reference`: Fapshi reference
- `payment_method`: `fapshi`
- `status`: `cancelled`

## Email Notifications

### Customer Email
- Payment confirmation
- Order details
- Restaurant information

### Admin Email
- Payment notification
- Complete order details
- Customer information

## Testing the Webhook

### 1. Test Webhook Endpoint

Send a test webhook payload:

```bash
curl -X POST http://localhost:8080/api/payment-webhook \
  -H "Content-Type: application/json" \
  -H "x-fapshi-signature: test-signature" \
  -d '{
    "reference": "TEST-123",
    "status": "success",
    "amount": 1000,
    "currency": "XAF",
    "customer": {
      "name": "Test User",
      "phone": "237612345678",
      "email": "test@example.com"
    },
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:05:00Z"
  }'
```

### 2. Check Database Updates

Verify that the order status was updated in your database.

### 3. Check Email Notifications

Verify that confirmation emails were sent to the customer and admin.

## Production Deployment

### 1. Update Environment Variables

For production, update the webhook URLs:

```env
VITE_FAPSHI_CALLBACK_URL=https://yourdomain.com/api/payment-webhook
VITE_FAPSHI_RETURN_URL=https://yourdomain.com/payment-success
```

### 2. Configure Fapshi Dashboard

Update the webhook endpoint in your Fapshi dashboard:
- **Webhook URL**: `https://yourdomain.com/api/payment-webhook`
- **Return URL**: `https://yourdomain.com/payment-success`

### 3. SSL Certificate

Ensure your domain has a valid SSL certificate for secure webhook processing.

### 4. Server Configuration

- Use a production server (e.g., PM2, Docker)
- Configure proper logging
- Set up monitoring and alerts
- Implement rate limiting

## Troubleshooting

### Common Issues

1. **Webhook not received**
   - Check server is running on port 8080
   - Verify webhook URL in Fapshi dashboard
   - Check firewall settings

2. **Signature verification failed**
   - Verify webhook signature implementation
   - Check Fapshi signature format

3. **Database update failed**
   - Check database connection
   - Verify order reference exists
   - Check database permissions

4. **Email not sent**
   - Check email service configuration
   - Verify email templates
   - Check email service logs

### Debug Mode

Enable debug logging by setting environment variables:

```env
DEBUG=true
LOG_LEVEL=debug
```

### Logs

Check server logs for webhook processing:

```bash
# View logs
tail -f server.log

# Check webhook requests
grep "webhook" server.log
```

## Security Considerations

1. **Webhook Signature Verification**
   - Always verify webhook signatures
   - Implement proper signature validation
   - Use secure signature algorithms

2. **Input Validation**
   - Validate all webhook payload data
   - Sanitize input data
   - Implement proper error handling

3. **Rate Limiting**
   - Implement webhook rate limiting
   - Monitor webhook frequency
   - Set up abuse detection

4. **HTTPS**
   - Use HTTPS in production
   - Validate SSL certificates
   - Implement secure headers

## Monitoring

### Health Checks

Monitor webhook server health:

```bash
# Health check
curl http://localhost:8080/health

# Webhook endpoint test
curl -X POST http://localhost:8080/api/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "payload"}'
```

### Metrics

Track webhook processing metrics:
- Webhook success rate
- Processing time
- Error rates
- Payment success rates

## Support

For issues with the webhook server:
1. Check server logs
2. Verify Fapshi configuration
3. Test webhook endpoint
4. Contact development team

The webhook server is now ready to process Fapshi payment notifications! 