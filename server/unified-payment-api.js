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

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

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