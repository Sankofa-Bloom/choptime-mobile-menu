const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// =============================================================================
// SECURITY MIDDLEWARE FOR CHOPTYM BACKEND
// =============================================================================

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message = 'Too many requests from this IP') => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: message,
      retryAfter: Math.ceil((windowMs || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil((windowMs || 15 * 60 * 1000) / 1000)
      });
    }
  });
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  optionsSuccessStatus: 200
};

// Helmet security headers
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"], // Allow HTTP for development Supabase
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.fapshi.com", "https://api.campay.net", "https://api.mapbox.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
};

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

// Webhook signature verification
const verifyWebhookSignature = (payload, signature, secret) => {
  try {
    if (!signature || !secret) {
      console.warn('Missing signature or secret for webhook verification');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

// JWT utilities
const generateJWT = (payload, secret = process.env.JWT_SECRET) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, secret, { 
    expiresIn: '24h',
    issuer: 'choptym-backend',
    audience: 'choptym-client'
  });
};

const verifyJWT = (token, secret = process.env.JWT_SECRET) => {
  const jwt = require('jsonwebtoken');
  try {
    return jwt.verify(token, secret, {
      issuer: 'choptym-backend',
      audience: 'choptym-client'
    });
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
};

// Validation middleware
const validatePaymentWebhook = [
  body('reference').notEmpty().withMessage('Payment reference is required'),
  body('status').isIn(['success', 'failed', 'pending']).withMessage('Invalid payment status'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    next();
  }
];

const validateOrder = [
  body('customerName').trim().isLength({ min: 2, max: 100 }).withMessage('Customer name must be 2-100 characters'),
  body('customerPhone').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
  body('customerEmail').isEmail().withMessage('Invalid email format'),
  body('deliveryAddress').trim().isLength({ min: 10, max: 500 }).withMessage('Delivery address must be 10-500 characters'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    next();
  }
];

// Logging configuration
const logFormat = process.env.NODE_ENV === 'production' 
  ? 'combined'
  : ':method :url :status :res[content-length] - :response-time ms';

const requestLogger = morgan(logFormat, {
  skip: (req, res) => {
    return req.url === '/health' || req.url.startsWith('/static');
  }
});

const errorLogger = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next(err);
};

// Main security middleware setup
const setupSecurityMiddleware = (app) => {
  // Security headers
  app.use(helmet(helmetConfig));
  
  // Compression
  app.use(compression());
  
  // Request logging
  if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
    app.use(requestLogger);
  }
  
  // Body parsing with limits
  app.use(express.json({ 
    limit: process.env.MAX_REQUEST_SIZE || '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: process.env.MAX_REQUEST_SIZE || '10mb' 
  }));
  
  // Rate limiting
  app.use(createRateLimiter());
  app.use('/api/payment', createRateLimiter(5 * 60 * 1000, 20, 'Too many payment requests'));
  
  // Error logging
  app.use(errorLogger);
};

module.exports = {
  createRateLimiter,
  corsOptions,
  helmetConfig,
  validatePaymentWebhook,
  validateOrder,
  verifyWebhookSignature,
  generateJWT,
  verifyJWT,
  sanitizeInput,
  setupSecurityMiddleware,
  requestLogger,
  errorLogger
}; 