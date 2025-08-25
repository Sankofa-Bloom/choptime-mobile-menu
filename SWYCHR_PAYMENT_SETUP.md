# Swychr Payment API Setup Guide

This guide will help you set up the Swychr Payment API integration for ChopTym.

## Required Environment Variables

Add the following environment variables to your Netlify deployment:

### Swychr API Configuration
```bash
SWYCHR_EMAIL=your_swychr_account_email@example.com
SWYCHR_PASSWORD=your_swychr_account_password
```

### Email Configuration
```bash
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
ADMIN_EMAIL=support@choptym.com
```

### Supabase Configuration
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Started with Swychr API

1. **Sign up for Swychr Account**
   - Visit: https://www.accountpe.com/
   - Create an account and verify your email
   - Contact support to enable API access

2. **Get API Credentials**
   - Login to your Swychr dashboard
   - Navigate to API settings
   - Note down your login email and password
   - These will be used for authentication

3. **Configure Environment Variables**
   - Add all the variables above to your Netlify environment
   - For local development, create a `.env` file with these variables

## API Endpoints Used

### Authentication
- **POST** `/api/payin/admin/auth`
- Authenticates with email/password and returns JWT token

### Payment Link Creation
- **POST** `/api/payin/create_payment_links`
- Creates a payment link for customers

### Payment Status Check
- **POST** `/api/payin/payment_link_status`
- Checks the status of a payment transaction

## Testing the Integration

1. **Test Credentials**
   - Use your sandbox/test credentials first
   - Verify authentication works

2. **Payment Flow**
   - Customer fills order details
   - System creates payment link via Swychr API
   - Customer is redirected to Swychr payment page
   - Customer completes payment with preferred method
   - Customer returns to app and status is verified
   - Order is confirmed automatically

3. **Supported Payment Methods (via Swychr)**
   - MTN Mobile Money
   - Orange Money
   - Bank transfers
   - Other local payment methods

## Email Notifications

The system automatically sends email notifications to the admin when:
- Payment is successful
- Order details are confirmed
- Database is updated with order information

## Database Updates

The system updates the Supabase database with:
- Payment status (pending, confirmed, completed, failed)
- Payment reference (Swychr transaction ID)
- Payment method (swychr)
- Customer and order details

## Troubleshooting

### Common Issues:
1. **Authentication Errors**: Check your Swychr credentials
2. **API Errors**: Verify Swychr account has API access enabled
3. **Environment Variables**: Verify all variables are set in Netlify
4. **Email Issues**: Check Gmail app password and SMTP settings

### Debug Logs:
- Check Netlify Functions logs for detailed error messages
- Browser console shows frontend payment status
- Supabase logs show database operations

## Production Configuration

For production deployment:
- Use production Swychr credentials
- Set up proper SSL certificates
- Configure proper CORS settings
- Enable production logging

## Support

For Swychr API issues:
- Contact Swychr support directly
- Check API documentation
- Verify account status

For ChopTym specific issues:
- Check the application logs
- Verify environment configuration
- Test with sandbox environment first

## Security Notes

- Never expose API credentials in frontend code
- All authentication is handled server-side
- Payment processing is done via secure Swychr infrastructure
- Customer payment details are never stored locally
