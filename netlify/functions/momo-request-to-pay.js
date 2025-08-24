const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

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
    const { amount, currency, externalId, payer, payerMessage, payeeNote } = requestData;

    // Validate required fields
    if (!amount || !currency || !externalId || !payer || !payer.partyId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: false,
          error: 'Missing required fields: amount, currency, externalId, payer.partyId' 
        })
      };
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Generate reference ID for this transaction
    const referenceId = uuidv4();

    // Prepare payment request data
    const paymentRequest = {
      amount: amount.toString(),
      currency: currency,
      externalId: externalId,
      payer: {
        partyIdType: payer.partyIdType || 'MSISDN',
        partyId: payer.partyId
      },
      payerMessage: payerMessage || 'ChopTym Food Order Payment',
      payeeNote: payeeNote || 'Payment for ChopTym order'
    };

    console.log('MTN MoMo: Initiating request to pay', {
      referenceId,
      externalId,
      amount,
      currency,
      payerPhone: payer.partyId
    });

    // Make request to MTN MoMo API
    const response = await fetch(`${MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': MTN_MOMO_TARGET_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': MTN_MOMO_SUBSCRIPTION_KEY
      },
      body: JSON.stringify(paymentRequest)
    });

    if (response.status === 202) {
      // Payment request accepted
      console.log('MTN MoMo: Payment request accepted', { referenceId });
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: {
            status: 'PENDING',
            referenceId: referenceId,
            externalId: externalId,
            amount: amount.toString(),
            currency: currency,
            payer: payer,
            payerMessage: payerMessage,
            payeeNote: payeeNote
          }
        })
      };
    } else {
      // Payment request failed
      const errorText = await response.text();
      console.error('MTN MoMo: Payment request failed', {
        status: response.status,
        error: errorText,
        referenceId
      });

      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: `Payment request failed: ${response.status} - ${errorText}`
        })
      };
    }

  } catch (error) {
    console.error('MTN MoMo: Request to pay error', error);
    
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
