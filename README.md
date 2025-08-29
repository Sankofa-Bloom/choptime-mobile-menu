# 🚀 ChopTym - Cameroonian Food Delivery PWA

> **Version 1.0.0** - Production Ready

Authentic Cameroonian cuisine delivered fresh to your doorstep. A modern, secure, and scalable food delivery Progressive Web App (PWA) built with React, TypeScript, and Supabase.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2+-green.svg)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)

## ✨ Features

- 🍲 **Authentic Cameroonian Cuisine** - Traditional dishes from local restaurants
- 📱 **Progressive Web App** - Installable, offline-capable mobile experience
- 🚀 **Real-time Updates** - Live order tracking and notifications
- 💳 **Multiple Payment Options** - Campay, Fapshi, and cash payments
- 🛡️ **Enterprise Security** - Production-grade security and authentication
- 📊 **Admin Dashboard** - Comprehensive restaurant and order management
- 🌍 **Multi-town Support** - Service coverage across Cameroon
- 🔄 **Real-time Delivery Tracking** - GPS-based delivery updates

## 🏗️ Architecture

```
choptym-mobile-menu/
├── src/                    # Frontend React Application
│   ├── components/         # Reusable UI Components
│   ├── pages/             # Page Components
│   ├── hooks/             # Custom React Hooks
│   ├── utils/             # Utility Functions
│   └── types/             # TypeScript Type Definitions
├── server/                # Backend API Server
│   ├── src/
│   │   ├── routes/        # API Route Modules
│   │   ├── middleware/    # Express Middleware
│   │   ├── config/        # Configuration Files
│   │   ├── utils/         # Server Utilities
│   │   └── validators/    # Input Validation
│   └── logs/              # Application Logs
├── config/                # Application Configuration
├── scripts/               # Build and Deployment Scripts
├── docs/                  # Documentation
└── public/                # Static Assets
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Payment processor accounts (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sankofa-Bloom/choptym-mobile-menu.git
   cd choptym-mobile-menu
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   npm install

   # Backend
   cd server && npm install && cd ..
   ```

3. **Environment setup**
   ```bash
   # Copy environment files
   cp config/production.env.example .env
   cd server && cp ../config/production.env.example .env && cd ..
   ```

4. **Configure environment variables**
   Edit `.env` and `server/.env` with your production values

5. **Database setup**
   Run the SQL script in your Supabase dashboard:
   ```sql
   -- Execute: final-delivery-fee-fix.sql
   -- This creates the required database tables
   ```

6. **Start development server**
   ```bash
   npm run dev:full
   ```

## 📱 Usage

### For Customers

1. **Browse Menu**: Explore authentic Cameroonian dishes
2. **Add to Cart**: Select items from multiple restaurants
3. **Choose Location**: Set delivery address with GPS
4. **Secure Payment**: Pay with mobile money or card
5. **Track Delivery**: Real-time GPS tracking
6. **Install PWA**: Add to home screen for app-like experience

### For Restaurants

1. **Register**: Create restaurant profile
2. **Manage Menu**: Add/update dishes with photos
3. **Receive Orders**: Real-time order notifications
4. **Track Revenue**: Comprehensive sales analytics
5. **Manage Delivery**: Coordinate with delivery drivers

### For Admins

1. **Dashboard Access**: Secure admin login
2. **Manage Restaurants**: Approve and monitor restaurants
3. **Order Oversight**: Track all orders and payments
4. **Analytics**: Revenue and performance metrics
5. **Settings**: Configure delivery fees and zones

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start frontend dev server
npm run dev:full         # Start both frontend and backend
npm run server           # Start backend only

# Building
npm run build            # Build for development
npm run build:prod       # Build for production
npm run build:staging    # Build for staging

# Testing
npm run test            # Run tests
npm run test:coverage   # Run tests with coverage
npm run type-check      # TypeScript type checking

# Linting & Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm run security:audit  # Security audit

# Deployment
npm run deploy          # Production deployment
npm run docker:build    # Build Docker image
npm run docker:up       # Start with Docker Compose
```

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── admin/          # Admin dashboard components
│   └── common/         # Shared components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript definitions
└── integrations/       # External service integrations

server/src/
├── routes/             # API route modules
├── middleware/         # Express middleware
├── config/             # Server configuration
├── utils/              # Server utilities
└── validators/         # Input validation
```

## 🚀 Deployment

### Production Deployment

1. **Automated Deployment**
   ```bash
   ./scripts/deploy-production.sh
   ```

2. **Manual Deployment**
   ```bash
   # Build for production
   npm run build:prod

   # Start production server
   npm run serve
   ```

3. **Docker Deployment**
   ```bash
   # Build and run with Docker
   docker-compose up -d
   ```

### Environment Configuration

Production environment variables are documented in `config/production.env.example`

### Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring and logging set up
- [ ] CDN configured for static assets
- [ ] Security headers enabled
- [ ] Performance optimizations applied

## 🛡️ Security

### Features

- **Content Security Policy (CSP)** - Prevents XSS attacks
- **Rate Limiting** - Protects against brute force attacks
- **Input Validation** - Sanitizes all user inputs
- **HTTPS Only** - Forces secure connections
- **Secure Headers** - Comprehensive security headers
- **Authentication** - Secure user authentication
- **Authorization** - Role-based access control

### Security Configuration

Security settings are configured in `config/security.js`:

```javascript
// Example security configuration
const securityConfig = {
  csp: { /* Content Security Policy */ },
  headers: { /* Security headers */ },
  rateLimit: { /* Rate limiting */ },
  validation: { /* Input validation */ },
  auth: { /* Authentication settings */ }
};
```

## 📊 Performance

### Optimizations

- **Code Splitting** - Lazy loading of routes and components
- **Bundle Optimization** - Tree shaking and minification
- **Image Optimization** - WebP format with fallbacks
- **Caching** - Aggressive caching strategies
- **Compression** - Gzip and Brotli compression
- **CDN** - Static asset delivery via CDN

### Monitoring

- **Real-time Metrics** - Response times and error rates
- **Performance Budgets** - Automated performance checks
- **Bundle Analysis** - Detailed bundle size reports
- **Lighthouse Scores** - Automated performance audits

## 🔧 API Documentation

### Base URL
```
https://api.choptym.com
```

### Authentication
Most endpoints require authentication via Bearer token:
```
Authorization: Bearer <token>
```

### Key Endpoints

#### Dishes
- `GET /api/dishes` - Get all dishes
- `GET /api/dishes/:id` - Get dish by ID
- `POST /api/dishes` - Create dish (Admin)
- `PUT /api/dishes/:id` - Update dish (Admin)

#### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurant-menus` - Get restaurant menus
- `POST /api/restaurants` - Create restaurant (Admin)

#### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status

#### Payments
- `POST /api/payments/create-link` - Create payment link
- `GET /api/payments/status/:id` - Check payment status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation
- Ensure security best practices
- Test across different devices/browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@choptym.com
- **Issues**: [GitHub Issues](https://github.com/Sankofa-Bloom/choptym-mobile-menu/issues)
- **Documentation**: [Full Documentation](./docs/)

## 🙏 Acknowledgments

- Built with ❤️ for the Cameroonian community
- Special thanks to all contributors and supporters
- Powered by modern web technologies and Cameroonian innovation

---

**ChopTym** - Bringing authentic Cameroonian flavors to your doorstep! 🇨🇲