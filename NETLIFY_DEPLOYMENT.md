# 🚀 ChopTym Netlify Deployment Guide

## Overview
This guide covers deploying the ChopTym mobile menu application to Netlify with serverless functions.

## Prerequisites
- GitHub account with access to the repository
- Netlify account (free tier supported)
- Domain access for custom domain setup

## Deployment Steps

### 1. Repository Setup
Ensure your repository is pushed to GitHub:
```bash
git push origin main
```

### 2. Netlify Site Creation
1. Go to [netlify.com](https://netlify.com)
2. Sign in or create account
3. Click "New site from Git"
4. Connect GitHub account
5. Select repository: `Sankofa-Bloom/choptime-mobile-menu`
6. Branch: `main`

### 3. Build Settings
Netlify should auto-detect these settings from `netlify.toml`:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`

### 4. Environment Variables
Add these in **Site Settings > Environment variables**:

```env
# Supabase (Frontend)
VITE_SUPABASE_URL=https://qrpukxmzdwkepfpuapzh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5MTgsImV4cCI6MjA2NjM5MzkxOH0.Ix3k_w-nbJQ29FcuP3YYRT_K6ZC7RY2p80VKaDA0JEs

# Supabase (Functions)
SUPABASE_URL=https://qrpukxmzdwkepfpuapzh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5MTgsImV4cCI6MjA2NjM5MzkxOH0.Ix3k_w-nbJQ29FcuP3YYRT_K6ZC7RY2p80VKaDA0JEs

# Environment
NODE_ENV=production

# EmailJS
VITE_EMAILJS_SERVICE_ID=service_m7jymjp
VITE_EMAILJS_TEMPLATE_ID=template_o7l3h1s
VITE_EMAILJS_PUBLIC_KEY=Bnk6Bno3qr2o9l3Nk

# Payment Gateways
VITE_FAPSHI_API_BASE_URL=https://api.fapshi.com
VITE_CAMPAY_API_BASE_URL=https://api.campay.net
```

### 5. Custom Domain Setup
1. Go to **Site settings > Domain management**
2. Click "Add custom domain"
3. Enter: `www.choptym.com`
4. Configure DNS:
   ```
   CNAME www your-site-name.netlify.app
   ```

### 6. Verify Deployment
After deployment, test these URLs:
- `https://your-site-name.netlify.app/` - Main app
- `https://your-site-name.netlify.app/.netlify/functions/dishes` - API test

## API Functions

The following Netlify Functions are deployed:
- `/api/dishes` → `/.netlify/functions/dishes`
- `/api/restaurants` → `/.netlify/functions/restaurants`
- `/api/restaurant-menus` → `/.netlify/functions/restaurant-menus`
- `/api/delivery-zones` → `/.netlify/functions/delivery-zones`

## Configuration Files

### netlify.toml
Contains build and deployment configuration:
- Build settings
- Redirect rules
- Function configuration

### Environment Variables
- Frontend variables prefixed with `VITE_`
- Function variables without prefix
- Both use same Supabase credentials

## Troubleshooting

### Build Failures
1. Check build logs in Netlify dashboard
2. Verify all environment variables are set
3. Test local build: `npm run build`

### Function Errors
1. Check function logs in Netlify dashboard
2. Verify Supabase credentials
3. Test functions individually

### Domain Issues
1. Verify DNS settings
2. Check SSL certificate status
3. Clear DNS cache if needed

## Benefits over Vercel
- ✅ No function count limits
- ✅ Better Vite support
- ✅ More reliable asset deployment
- ✅ Simpler configuration
- ✅ Better debugging tools

## Support
For deployment issues, check:
1. Netlify build logs
2. Function logs
3. Browser developer console
4. GitHub repository issues
