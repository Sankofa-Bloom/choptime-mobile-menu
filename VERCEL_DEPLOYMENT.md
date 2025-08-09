# ChopTym Vercel Deployment Guide

## Environment Variables Setup

### 1. Using the Vercel Environment File

We've created `.env.vercel.production` which contains all necessary environment variables for both frontend and backend deployment on Vercel.

### 2. How to Apply Environment Variables to Vercel

#### Option A: Using Vercel Dashboard (Recommended)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Open `.env.vercel.production` file
4. Copy each variable and add it to Vercel:
   - **Name**: Variable name (e.g., `VITE_API_BASE_URL`)
   - **Value**: Variable value (e.g., `https://api.choptym.com`)
   - **Environment**: Select "Production"
5. Click "Save" for each variable

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables from file
vercel env add VITE_API_BASE_URL production
# Enter the value when prompted

# Or add multiple variables at once
vercel env pull .env.vercel.local
```

### 3. Important Credentials to Update

Before deployment, update these placeholder values in your Vercel environment variables:

#### Payment Gateway Credentials:
```
FAPSHI_API_USER=your_actual_fapshi_api_user
FAPSHI_API_KEY=your_actual_fapshi_api_key  
FAPSHI_WEBHOOK_SECRET=your_actual_fapshi_webhook_secret

CAMPAY_API_KEY=your_actual_campay_api_key
CAMPAY_WEBHOOK_SECRET=your_actual_campay_webhook_secret
```

#### Security Tokens:
```
JWT_SECRET=generate_a_strong_random_string_here
```

### 4. Environment Variables Categories

#### Frontend Variables (VITE_*)
- ✅ Database: Supabase URLs and keys
- ✅ API: Base URL pointing to production
- ✅ Payments: Callback and return URLs
- ✅ App: Configuration and feature flags

#### Backend Variables
- ✅ Server: PORT, HOST, NODE_ENV
- ✅ Database: Supabase service credentials
- ✅ Security: JWT, CORS, rate limiting
- ✅ Payments: API credentials and webhooks
- ✅ Email: SMTP configuration
- ✅ Features: Notifications, analytics, caching

### 5. Deployment Steps

1. **Set Environment Variables** (using guide above)
2. **Update Credentials** (replace placeholder values)
3. **Deploy**: `git push origin main` (auto-deploys to Vercel)
4. **Test**: Verify both frontend and backend work correctly

### 6. Security Notes

- ⚠️ **Never commit** `.env.vercel.production` to git
- 🔒 **Rotate credentials** regularly for security
- 📝 **Monitor logs** for any configuration issues
- 🛡️ **Use strong secrets** for JWT and webhooks

### 7. Troubleshooting

#### Common Issues:
1. **CSP Violations**: Ensure API URLs match in environment variables
2. **Payment Failures**: Verify payment gateway credentials
3. **Email Issues**: Check SMTP configuration
4. **Database Errors**: Confirm Supabase credentials

#### Verification Steps:
1. Check Vercel build logs for environment variable errors
2. Test API endpoints: `https://your-domain.vercel.app/api/health`
3. Verify frontend loads data without CSP errors
4. Test payment flow end-to-end

### 8. Production Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] Payment gateway credentials updated
- [ ] JWT secret generated and set
- [ ] Domain configured correctly in CORS_ORIGIN
- [ ] Email SMTP credentials verified
- [ ] Database connections tested
- [ ] SSL certificates valid
- [ ] CSP headers allow necessary domains

## Support

If you encounter issues during deployment, check:
1. Vercel deployment logs
2. Browser console for errors
3. Network tab for failed API calls
4. Environment variables in Vercel dashboard

---
**Last Updated**: January 2025
**Environment**: Production
**Platform**: Vercel
