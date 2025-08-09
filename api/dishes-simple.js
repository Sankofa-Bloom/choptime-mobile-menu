module.exports = async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Simple environment check
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Missing Supabase credentials',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }

    // Try to import and use Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simple query without complex filters
    const { data: dishes, error } = await supabase
      .from('dishes')
      .select('*')
      .limit(10);

    if (error) {
      return res.status(500).json({ 
        error: 'Supabase query failed',
        details: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Simple dishes query successful',
      count: dishes?.length || 0,
      data: dishes || []
    });

  } catch (error) {
    console.error('Dishes simple API error:', error);
    res.status(500).json({ 
      error: 'API error',
      details: error.message,
      stack: error.stack?.split('\n')[0] // Just first line of stack
    });
  }
};
