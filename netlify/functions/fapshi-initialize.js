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

      const fapshiResponse = await fetch(`${fapshiBaseUrl}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${fapshiApiKey}`,
          'X-API-User': fapshiApiUser,
        },
        body: JSON.stringify(fapshiRequest)
      });

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
