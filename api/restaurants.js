const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
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
      const { town } = req.query;
      
      let query = supabase
        .from('restaurants')
        .select('*')
        .order('name');

      // Filter by town if provided
      if (town && town !== 'all') {
        query = query.eq('town', town);
      }

      const { data: restaurants, error } = await query;

      if (error) {
        console.error('Error fetching restaurants:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch restaurants',
          details: error.message 
        });
      }

      res.status(200).json({
        success: true,
        data: restaurants || []
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};