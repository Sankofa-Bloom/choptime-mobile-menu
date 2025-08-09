module.exports = async function handler(req, res) {
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
      // Debug environment variables
      const debugInfo = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
        supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
        supabaseKey: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        environmentVars: {
          NODE_ENV: process.env.NODE_ENV,
          SUPABASE_URL: process.env.SUPABASE_URL?.substring(0, 30) + '...',
          SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...'
        }
      };

      res.status(200).json({
        success: true,
        message: 'API Debug Info',
        data: debugInfo
      });
    } catch (error) {
      console.error('Debug error:', error);
      res.status(500).json({ 
        error: 'Debug endpoint error',
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
