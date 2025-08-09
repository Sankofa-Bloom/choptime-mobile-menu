module.exports = function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const healthInfo = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'unknown',
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        environmentVars: {
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
          nodeEnv: process.env.NODE_ENV,
          port: process.env.PORT,
          host: process.env.HOST
        }
      };

      res.status(200).json({
        success: true,
        message: 'API is healthy',
        data: healthInfo
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ 
        error: 'Health check failed',
        details: error.message,
        stack: error.stack
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
