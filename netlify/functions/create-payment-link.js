// Netlify Function: Create Swychr Payment Link
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Swychr API configuration
const SWYCHR_API_BASE = 'https://api.accountpe.com/api/payin';
const SWYCHR_EMAIL = process.env.SWYCHR_EMAIL;
const SWYCHR_PASSWORD = process.env.SWYCHR_PASSWORD;

// Cache for auth token
let authToken = null;
let tokenExpiry = null;

/**
 * Get authentication token from Swychr
 */
async function getSwychrAuthToken() {
  // Return cached token if still valid
  if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
    return authToken;
  }

  try {
    console.log('Getting new Swychr auth token...');
    
    const response = await fetch(`${SWYCHR_API_BASE}/admin/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: SWYCHR_EMAIL,
        password: SWYCHR_PASSWORD
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Auth failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.token) {
      authToken = data.token;
      // Set token expiry to 23 hours from now (assume 24h validity)
      tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
      console.log('Swychr auth token obtained successfully');
      return authToken;
    } else {
      throw new Error('No token in auth response');
    }
  } catch (error) {
    console.error('Swychr auth error:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Create payment link via Swychr API
 */
async function createPaymentLink(paymentData) {
  try {
    const token = await getSwychrAuthToken();
    
    console.log('Creating Swychr payment link:', {
      transaction_id: paymentData.transaction_id,
      amount: paymentData.amount,
      country_code: paymentData.country_code
    });

    const response = await fetch(`${SWYCHR_API_BASE}/create_payment_links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Payment link creation failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.status === 200 && result.data) {
      console.log('Payment link created successfully');
      return {
        success: true,
        data: {
          payment_link: result.data.payment_link || result.data.link,
          transaction_id: paymentData.transaction_id,
          status: 'created'
        },
        message: result.message || 'Payment link created successfully'
      };
    } else {
      throw new Error(result.message || 'Failed to create payment link');
    }
  } catch (error) {
    console.error('Create payment link error:', error);
    throw error;
  }
}

/**
 * Store payment record in database
 */
async function storePaymentRecord(paymentData) {
  try {
    const { data, error } = await supabase
      .from('payment_records')
      .insert([
        {
          transaction_id: paymentData.transaction_id,
          order_reference: paymentData.order_reference,
          customer_name: paymentData.name,
          customer_email: paymentData.email,
          customer_phone: paymentData.mobile,
          amount: paymentData.amount,
          currency: 'XAF',
          payment_method: 'swychr',
          status: 'pending',
          description: paymentData.description,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Database insert error:', error);
      // Don't throw here - payment can proceed even if logging fails
    } else {
      console.log('Payment record stored successfully');
    }
  } catch (error) {
    console.error('Store payment record error:', error);
    // Don't throw here - payment can proceed even if logging fails
  }
}

/**
 * Netlify Function Handler
 */
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate environment variables
    if (!SWYCHR_EMAIL || !SWYCHR_PASSWORD) {
      throw new Error('Missing Swychr credentials in environment variables');
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Parse request body
    const paymentData = JSON.parse(event.body);

    // Validate required fields
    const requiredFields = ['country_code', 'name', 'email', 'transaction_id', 'amount', 'pass_digital_charge'];
    for (const field of requiredFields) {
      if (!paymentData[field] && paymentData[field] !== false) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Ensure amount is a number
    paymentData.amount = Number(paymentData.amount);
    if (isNaN(paymentData.amount) || paymentData.amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Store payment record in database (non-blocking)
    await storePaymentRecord(paymentData);

    // Create payment link
    const result = await createPaymentLink(paymentData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to create payment link'
      })
    };
  }
};
