/**
 * SECURITY CONFIGURATION
 * Production-ready security settings for ChopTym
 */

const securityConfig = {
  // Content Security Policy
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://www.emailjs.com",
        "https://api.emailjs.com",
        "https://js.stripe.com",
        "https://m.stripe.network"
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com"
      ],
      'style-src-elem': [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com"
      ],
      'font-src': [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      'img-src': [
        "'self'",
        "data:",
        "https:",
        "http:",
        "blob:"
      ],
      'connect-src': [
        "'self'",
        "http://localhost:*",
        "http://127.0.0.1:*",
        "ws://127.0.0.1:*",
        "wss://127.0.0.1:*",
        "https://localhost:*",
        "https://*.supabase.co",
        "ws://*.supabase.co",
        "wss://*.supabase.co",
        "https://www.emailjs.com",
        "https://api.emailjs.com",
        "https://api.fapshi.com",
        "https://sandbox.fapshi.com",
        "https://*.fapshi.com",
        "https://api.campay.net",
        "https://sandbox.campay.net",
        "https://api.mapbox.com",
        "wss://*.pusher.com",
        "https://api.stripe.com",
        "https://m.stripe.network"
      ],
      'frame-src': [
        "'self'",
        "https://sandbox.fapshi.com",
        "https://api.fapshi.com",
        "https://api.campay.net",
        "https://sandbox.campay.net",
        "https://js.stripe.com",
        "https://hooks.stripe.com"
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    },
    reportOnly: false,
    reportUri: '/api/security/csp-report'
  },

  // Security Headers
  headers: {
    // HTTPS and Security
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self), microphone=(), camera=(), payment=(self)',

    // Cache Control
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Surrogate-Control': 'max-age=31536000',

    // Feature Policy
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'cross-origin'
  },

  // CORS Configuration
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://choptym.com', 'https://www.choptym.com']
      : ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    credentials: true,
    maxAge: 86400 // 24 hours
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  },

  // Input Validation
  validation: {
    // Phone number validation (Cameroon format)
    phoneRegex: /^(\+237|237)?[2368][0-9]{7,8}$/,

    // Email validation
    emailRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

    // Name validation (allow letters, spaces, hyphens, apostrophes)
    nameRegex: /^[a-zA-Z\s\-']{2,50}$/,

    // Address validation (basic)
    addressRegex: /^[a-zA-Z0-9\s,.\-#]{10,200}$/,

    // Amount validation (positive numbers only)
    amountRegex: /^\d+(\.\d{1,2})?$/,

    // Sanitization rules
    sanitize: {
      maxLength: 1000,
      allowedTags: [],
      allowedAttributes: {}
    }
  },

  // Authentication & Authorization
  auth: {
    // Session configuration
    session: {
      name: 'choptym_session',
      secret: process.env.SESSION_SECRET || 'change-this-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      }
    },

    // Password requirements
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      preventCommon: true
    },

    // Admin access control
    admin: {
      maxLoginAttempts: 5,
      lockoutTime: 30 * 60 * 1000, // 30 minutes
      requireMFA: process.env.NODE_ENV === 'production'
    }
  },

  // File Upload Security
  fileUpload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueName + path.extname(file.originalname));
    }
  },

  // Database Security
  database: {
    // Query timeout
    timeout: 30000, // 30 seconds

    // Connection pool settings
    pool: {
      min: 2,
      max: 20,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 60000
    },

    // SQL injection prevention
    parameterizedQueries: true,

    // Audit logging
    auditLog: {
      enabled: process.env.NODE_ENV === 'production',
      table: 'audit_logs',
      events: ['INSERT', 'UPDATE', 'DELETE']
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: 'json',
    transports: [
      {
        type: 'file',
        filename: 'logs/security.log',
        level: 'warn',
        maxsize: '20m',
        maxFiles: 5
      },
      {
        type: 'file',
        filename: 'logs/error.log',
        level: 'error',
        maxsize: '20m',
        maxFiles: 5
      }
    ]
  },

  // Environment-specific settings
  environment: {
    production: {
      enableCSP: true,
      enableHSTS: true,
      enableRateLimit: true,
      enableAuditLog: true,
      disableDebugRoutes: true
    },
    development: {
      enableCSP: false,
      enableHSTS: false,
      enableRateLimit: false,
      enableAuditLog: false,
      disableDebugRoutes: false
    }
  }
};

// Helper functions
securityConfig.helpers = {
  // Generate CSP header string
  generateCSPHeader: () => {
    const directives = securityConfig.csp.directives;
    const headerParts = [];

    for (const [directive, values] of Object.entries(directives)) {
      if (values.length > 0) {
        headerParts.push(`${directive} ${values.join(' ')}`);
      }
    }

    return headerParts.join('; ');
  },

  // Validate input against patterns
  validateInput: (input, type) => {
    if (!input || typeof input !== 'string') return false;

    const patterns = securityConfig.validation;
    const pattern = patterns[`${type}Regex`];

    return pattern ? pattern.test(input) : false;
  },

  // Sanitize HTML input
  sanitizeInput: (input) => {
    if (!input || typeof input !== 'string') return '';

    // Basic sanitization - remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim()
      .substring(0, securityConfig.validation.sanitize.maxLength);
  }
};

module.exports = securityConfig;