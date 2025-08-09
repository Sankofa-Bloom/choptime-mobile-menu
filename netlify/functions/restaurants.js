const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  console.log('🔧 Netlify Restaurants API called - status filter removed');
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // More permissive for production
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'false',
    'Content-Type': 'application/json',
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod === 'GET') {
    try {
      const queryParams = event.queryStringParameters || {};
      const { town } = queryParams;
      
      console.log('🔧 Building query for restaurants table...');
      let query = supabase
        .from('restaurants')
        .select('*')
        .order('name');

      // Filter by town if provided
      if (town && town !== 'all') {
        console.log('🔧 Filtering by town:', town);
        query = query.eq('town', town);
      }

      console.log('🔧 Executing query...');
      const { data: restaurants, error } = await query;

      if (error) {
        console.error('Error fetching restaurants:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch restaurants',
            details: error.message
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(restaurants || []), // Return data directly for consistency
      };
    } catch (error) {
      console.error('Unexpected error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Internal server error',
          details: error.message
        }),
      };
    }
  } else {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }
};
