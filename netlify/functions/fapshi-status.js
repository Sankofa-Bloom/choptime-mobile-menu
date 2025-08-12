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
      // Check if we have the required environment variables
      const fapshiApiKey = process.env.FAPSHI_API_KEY;
      const fapshiApiUser = process.env.FAPSHI_API_USER;
      const fapshiBaseUrl = process.env.FAPSHI_BASE_URL || 'https://api.fapshi.com';

      if (!fapshiApiKey || !fapshiApiUser) {
        console.error('❌ Fapshi API credentials missing');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Fapshi API credentials not configured'
          }),
        };
      }

      const { reference } = event.pathParameters || {};
      
      if (!reference) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Missing reference parameter'
          }),
        };
      }

      console.log('🔧 Checking Fapshi payment status for:', reference);

      // Make request to Fapshi API to check status
      const fapshiResponse = await fetch(`${fapshiBaseUrl}/payments/status/${reference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${fapshiApiKey}`,
          'X-API-User': fapshiApiUser,
        }
      });

      if (!fapshiResponse.ok) {
        const errorText = await fapshiResponse.text();
        console.error('❌ Fapshi API error:', fapshiResponse.status, errorText);
        throw new Error(`Fapshi API error: ${fapshiResponse.status} - ${errorText}`);
      }

      const fapshiData = await fapshiResponse.json();
      console.log('✅ Fapshi status response:', fapshiData);

      // Format response for frontend
      const response = {
        success: true,
        data: {
          reference: fapshiData.data?.externalId || reference,
          status: fapshiData.data?.status || 'unknown',
          transaction_id: fapshiData.data?.transactionId,
          amount: fapshiData.data?.amount,
          currency: fapshiData.data?.currency,
          created_at: fapshiData.data?.createdAt,
          updated_at: fapshiData.data?.updatedAt
        }
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };

    } catch (error) {
      console.error('❌ Fapshi status check error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Fapshi status check failed: ' + error.message
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
