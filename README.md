# ChopTym - Authentic Cameroonian Cuisine Delivery

A modern, production-ready food delivery application specializing in authentic Cameroonian cuisine. Built with React, TypeScript, and Supabase.

## 🚀 Features

- **Modern UI/UX** - Beautiful, responsive design with African-inspired patterns
- **Real-time Ordering** - Live order tracking and status updates
- **Secure Payments** - Integrated Campay payment gateway
- **Email Notifications** - Automated order confirmations and admin alerts
- **PWA Support** - Installable as a mobile app
- **Multi-town Delivery** - Support for Buea and Limbe
- **Admin Dashboard** - Complete order management system
- **Performance Optimized** - Fast loading with code splitting and caching

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Payments**: Campay API
- **Email**: Nodemailer with Gmail SMTP
- **Deployment**: Netlify ready

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Campay payment account
- Gmail account (for email notifications)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sankofa-Bloom/choptym-mobile-menu.git
cd choptym-mobile-menu
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install
   cd ..
   ```

3. **Environment Configuration**
   ```bash
   # Quick setup for development (recommended)
   ./setup-env.sh development
   
   # Or setup for production
   ./setup-env.sh production
   
   # Manual setup (alternative)
   cp .env.development .env
   cp server/.env.development server/.env
   ```

4. **Database Setup**
   ```bash
   # Push database migrations
   npx supabase db push
   ```

5. **Start Development**
   ```bash
   # Start frontend and backend
   npm run dev:full
   
   # Or start separately
   npm run dev          # Frontend only
   npm run server       # Backend only
   
   # Environment switching
   ./setup-env.sh development  # Switch to development
   ./setup-env.sh production   # Switch to production
   ```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Payment
VITE_DEFAULT_PAYMENT_METHOD=campay
VITE_CAMPAY_CALLBACK_URL=your_webhook_url
VITE_CAMPAY_RETURN_URL=your_success_url

# Admin
VITE_ADMIN_EMAIL=admin@yourdomain.com
VITE_ADMIN_PHONE=+1234567890
```

#### Backend (server/.env)
```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PHONE=+1234567890

# Campay API
CAMPAY_API_KEY=your_campay_api_key
CAMPAY_BASE_URL=https://api.campay.net
```

### Payment Setup

1. **Campay Configuration**
   - Sign up at [Campay](https://campay.net)
   - Get your Permanent Access Token
   - Configure webhook URL in dashboard
   - Test in sandbox mode first

2. **Gmail SMTP Setup**
   - Enable 2-Factor Authentication
   - Generate App Password
   - Use App Password in SMTP configuration

## 🚀 Deployment

### Netlify (Recommended)

1. **Deploy via Git**
   - Go to [netlify.com](https://netlify.com)
   - Connect GitHub repository: `Sankofa-Bloom/choptime-mobile-menu`
   - Auto-deploys from main branch

2. **Environment Variables**
   - Add all environment variables in Netlify dashboard
   - Set `NODE_ENV=production`

3. **Build Settings**
   - Build Command: `npm run build:prod`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Netlify

1. **Deploy Settings**
   - Build Command: `npm run build:prod`
   - Publish Directory: `dist`
   - Node Version: `18`

2. **Environment Variables**
   - Add all environment variables in Netlify dashboard

### Server Deployment

The backend server can be deployed to:
- Railway
- Heroku
- DigitalOcean
- AWS EC2

## 📱 PWA Features

- **Installable** - Add to home screen
- **Offline Support** - Basic offline functionality
- **Push Notifications** - Order updates
- **App-like Experience** - Native feel

## 🔒 Security

- **Environment Variables** - No sensitive data in code
- **CORS Configuration** - Proper cross-origin settings
- **Input Validation** - Zod schema validation
- **SQL Injection Protection** - Supabase ORM
- **XSS Protection** - React built-in protection

## 📊 Performance

- **Code Splitting** - Automatic chunk optimization
- **Lazy Loading** - Component-level lazy loading
- **Image Optimization** - WebP format support
- **Caching** - Service worker caching
- **Bundle Analysis** - `npm run analyze`

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Build testing
npm run test:build
```

## 📈 Monitoring

- **Error Tracking** - Sentry integration ready
- **Analytics** - Google Analytics ready
- **Performance** - Core Web Vitals monitoring
- **Uptime** - Health check endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Email**: admin@choptym.com
- **Phone**: +237670416449
- **Documentation**: [Wiki](https://github.com/Sankofa-Bloom/choptym-mobile-menu/wiki)

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered recommendations
- [ ] Loyalty program
- [ ] Real-time chat support

---

**Built with ❤️ for authentic Cameroonian cuisine delivery**
