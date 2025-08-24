const fetch = require('node-fetch');

// MTN MoMo API Configuration
const MTN_MOMO_BASE_URL = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
const MTN_MOMO_SUBSCRIPTION_KEY = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
const MTN_MOMO_API_USER = process.env.MTN_MOMO_API_USER;
const MTN_MOMO_API_KEY = process.env.MTN_MOMO_API_KEY;
const MTN_MOMO_TARGET_ENVIRONMENT = process.env.MTN_MOMO_TARGET_ENVIRONMENT || 'sandbox';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Validate environment variables
function validateEnvVars() {
  const requiredVars = [
    'MTN_MOMO_SUBSCRIPTION_KEY',
    'MTN_MOMO_API_USER', 
    'MTN_MOMO_API_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Get access token from MTN MoMo API
async function getAccessToken() {
  try {
    const tokenResponse = await fetch(`${MTN_MOMO_BASE_URL}/collection/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': MTN_MOMO_SUBSCRIPTION_KEY,
        'Authorization': `Basic ${Buffer.from(`${MTN_MOMO_API_USER}:${MTN_MOMO_API_KEY}`).toString('base64')}`
      }
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate environment variables
    validateEnvVars();

    // Parse request body
    const requestData = JSON.parse(event.body);
    const { referenceId } = requestData;

    // Validate required fields
    if (!referenceId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: false,
          error: 'Missing required field: referenceId' 
        })
      };
    }

    // Get access token
    const accessToken = await getAccessToken();

    console.log('MTN MoMo: Checking payment status for reference', referenceId);

    // Check payment status with MTN MoMo API
    const response = await fetch(`${MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Target-Environment': MTN_MOMO_TARGET_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': MTN_MOMO_SUBSCRIPTION_KEY
      }
    });

    if (response.ok) {
      const statusData = await response.json();
      
      console.log('MTN MoMo: Payment status retrieved', {
        referenceId,
        status: statusData.status
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: {
            status: statusData.status,
            amount: statusData.amount,
            currency: statusData.currency,
            externalId: statusData.externalId,
            payer: statusData.payer,
            payerMessage: statusData.payerMessage,
            payeeNote: statusData.payeeNote,
            reason: statusData.reason
          }
        })
      };
    } else {
      const errorText = await response.text();
      console.error('MTN MoMo: Status check failed', {
        status: response.status,
        error: errorText,
        referenceId
      });

      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: `Status check failed: ${response.status} - ${errorText}`
        })
      };
    }

  } catch (error) {
    console.error('MTN MoMo: Status check error', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error: ' + error.message
      })
    };
  }
};
