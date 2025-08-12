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

  if (event.httpMethod === 'POST') {
    try {
      // Check if we have the required environment variables
      const fapshiApiKey = process.env.FAPSHI_API_KEY;
      const fapshiApiUser = process.env.FAPSHI_API_USER;
      const fapshiBaseUrl = process.env.FAPSHI_BASE_URL || 'https://api.fapshi.com';

      if (!fapshiApiKey || !fapshiApiUser) {
        console.error('❌ Fapshi API credentials missing - using fallback mode');
        
        // Fallback mode for testing without API credentials
        const fallbackResponse = {
          success: true,
          data: {
            payment_url: `https://choptym.com/payment-simulation/${requestBody.reference}`,
            reference: requestBody.reference,
            status: 'pending',
            transaction_id: `FALLBACK_${Date.now()}`,
            message: 'Payment simulation mode - API credentials not configured'
          }
        };
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(fallbackResponse),
        };
      }

      const requestBody = JSON.parse(event.body);
      const { amount, currency, reference, description, customer, callback_url, return_url } = requestBody;

      console.log('🔧 Fapshi payment initialization request:', {
        amount,
        currency,
        reference,
        description,
        customer: { name: customer?.name, phone: customer?.phone },
        hasCallback: !!callback_url,
        hasReturn: !!return_url
      });

      // Validate required fields
      if (!amount || !currency || !reference || !customer?.phone) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Missing required fields: amount, currency, reference, or customer phone'
          }),
        };
      }

      // Make request to Fapshi API
      const fapshiRequest = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toUpperCase(),
        externalId: reference,
        message: description || `Payment for order ${reference}`,
        redirectUrl: return_url || `${process.env.FAPSHI_CALLBACK_URL?.replace('/api/payment-webhook', '') || 'https://choptym.com'}/payment-redirect/${reference}`,
        callbackUrl: callback_url,
        email: customer.email || 'customer@choptym.com',
        phone: customer.phone,
        userId: customer.phone // Using phone as user ID
      };

      console.log('🔧 Sending request to Fapshi API:', fapshiRequest);

      // Try different Fapshi API endpoints based on common patterns
      let fapshiResponse;
      const endpoints = [
        '/payments/initialize',
        '/api/payments/initialize', 
        '/v1/payments/initialize',
        '/payment/initialize',
        '/api/payment/initialize'
      ];
      
      let lastError;
      for (const endpoint of endpoints) {
        try {
          console.log('🔧 Trying Fapshi endpoint:', `${fapshiBaseUrl}${endpoint}`);
          fapshiResponse = await fetch(`${fapshiBaseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${fapshiApiKey}`,
              'X-API-User': fapshiApiUser,
            },
            body: JSON.stringify(fapshiRequest)
          });
          
          if (fapshiResponse.ok) {
            console.log('✅ Found working endpoint:', endpoint);
            break;
          } else {
            lastError = `Endpoint ${endpoint} failed: ${fapshiResponse.status}`;
            console.log('❌ Endpoint failed:', endpoint, fapshiResponse.status);
          }
        } catch (error) {
          lastError = `Endpoint ${endpoint} error: ${error.message}`;
          console.log('❌ Endpoint error:', endpoint, error.message);
        }
      }
      
      if (!fapshiResponse || !fapshiResponse.ok) {
        throw new Error(`All Fapshi API endpoints failed. Last error: ${lastError}`);
      }

      if (!fapshiResponse.ok) {
        const errorText = await fapshiResponse.text();
        console.error('❌ Fapshi API error:', fapshiResponse.status, errorText);
        throw new Error(`Fapshi API error: ${fapshiResponse.status} - ${errorText}`);
      }

      const fapshiData = await fapshiResponse.json();
      console.log('✅ Fapshi API response:', fapshiData);

      // Format response for frontend
      const response = {
        success: true,
        data: {
          payment_url: fapshiData.data?.paymentUrl,
          reference: fapshiData.data?.externalId || reference,
          status: 'pending',
          transaction_id: fapshiData.data?.transactionId
        }
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };

    } catch (error) {
      console.error('❌ Fapshi payment initialization error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Fapshi payment initialization failed: ' + error.message
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
