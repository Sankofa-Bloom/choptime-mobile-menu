/**
 * DATABASE CONFIGURATION
 * Supabase client setup with connection pooling and error handling
 */

const { createClient } = require('@supabase/supabase-js');
const { logger } = require('../utils/logger');

// Environment variables validation
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

// Supabase client configuration
const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  options: {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-application-name': 'choptym-server',
        'x-application-version': process.env.npm_package_version || '1.0.0'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
};

// Create Supabase client
const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceKey,
  supabaseConfig.options
);

// Connection test
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('delivery_fee_settings')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    return false;
  }
}

// Health check function
async function healthCheck() {
  try {
    const startTime = Date.now();

    // Test basic connectivity
    const { data, error } = await supabase
      .from('delivery_fee_settings')
      .select('count', { count: 'exact', head: true });

    const responseTime = Date.now() - startTime;

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Closing database connections...');
  // Supabase client handles connection cleanup automatically
});

module.exports = {
  supabase,
  supabaseConfig,
  testConnection,
  healthCheck
};