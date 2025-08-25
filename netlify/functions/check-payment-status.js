// Netlify Function: Check Swychr Payment Status
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
    console.log('Getting new Swychr auth token for status check...');
    
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
 * Check payment status via Swychr API
 */
async function checkPaymentStatus(transaction_id) {
  try {
    const token = await getSwychrAuthToken();
    
    console.log('Checking Swychr payment status for:', transaction_id);

    const response = await fetch(`${SWYCHR_API_BASE}/payment_link_status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ transaction_id })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status check failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.status === 200 && result.data) {
      console.log('Payment status checked successfully:', result.data.status);
      
      return {
        success: true,
        data: {
          status: result.data.status || result.data.payment_status,
          transaction_id: transaction_id,
          amount: result.data.amount,
          payment_date: result.data.payment_date || result.data.completed_at
        },
        message: result.message || 'Status retrieved successfully'
      };
    } else {
      // If status is 404, transaction not found
      if (result.status === 404) {
        return {
          success: true,
          data: {
            status: 'pending',
            transaction_id: transaction_id
          },
          message: 'Transaction still pending'
        };
      }
      
      throw new Error(result.message || 'Failed to get payment status');
    }
  } catch (error) {
    console.error('Check payment status error:', error);
    throw error;
  }
}

/**
 * Update payment record in database
 */
async function updatePaymentRecord(transaction_id, status, payment_data = {}) {
  try {
    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };

    // Add additional payment data if available
    if (payment_data.payment_date) {
      updateData.completed_at = payment_data.payment_date;
    }

    const { data, error } = await supabase
      .from('payment_records')
      .update(updateData)
      .eq('transaction_id', transaction_id);

    if (error) {
      console.error('Database update error:', error);
      // Don't throw here - status check can succeed even if logging fails
    } else {
      console.log('Payment record updated successfully');
    }
  } catch (error) {
    console.error('Update payment record error:', error);
    // Don't throw here - status check can succeed even if logging fails
  }
}

/**
 * Update order status based on payment status
 */
async function updateOrderStatus(transaction_id, payment_status) {
  try {
    // Find the order reference from the transaction ID
    const orderReference = transaction_id.split('_')[1]; // Extract from CHOP_REF_timestamp_random format
    
    if (!orderReference) {
      console.log('Could not extract order reference from transaction ID');
      return;
    }

    let orderStatus = 'pending';
    if (payment_status === 'completed' || payment_status === 'successful' || payment_status === 'success') {
      orderStatus = 'confirmed';
    } else if (payment_status === 'failed' || payment_status === 'cancelled') {
      orderStatus = 'cancelled';
    }

    // Update orders table
    const { error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('order_reference', orderReference);

    if (orderError) {
      console.error('Order update error:', orderError);
    }

    // Update custom_orders table as well
    const { error: customOrderError } = await supabase
      .from('custom_orders')
      .update({ 
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('order_reference', orderReference);

    if (customOrderError) {
      console.error('Custom order update error:', customOrderError);
    }

    console.log(`Order ${orderReference} status updated to ${orderStatus}`);
  } catch (error) {
    console.error('Update order status error:', error);
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
    const { transaction_id } = JSON.parse(event.body);

    // Validate required fields
    if (!transaction_id) {
      throw new Error('Missing required field: transaction_id');
    }

    // Check payment status
    const result = await checkPaymentStatus(transaction_id);

    // Update payment record in database (non-blocking)
    if (result.success && result.data) {
      await updatePaymentRecord(transaction_id, result.data.status, result.data);
      await updateOrderStatus(transaction_id, result.data.status);
    }

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
        message: 'Failed to check payment status'
      })
    };
  }
};
