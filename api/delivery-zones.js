import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
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
      const { data: deliveryZones, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('status', 'active')
        .order('town');

      if (error) {
        console.error('Error fetching delivery zones:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch delivery zones',
          details: error.message 
        });
      }

      res.status(200).json({
        success: true,
        data: deliveryZones || []
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
}