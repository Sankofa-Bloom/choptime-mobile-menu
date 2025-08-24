const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// Email configuration
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@choptym.com';

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Validate environment variables
function validateEnvVars() {
  const requiredVars = [
    'EMAIL_USER',
    'EMAIL_PASS',
    'ADMIN_EMAIL',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Create email transporter
function createTransporter() {
  const transportConfig = {
    service: EMAIL_SERVICE,
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT),
    secure: EMAIL_PORT === '465',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  };

  // Remove undefined properties
  Object.keys(transportConfig).forEach(key => {
    if (transportConfig[key] === undefined) {
      delete transportConfig[key];
    }
  });

  return nodemailer.createTransporter(transportConfig);
}

// Format order details for email
function formatOrderDetails(orderData) {
  const { order_details, customer_name, customer_phone, customer_email, delivery_address, total_amount, delivery_fee, payment_reference, restaurant_name } = orderData;

  let orderItemsText = '';
  
  if (order_details && order_details.items && order_details.items.length > 0) {
    orderItemsText = order_details.items.map(item => 
      `• ${item.name} x${item.quantity} - ${item.price * item.quantity} FCFA`
    ).join('\n');
  } else if (order_details && order_details.customOrder) {
    orderItemsText = `Custom Order: ${order_details.customOrder.description}\nBudget: ${order_details.customOrder.budget} FCFA`;
  }

  const subtotal = total_amount - (delivery_fee || 0);

  return `
New Order Received - ChopTym

ORDER DETAILS:
Reference: ${payment_reference}
Restaurant: ${restaurant_name || 'N/A'}

CUSTOMER INFORMATION:
Name: ${customer_name}
Phone: ${customer_phone}
Email: ${customer_email || 'N/A'}
Delivery Address: ${delivery_address}

ORDER ITEMS:
${orderItemsText}

PAYMENT SUMMARY:
Subtotal: ${subtotal} FCFA
Delivery Fee: ${delivery_fee || 0} FCFA
Total Amount: ${total_amount} FCFA
Payment Method: MTN MoMo
Payment Status: Confirmed

Please prepare this order for delivery.

---
ChopTym - Authentic Cameroonian Cuisine
`;
}

// Update order status in database
async function updateOrderStatus(supabase, referenceId, status) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('payment_reference', referenceId);

    if (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }

    console.log('Order status updated successfully:', referenceId, status);
  } catch (error) {
    console.error('Error updating order status:', error);
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
    const { orderData, referenceId } = requestData;

    if (!orderData || !referenceId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: false,
          error: 'Missing required fields: orderData, referenceId' 
        })
      };
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create email transporter
    const transporter = createTransporter();

    // Format email content
    const emailContent = formatOrderDetails(orderData);

    // Email options
    const mailOptions = {
      from: EMAIL_USER,
      to: ADMIN_EMAIL,
      subject: `New ChopTym Order - ${referenceId}`,
      text: emailContent
    };

    console.log('Sending order confirmation email to admin:', ADMIN_EMAIL);

    // Send email
    await transporter.sendMail(mailOptions);
    
    console.log('Order confirmation email sent successfully');

    // Update order status to confirmed
    await updateOrderStatus(supabase, referenceId, 'confirmed');

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Order email sent and status updated successfully'
      })
    };

  } catch (error) {
    console.error('Send order email error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to send order email: ' + error.message
      })
    };
  }
};
