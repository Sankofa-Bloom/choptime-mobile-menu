const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Debug logging
console.log('🔧 Dishes API Debug:', {
  supabaseUrlExists: !!supabaseUrl,
  supabaseKeyExists: !!supabaseKey,
  supabaseUrlStart: supabaseUrl?.substring(0, 20),
  nodeEnv: process.env.NODE_ENV
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://www.choptym.com,https://choptym.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Additional environment check
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase credentials missing in handler');
        return res.status(500).json({ 
          error: 'Server configuration error',
          details: 'Missing Supabase credentials' 
        });
      }

      console.log('🔧 Fetching dishes from Supabase...');
      const { data: dishes, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('❌ Supabase error fetching dishes:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch dishes',
          details: error.message,
          supabaseError: error
        });
      }

      console.log('✅ Dishes fetched successfully:', dishes?.length || 0);
      res.status(200).json({
        success: true,
        data: dishes || []
      });
    } catch (error) {
      console.error('❌ Unexpected error in dishes API:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};