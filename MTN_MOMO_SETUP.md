# MTN MoMo API Setup Guide

This guide will help you set up the MTN MoMo API integration for ChopTym.

## Required Environment Variables

Add the following environment variables to your Netlify deployment:

### MTN MoMo API Configuration
```bash
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_MOMO_SUBSCRIPTION_KEY=your_mtn_momo_subscription_key
MTN_MOMO_API_USER=your_mtn_momo_api_user
MTN_MOMO_API_KEY=your_mtn_momo_api_key
MTN_MOMO_TARGET_ENVIRONMENT=sandbox
```

### Email Configuration
```bash
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
ADMIN_EMAIL=admin@choptym.com
```

### Supabase Configuration
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Started with MTN MoMo API

1. **Sign up for MTN MoMo Developer Account**
   - Visit: https://momodeveloper.mtn.com/
   - Create an account and verify your email

2. **Subscribe to Collections API**
   - In the developer portal, subscribe to the "Collections" API
   - This will give you a subscription key

3. **Create API User and Key**
   - Use the sandbox environment for testing
   - Generate an API user and API key
   - These will be used for authentication

4. **Configure Environment Variables**
   - Add all the variables above to your Netlify environment
   - For local development, create a `.env` file with these variables

## Production Configuration

For production deployment:

```bash
MTN_MOMO_BASE_URL=https://api.momodeveloper.mtn.com
MTN_MOMO_TARGET_ENVIRONMENT=live
```

**Important**: You'll need to apply for production access and get approved by MTN before using the live environment.

## Testing the Integration

1. **Test Phone Numbers (Sandbox)**
   - Use MTN Cameroon numbers in format: 237XXXXXXX
   - Sandbox environment accepts test transactions

2. **Payment Flow**
   - Customer enters MTN MoMo number
   - System initiates payment request
   - Customer receives USSD prompt on phone
   - Customer approves payment with PIN
   - System receives confirmation and updates order

## Email Notifications

The system automatically sends email notifications to the admin when:
- Payment is successful
- Order details are confirmed
- Database is updated with order information

## Database Updates

The system updates the Supabase database with:
- Payment status (pending, confirmed, completed, failed)
- Payment reference (MTN MoMo transaction ID)
- Payment method (mtn_momo)
- Customer and order details

## Troubleshooting

### Common Issues:
1. **Authentication Errors**: Check your API credentials
2. **Phone Number Format**: Ensure numbers are in 237XXXXXXX format
3. **Environment Variables**: Verify all variables are set in Netlify
4. **Email Issues**: Check Gmail app password and SMTP settings

### Debug Logs:
- Check Netlify Functions logs for detailed error messages
- Browser console shows frontend payment status
- Supabase logs show database operations

## Support

For MTN MoMo API issues:
- MTN Developer Portal: https://momodeveloper.mtn.com/
- Documentation: https://momodeveloper.mtn.com/docs/

For ChopTym specific issues:
- Check the application logs
- Verify environment configuration
- Test with sandbox environment first
