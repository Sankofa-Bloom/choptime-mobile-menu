require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');

// Import API routes
const apiRoutes = require('./api-routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - MUST be first middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Default allowed origins for development
    const defaultOrigins = [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'http://localhost:8082',
      'http://127.0.0.1:8082',
      'http://localhost:8083',
      'http://127.0.0.1:8083',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:5173'
    ];

    // Parse CORS_ORIGIN environment variable (comma-separated)
    let envOrigins = [];
    if (process.env.CORS_ORIGIN) {
      envOrigins = process.env.CORS_ORIGIN.split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    }

    // Combine all allowed origins
    const allowedOrigins = [...defaultOrigins, ...envOrigins];

    // Check if the request origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log(`❌ CORS blocked: ${origin} not in allowed origins:`, allowedOrigins);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Fix CORS issues with helmet
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"], // Allow HTTP for development Supabase
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.fapshi.com", "https://api.campay.net", "https://api.mapbox.com"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  }
}));
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from ChopTym API Server!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ChopTym API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoints:`);
  console.log(`   - Hello: http://localhost:${PORT}/api/hello`);
  console.log(`   - Ping: http://localhost:${PORT}/api/ping`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend should connect to: http://localhost:${PORT}`);
});

module.exports = app;