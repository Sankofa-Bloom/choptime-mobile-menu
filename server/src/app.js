/**
 * MAIN APPLICATION FILE
 * Production-ready Express application with modular architecture
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Import configurations and middleware
const { securityConfig } = require('../config/security');
const errorHandler = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

// Import route modules
const dishRoutes = require('./routes/dishes');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const locationRoutes = require('./routes/location');
const notificationRoutes = require('./routes/notifications');
const healthRoutes = require('./routes/health');

// Initialize Express app
const app = express();

// Trust proxy for rate limiting and logging
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: securityConfig.environment[process.env.NODE_ENV]?.enableCSP
    ? securityConfig.csp
    : false,
  hsts: securityConfig.environment[process.env.NODE_ENV]?.enableHSTS,
}));

// CORS configuration
app.use(cors(securityConfig.cors));

// Rate limiting
if (securityConfig.environment[process.env.NODE_ENV]?.enableRateLimit) {
  const limiter = rateLimit(securityConfig.rateLimit);
  app.use('/api/', limiter);
}

// Compression
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Logging
const logFormat = process.env.NODE_ENV === 'production'
  ? 'combined'
  : 'dev';

app.use(morgan(logFormat, {
  skip: (req, res) => {
    // Skip logging for health checks and static files
    return req.url === '/health' || req.url.startsWith('/static/');
  }
}));

// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Raw body for Stripe webhooks
    if (req.headers['stripe-signature']) {
      req.rawBody = buf;
    }
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Static files
app.use('/static', express.static(path.join(__dirname, '../../public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// API routes
app.use('/api', dishRoutes);
app.use('/api', restaurantRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);
app.use('/api', adminRoutes);
app.use('/api', locationRoutes);
app.use('/api', notificationRoutes);
app.use('/api', healthRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;