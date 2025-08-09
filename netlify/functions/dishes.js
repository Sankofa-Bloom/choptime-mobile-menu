const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('🔧 Netlify Dishes API Debug:', {
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

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': 'https://www.choptym.com,https://choptym.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
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
      // Additional environment check
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase credentials missing in handler');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Server configuration error',
            details: 'Missing Supabase credentials'
          }),
        };
      }

      console.log('🔧 Fetching dishes from Supabase...');
      const { data: dishes, error } = await supabase
        .from('dishes')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Supabase error fetching dishes:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch dishes',
            details: error.message,
            supabaseError: error
          }),
        };
      }

      console.log('✅ Dishes fetched successfully:', dishes?.length || 0);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: dishes || []
        }),
      };
    } catch (error) {
      console.error('❌ Unexpected error in dishes API:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Internal server error',
          details: error.message,
          stack: error.stack
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
