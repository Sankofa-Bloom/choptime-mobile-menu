const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get Limbe localities using the custom function
    const { data, error } = await supabase.rpc('get_limbe_localities');
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Group localities by zone for easier frontend consumption
    const groupedLocalities = {
      'Zone A': [],
      'Zone B': [],
      'Zone C': []
    };

    if (data) {
      data.forEach(item => {
        if (groupedLocalities[item.zone_name]) {
          groupedLocalities[item.zone_name].push({
            locality: item.locality,
            fee: item.fee
          });
        }
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          localities: data || [],
          grouped: groupedLocalities
        }
      })
    };

  } catch (error) {
    console.error('Error fetching Limbe localities:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch localities',
        details: error.message
      })
    };
  }
};



