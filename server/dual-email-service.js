const nodemailer = require('nodemailer');

// Email configurations
const gmailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER || 'choptym237@gmail.com',
    pass: process.env.GMAIL_PASS || 'nvun brvc nkpy gzlk'
  }
};

const zohoConfig = {
  host: 'smtp.zoho.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ZOHO_USER || 'support@choptym.com',
    pass: process.env.ZOHO_PASS || 'BZCyjSkvdZ4g'
  }
};

// Create transporters
const createGmailTransporter = () => {
  try {
    const transporter = nodemailer.createTransport(gmailConfig);
    return transporter;
  } catch (error) {
    console.error('❌ Error creating Gmail transporter:', error);
    return null;
  }
};

const createZohoTransporter = () => {
  try {
    const transporter = nodemailer.createTransport(zohoConfig);
    return transporter;
  } catch (error) {
    console.error('❌ Error creating Zoho transporter:', error);
    return null;
  }
};

// Send email with fallback
const sendEmailWithFallback = async (to, subject, html, options = {}) => {
  const { text, priority = 'gmail' } = options;
  
  console.log('📧 Sending email with fallback system...');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Priority provider:', priority);
  
  // Determine primary and fallback providers
  const primaryProvider = priority === 'zoho' ? 'zoho' : 'gmail';
  const fallbackProvider = primaryProvider === 'gmail' ? 'zoho' : 'gmail';
  
  // Try primary provider first
  console.log(`🔄 Attempting to send via ${primaryProvider.toUpperCase()}...`);
  const primaryResult = await sendEmailWithProvider(to, subject, html, text, primaryProvider);
  
  if (primaryResult.success) {
    console.log(`✅ Email sent successfully via ${primaryProvider.toUpperCase()}: ${primaryResult.messageId}`);
    return {
      success: true,
      messageId: primaryResult.messageId,
      provider: primaryProvider,
      fallback: false
    };
  }
  
  // Try fallback provider
  console.log(`🔄 Primary provider failed, trying ${fallbackProvider.toUpperCase()}...`);
  const fallbackResult = await sendEmailWithProvider(to, subject, html, text, fallbackProvider);
  
  if (fallbackResult.success) {
    console.log(`✅ Email sent successfully via ${fallbackProvider.toUpperCase()} (fallback): ${fallbackResult.messageId}`);
    return {
      success: true,
      messageId: fallbackResult.messageId,
      provider: fallbackProvider,
      fallback: true
    };
  }
  
  // Both providers failed
  console.error('❌ Both email providers failed');
  return {
    success: false,
    error: `Primary (${primaryProvider}) failed: ${primaryResult.error}. Fallback (${fallbackProvider}) failed: ${fallbackResult.error}`,
    provider: null,
    fallback: false
  };
};

// Send email with specific provider
const sendEmailWithProvider = async (to, subject, html, text, provider) => {
  try {
    const transporter = provider === 'gmail' ? createGmailTransporter() : createZohoTransporter();
    
    if (!transporter) {
      return {
        success: false,
        error: `${provider.toUpperCase()} transporter not available`
      };
    }
    
    const mailOptions = {
      from: provider === 'gmail' 
        ? `"${process.env.EMAIL_FROM_NAME || 'ChopTym'}" <${process.env.GMAIL_USER}>`
        : `"${process.env.EMAIL_FROM_NAME || 'ChopTym'}" <${process.env.ZOHO_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '')
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`❌ Error sending email via ${provider.toUpperCase()}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Enhanced email templates
const createOrderConfirmationEmail = (orderData) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmed - ChopTym</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #D57A1F 0%, #E89A4D 100%); padding: 30px; text-align: center;">
          <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px; color: white;">🍽️</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Order Confirmed!</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Your delicious meal is being prepared</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Hello ${orderData.customerName}! 👋</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Great news! Your order has been confirmed and our chefs are already working on your delicious meal. 
            We'll notify you as soon as it's ready for delivery.
          </p>

          <!-- Order Details Card -->
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border-left: 5px solid #D57A1F;">
            <h3 style="color: #D57A1F; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">📋</span>
              Order Details
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Order Reference</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${orderData.orderReference}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Restaurant</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${orderData.restaurantName}</p>
              </div>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 15px;">🍽️</span>
                <div>
                  <p style="margin: 0; color: #2c3e50; font-size: 18px; font-weight: 600;">${orderData.dishName}</p>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Quantity: ${orderData.quantity}</p>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #e9ecef;">
                <span style="color: #6c757d; font-size: 14px;">Total Amount:</span>
                <span style="color: #D57A1F; font-size: 20px; font-weight: 600;">${orderData.totalAmount} FCFA</span>
              </div>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Delivery Address</p>
              <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">${orderData.deliveryAddress}</p>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">📱</span>
              What's Next?
            </h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li style="margin-bottom: 8px;">Our chefs are preparing your meal</li>
              <li style="margin-bottom: 8px;">You'll receive updates on your order status</li>
              <li style="margin-bottom: 8px;">Our delivery team will contact you when ready</li>
              <li>Estimated delivery time: 30-45 minutes</li>
            </ul>
          </div>

          <!-- Contact Info -->
          <div style="text-align: center; margin: 40px 0 20px 0;">
            <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">Need help? Contact us:</p>
            <div style="display: flex; justify-content: center; gap: 20px;">
              <div style="text-align: center;">
                <span style="font-size: 20px; color: #D57A1F;">📧</span>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">support@choptym.com</p>
              </div>
              <div style="text-align: center;">
                <span style="font-size: 20px; color: #D57A1F;">📞</span>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 14px;">+237 670 416 449</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
          <p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-size: 12px;">
            © 2024 ChopTym. All rights reserved. | Delicious meals delivered to your doorstep.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendEmailWithFallback,
  createOrderConfirmationEmail,
  createGmailTransporter,
  createZohoTransporter
};
