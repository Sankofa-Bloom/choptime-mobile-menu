# ChopTime Deployment Guide

## Vercel Deployment Setup

### 1. Environment Variables Setup

You need to configure the following environment variables in your Vercel project:

#### Go to Vercel Dashboard:
1. Navigate to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**

#### Required Environment Variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://qrpukxmzdwkepfpuapzh.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_4beuwe5
VITE_EMAILJS_USER_ID=lTTBvyuuFE8XG5fZl
VITE_EMAILJS_GENERIC_TEMPLATE_ID=generic_template

# Fapshi Payment Configuration
VITE_FAPSHI_API_USER=b0a2c523-01e3-4557-a2f2-9eccf2fee731
VITE_FAPSHI_API_KEY=FAK_TEST_c51b4f62bac5cfbe9671
VITE_FAPSHI_TEST_MODE=true

# Admin Configuration
VITE_ADMIN_EMAIL=choptime237@gmail.com
VITE_ADMIN_PHONE=+237670416449
VITE_ADMIN_WHATSAPP=+237670416449

# Company Configuration
VITE_COMPANY_NAME=ChopTime
VITE_COMPANY_WEBSITE=https://choptime.com
VITE_COMPANY_ADDRESS=Busumbu Junction, Limbe - Cameroon

# Delivery Configuration
VITE_DEFAULT_DELIVERY_FEE=500
VITE_PREMIUM_DELIVERY_FEE=1000
VITE_MIN_DELIVERY_TIME=15
VITE_MAX_DELIVERY_TIME=45

# Payment Configuration
VITE_PAYMENT_METHOD=multiple
VITE_ENABLE_EMAIL_PAYMENT=true
VITE_ENABLE_CASH_PAYMENT=true
VITE_ENABLE_MTN_MOMO=true
VITE_ENABLE_ORANGE_MONEY=true
VITE_ENABLE_ONLINE_PAYMENT=true

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_EMAIL_NOTIFICATIONS=true
VITE_ENABLE_ADMIN_NOTIFICATIONS=true
VITE_ENABLE_SMS_NOTIFICATIONS=false
VITE_ENABLE_ORDER_TRACKING=true
VITE_ENABLE_CUSTOM_ORDERS=true
VITE_ENABLE_ORDER_HISTORY=true
VITE_ENABLE_ONLINE_PAYMENTS=true
VITE_ENABLE_PAYMENT_PROCESSING=true
VITE_ENABLE_PAYMENT_GATEWAYS=true

# Development Configuration
VITE_DEV_MODE=false
VITE_ENABLE_DEBUG_LOGS=false

# Security
VITE_API_RATE_LIMIT=100
VITE_API_RATE_LIMIT_WINDOW=60000
VITE_SESSION_TIMEOUT=30

# Notifications
VITE_TOAST_DURATION=5000
VITE_ORDER_CONFIRMATION_TIMEOUT=30
VITE_EMAIL_NOTIFICATION_DELAY=2000
VITE_ADMIN_NOTIFICATION_DELAY=1000

# Order Processing
VITE_AUTO_CONFIRM_ORDERS=true
VITE_RESTAURANT_CONFIRMATION_REQUIRED=false
VITE_PAYMENT_ARRANGEMENT_MODE=automatic

# Customization
VITE_PRIMARY_COLOR=#FF6B35
VITE_SECONDARY_COLOR=#F7931E
VITE_ACCENT_COLOR=#2C3E50
VITE_CURRENCY=XAF
VITE_CURRENCY_SYMBOL=₣
VITE_DEFAULT_LANGUAGE=en
VITE_SUPPORTED_LANGUAGES=en,fr

# Deployment
VITE_BUILD_MODE=production
VITE_APP_VERSION=2.0.0
VITE_CDN_URL=https://cdn.choptime.com
VITE_ASSET_URL=https://assets.choptime.com
```

### 2. Setting Environment Variables in Vercel

1. **Add each variable individually:**
   - Click **Add New**
   - Enter the **Name** (e.g., `VITE_SUPABASE_URL`)
   - Enter the **Value** (e.g., `https://qrpukxmzdwkepfpuapzh.supabase.co`)
   - Select **Environment**: Production, Preview, and Development
   - Click **Save**

2. **Repeat for all variables** listed above

### 3. Redeploy After Environment Variables

After setting all environment variables:

1. Go to **Deployments** tab
2. Click **Redeploy** on your latest deployment
3. Or push a new commit to trigger automatic deployment

### 4. Verify Deployment

After redeployment, check that:

- ✅ No more "API user not configured" errors
- ✅ EmailJS is properly initialized
- ✅ Fapshi payment integration works
- ✅ WhatsApp button functions correctly
- ✅ Contact form sends emails

### 5. Troubleshooting

#### Common Issues:

1. **"Fapshi API user not configured"**
   - Ensure `VITE_FAPSHI_API_USER` and `VITE_FAPSHI_API_KEY` are set

2. **"EmailJS not initialized"**
   - Check `VITE_EMAILJS_USER_ID` is set correctly

3. **CSP Errors**
   - The `vercel.json` file should handle this automatically

4. **404 Errors**
   - Ensure all routes are properly configured in `vercel.json`

### 6. Production Checklist

Before going live:

- [ ] All environment variables are set
- [ ] Test payment flow works
- [ ] Test email notifications work
- [ ] Test WhatsApp integration
- [ ] Verify PWA installation
- [ ] Check mobile responsiveness
- [ ] Test all payment methods

### 7. Security Notes

- Never commit `.env` files to git
- Use Vercel's environment variable encryption
- Regularly rotate API keys
- Monitor for suspicious activity

## Support

If you encounter issues:

1. Check the browser console for specific error messages
2. Verify all environment variables are set correctly
3. Check Vercel deployment logs
4. Test locally with a `.env` file first 