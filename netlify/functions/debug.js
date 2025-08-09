const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
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
      // Test basic function execution
      const debugInfo = {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        supabaseUrlPrefix: supabaseUrl?.substring(0, 30) + '...',
        environment: {
          NETLIFY: !!process.env.NETLIFY,
          AWS_REGION: process.env.AWS_REGION,
          NETLIFY_DEV: process.env.NETLIFY_DEV
        }
      };

      // Test Supabase connection if credentials exist
      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Test basic query
          const { data: testData, error: testError } = await supabase
            .from('dishes')
            .select('id')
            .limit(1);

          debugInfo.supabaseTest = {
            success: !testError,
            error: testError?.message,
            hasData: !!testData?.length
          };
        } catch (supabaseErr) {
          debugInfo.supabaseTest = {
            success: false,
            error: supabaseErr.message
          };
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'API_WORKING',
          message: 'ChopTym API Debug Endpoint',
          debug: debugInfo
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          status: 'ERROR',
          message: 'Debug endpoint error',
          error: error.message,
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
