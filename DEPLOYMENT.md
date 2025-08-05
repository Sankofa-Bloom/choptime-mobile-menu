# 🚀 ChopTym Deployment Guide

## Quick Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Environment Variables** (Add in Vercel Dashboard)
   ```env
   VITE_SUPABASE_URL=https://qrpukxmzdwkepfpuapzh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_DEFAULT_PAYMENT_METHOD=campay
   VITE_CAMPAY_CALLBACK_URL=https://your-domain.vercel.app/api/payment-webhook
   VITE_CAMPAY_RETURN_URL=https://your-domain.vercel.app/payment-success
   VITE_ADMIN_EMAIL=choptym237@gmail.com
   VITE_ADMIN_PHONE=+237670416449
   ```

3. **Build Settings**
   - Build Command: `npm run build:prod`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Option 2: Netlify

1. **Connect Repository**
   - Connect your GitHub repo to Netlify
   - Set build command: `npm run build:prod`
   - Set publish directory: `dist`

2. **Environment Variables** (Add in Netlify Dashboard)
   - Same as Vercel above

### Option 3: Railway (Full Stack)

1. **Deploy Both Frontend & Backend**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   railway login
   railway init
   ```

2. **Environment Variables** (Add in Railway Dashboard)
   ```env
   # Frontend
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   
   # Backend
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ADMIN_EMAIL=admin@yourdomain.com
   ```

## 🔧 Production Checklist

### ✅ Pre-Deployment
- [ ] Environment variables configured
- [ ] Gmail SMTP app password set
- [ ] Campay API credentials configured
- [ ] Supabase database migrations applied
- [ ] Domain configured (if using custom domain)

### ✅ Post-Deployment
- [ ] Test order flow end-to-end
- [ ] Verify email notifications work
- [ ] Test payment integration
- [ ] Check PWA installation
- [ ] Monitor error logs
- [ ] Test on mobile devices

### ✅ Security
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] HTTPS enabled
- [ ] API keys not exposed in client
- [ ] Input validation working

## 📱 PWA Configuration

The app is PWA-ready with:
- Service worker for offline support
- App manifest for installation
- Splash screen and icons
- Push notification support

## 🔍 Monitoring

### Health Check Endpoints
- Frontend: `https://your-domain.com/`
- Backend: `https://your-domain.com/api/campay/test`

### Error Tracking
- Check browser console for client errors
- Check server logs for backend errors
- Monitor Supabase dashboard for database issues

## 🚨 Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check Gmail app password
   - Verify SMTP configuration
   - Check server logs

2. **Payments failing**
   - Verify Campay API credentials
   - Check webhook configuration
   - Test in sandbox mode first

3. **Build failures**
   - Check Node.js version (18+)
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

4. **Database connection issues**
   - Verify Supabase credentials
   - Check RLS policies
   - Run migrations: `npx supabase db push`

## 📞 Support

- **Email**: admin@choptym.com
- **Phone**: +237670416449
- **Documentation**: [README.md](README.md)

---

**Your ChopTym app is now production-ready! 🎉** 