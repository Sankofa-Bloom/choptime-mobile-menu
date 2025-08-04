# ChopTime Production Deployment Guide

## 🚀 Production-Ready Setup

This guide will help you deploy ChopTime to production with optimal performance, security, and reliability.

## 📋 Pre-Deployment Checklist

### ✅ Environment Configuration
- [ ] Set up production environment variables in `.env.production`
- [ ] Configure EmailJS with production credentials
- [ ] Set up Fapshi payment gateway with live credentials
- [ ] Configure Supabase with production database
- [ ] Set up domain and SSL certificates

### ✅ Security Configuration
- [ ] Remove all development/test credentials
- [ ] Enable HTTPS for all endpoints
- [ ] Configure Content Security Policy (CSP)
- [ ] Set up proper CORS policies
- [ ] Enable rate limiting on API endpoints

### ✅ Performance Optimization
- [ ] Enable code splitting and lazy loading
- [ ] Configure CDN for static assets
- [ ] Optimize images and assets
- [ ] Enable compression (gzip/brotli)
- [ ] Set up caching strategies

## 🔧 Production Build

### 1. Install Dependencies
```bash
npm ci --production
```

### 2. Build for Production
```bash
npm run build:prod
```

### 3. Verify Build
```bash
npm run type-check
npm run lint
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

#### Setup
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set build command: `npm run build:prod`
4. Set output directory: `dist`

#### Environment Variables
```bash
# Copy from .env.production and update with real values
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_USER_ID=your_emailjs_user_id
VITE_FAPSHI_API_USER=your_fapshi_api_user
VITE_FAPSHI_API_KEY=your_fapshi_api_key
VITE_FAPSHI_TEST_MODE=false
```

### Option 2: Netlify

#### Setup
1. Connect repository to Netlify
2. Set build command: `npm run build:prod`
3. Set publish directory: `dist`
4. Configure environment variables

### Option 3: AWS S3 + CloudFront

#### Setup
1. Build the application: `npm run build:prod`
2. Upload `dist` folder to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain and SSL

## 🔒 Security Configuration

### Content Security Policy
The application includes a comprehensive CSP in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.emailjs.com https://api.emailjs.com https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.fapshi.com https://api.emailjs.com https://vercel.live; frame-src 'self' https://api.fapshi.com;"
        }
      ]
    }
  ]
}
```

### Environment Variables Security
- Never commit `.env.production` to version control
- Use platform-specific secret management
- Rotate API keys regularly
- Use least-privilege access for all services

## 📊 Performance Monitoring

### Core Web Vitals
Monitor these metrics:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Bundle Analysis
```bash
npm run analyze
```

### Performance Budgets
- Total JavaScript: < 500KB
- Total CSS: < 100KB
- Images: < 1MB total

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run build:prod
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🚨 Error Monitoring

### Setup Error Tracking
1. Configure error reporting service (Sentry, LogRocket)
2. Set up monitoring for:
   - JavaScript errors
   - API failures
   - Payment processing errors
   - Performance issues

### Health Checks
Implement health check endpoints:
- `/api/health` - Basic application health
- `/api/health/db` - Database connectivity
- `/api/health/payment` - Payment gateway status

## 📱 PWA Configuration

### Service Worker
- Configure caching strategies
- Handle offline functionality
- Implement background sync for orders

### Manifest
- Set proper app icons
- Configure theme colors
- Enable install prompts

## 🔧 Post-Deployment

### Verification Checklist
- [ ] Test all payment flows
- [ ] Verify email notifications
- [ ] Check admin dashboard functionality
- [ ] Test mobile responsiveness
- [ ] Verify PWA installation
- [ ] Check performance metrics
- [ ] Test offline functionality

### Monitoring Setup
- [ ] Set up uptime monitoring
- [ ] Configure error alerting
- [ ] Set up performance monitoring
- [ ] Enable user analytics (optional)

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
npm run clean
npm ci
npm run build:prod
```

#### Environment Variables
- Verify all required variables are set
- Check for typos in variable names
- Ensure proper formatting

#### Performance Issues
- Run bundle analysis: `npm run analyze`
- Check for large dependencies
- Optimize images and assets

#### Payment Issues
- Verify Fapshi credentials
- Check webhook endpoints
- Test in sandbox mode first

## 📞 Support

For deployment issues:
1. Check the logs in your hosting platform
2. Verify environment variables
3. Test locally with production build
4. Contact the development team

---

**Remember**: Always test thoroughly in a staging environment before deploying to production! 