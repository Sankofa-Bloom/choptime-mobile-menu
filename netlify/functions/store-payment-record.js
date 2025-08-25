// Netlify Function: Store Payment Record
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Store payment record in database
 */
async function storePaymentRecord(data) {
  try {
    const { data: result, error } = await supabase
      .from('payment_records')
      .insert([
        {
          transaction_id: data.transaction_id,
          order_reference: data.order_data?.orderReference,
          customer_name: data.order_data?.customerName,
          customer_email: data.order_data?.customerEmail,
          customer_phone: data.order_data?.customerPhone,
          amount: data.order_data?.total || 0,
          currency: 'XAF',
          payment_method: data.payment_method || 'swychr',
          status: data.status || 'pending',
          description: `ChopTym Order - ${data.order_data?.orderReference}`,
          order_data: data.order_data,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Payment record stored successfully');
    return {
      success: true,
      message: 'Payment record stored successfully'
    };
  } catch (error) {
    console.error('Store payment record error:', error);
    throw error;
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
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Parse request body
    const data = JSON.parse(event.body);

    // Validate required fields
    if (!data.transaction_id) {
      throw new Error('Missing required field: transaction_id');
    }

    // Store payment record
    const result = await storePaymentRecord(data);

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
        message: 'Failed to store payment record'
      })
    };
  }
};
