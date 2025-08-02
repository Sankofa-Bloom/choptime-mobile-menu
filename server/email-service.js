const express = require('express');
const nodemailer = require('nodemailer');

// Email service configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Send email function (with real email capability)
const sendEmail = async (to, subject, html, from = process.env.SMTP_USER || 'noreply@kwatalink.com') => {
  try {
    // Check if we have SMTP credentials configured
    const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;
    
    if (hasSmtpConfig) {
      // Send real email
      console.log('=== SENDING REAL EMAIL ===');
      console.log('To:', to);
      console.log('From:', from);
      console.log('Subject:', subject);
      
      const mailOptions = {
        from: from,
        to: to,
        subject: subject,
        html: html
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } else {
      // Fallback to mock email (for development)
      console.log('=== MOCK EMAIL SENT (No SMTP config) ===');
      console.log('To:', to);
      console.log('From:', from);
      console.log('Subject:', subject);
      console.log('HTML Content Length:', html.length);
      console.log('HTML Preview:', html.substring(0, 200) + '...');
      console.log('=== END MOCK EMAIL ===');
      
      return { success: true, messageId: `mock_${Date.now()}` };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const createOrderConfirmationEmail = (orderData) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmed - KwataLink</title>
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
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Total Amount</p>
                <p style="margin: 5px 0 0 0; color: #D57A1F; font-size: 18px; font-weight: 700;">${orderData.totalAmount}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Delivery Time</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">15-30 minutes</p>
              </div>
            </div>
          </div>

          <!-- Delivery Address -->
          <div style="background: #e8f5e8; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #28a745;">
            <h4 style="color: #28a745; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📍</span>
              Delivery Address
            </h4>
            <p style="margin: 0; color: #2c3e50; font-size: 16px; line-height: 1.5;">${orderData.deliveryAddress}</p>
          </div>

          <!-- Status Timeline -->
          <div style="margin: 30px 0;">
            <h4 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 18px;">Order Status</h4>
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="background: #D57A1F; border-radius: 50%; width: 20px; height: 20px; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 12px;">✓</span>
              </div>
              <div>
                <p style="margin: 0; color: #D57A1F; font-weight: 600;">Order Confirmed</p>
                <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Your order has been received</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="background: #e9ecef; border-radius: 50%; width: 20px; height: 20px; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #6c757d; font-size: 12px;">2</span>
              </div>
              <div>
                <p style="margin: 0; color: #6c757d; font-weight: 600;">Preparing</p>
                <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Chefs are cooking your meal</p>
              </div>
            </div>
            <div style="display: flex; align-items: center;">
              <div style="background: #e9ecef; border-radius: 50%; width: 20px; height: 20px; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #6c757d; font-size: 12px;">3</span>
              </div>
              <div>
                <p style="margin: 0; color: #6c757d; font-weight: 600;">On the Way</p>
                <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Your order is being delivered</p>
              </div>
            </div>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin: 40px 0;">
            <p style="color: #555; font-size: 16px; margin: 0 0 20px 0;">
              Have questions about your order?
            </p>
            <a href="tel:${process.env.ADMIN_PHONE || '+237670416449'}" style="display: inline-block; background: linear-gradient(135deg, #D57A1F 0%, #E89A4D 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(213, 122, 31, 0.3);">
              📞 Call Us Now
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2c3e50; color: white; padding: 30px; text-align: center;">
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 20px; color: #D57A1F;">KwataLink</h3>
            <p style="margin: 10px 0 0 0; color: #bdc3c7; font-size: 14px;">Authentic Cameroonian Cuisine Delivered</p>
          </div>
          <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
            <a href="tel:${process.env.ADMIN_PHONE || '+237670416449'}" style="color: #D57A1F; text-decoration: none; font-size: 14px;">📞 ${process.env.ADMIN_PHONE || '+237670416449'}</a>
            <a href="mailto:${process.env.ADMIN_EMAIL || 'admin@kwatalink.com'}" style="color: #D57A1F; text-decoration: none; font-size: 14px;">✉️ ${process.env.ADMIN_EMAIL || 'admin@kwatalink.com'}</a>
          </div>
          <p style="margin: 0; color: #95a5a6; font-size: 12px;">
            Thank you for choosing KwataLink! We appreciate your business.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const createAdminNotificationEmail = (orderData) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order - KwataLink Admin</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%); padding: 30px; text-align: center;">
          <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px; color: white;">🚨</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">New Order Alert!</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Action required - Prepare for delivery</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">New Order Received! 📋</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            A new order has been placed and payment has been confirmed. Please prepare this order for delivery as soon as possible.
          </p>

          <!-- Order Details Card -->
          <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border-left: 5px solid #f39c12;">
            <h3 style="color: #e67e22; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
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
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Total Amount</p>
                <p style="margin: 5px 0 0 0; color: #e67e22; font-size: 18px; font-weight: 700;">${orderData.totalAmount}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Payment Status</p>
                <p style="margin: 5px 0 0 0; color: #28a745; font-size: 16px; font-weight: 600;">✅ Paid</p>
              </div>
            </div>
          </div>

          <!-- Customer Information -->
          <div style="background: #e8f4fd; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #3498db;">
            <h4 style="color: #3498db; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">👤</span>
              Customer Information
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Name</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${orderData.customerName}</p>
              </div>
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Phone</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">
                  <a href="tel:${orderData.customerPhone}" style="color: #3498db; text-decoration: none;">${orderData.customerPhone}</a>
                </p>
              </div>
              <div style="grid-column: 1 / -1;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Email</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">
                  <a href="mailto:${orderData.customerEmail}" style="color: #3498db; text-decoration: none;">${orderData.customerEmail}</a>
                </p>
              </div>
            </div>
          </div>

          <!-- Delivery Address -->
          <div style="background: #e8f5e8; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #28a745;">
            <h4 style="color: #28a745; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📍</span>
              Delivery Address
            </h4>
            <p style="margin: 0; color: #2c3e50; font-size: 16px; line-height: 1.5;">${orderData.deliveryAddress}</p>
          </div>

          <!-- Action Required -->
          <div style="background: #f8d7da; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #dc3545;">
            <h4 style="color: #dc3545; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">⚡</span>
              Action Required
            </h4>
            <p style="margin: 0; color: #721c24; font-size: 16px; line-height: 1.5;">
              Please prepare this order for delivery immediately. Customer has already paid and is expecting delivery within 15-30 minutes.
            </p>
          </div>

          <!-- Quick Actions -->
          <div style="text-align: center; margin: 40px 0;">
            <p style="color: #555; font-size: 16px; margin: 0 0 20px 0;">
              Quick Actions
            </p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
              <a href="tel:${orderData.customerPhone}" style="display: inline-block; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);">
                📞 Call Customer
              </a>
              <a href="mailto:${orderData.customerEmail}" style="display: inline-block; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);">
                ✉️ Email Customer
              </a>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2c3e50; color: white; padding: 30px; text-align: center;">
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 20px; color: #D57A1F;">KwataLink Admin</h3>
            <p style="margin: 10px 0 0 0; color: #bdc3c7; font-size: 14px;">Order Management System</p>
          </div>
          <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
            <a href="tel:${process.env.ADMIN_PHONE || '+237670416449'}" style="color: #D57A1F; text-decoration: none; font-size: 14px;">📞 ${process.env.ADMIN_PHONE || '+237670416449'}</a>
            <a href="mailto:${process.env.ADMIN_EMAIL || 'admin@kwatalink.com'}" style="color: #D57A1F; text-decoration: none; font-size: 14px;">✉️ ${process.env.ADMIN_EMAIL || 'admin@kwatalink.com'}</a>
          </div>
          <p style="margin: 0; color: #95a5a6; font-size: 12px;">
            This is an automated notification. Please respond promptly to ensure customer satisfaction.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Order status update email template
const createOrderStatusUpdateEmail = (orderData, status, message) => {
  const statusColors = {
    'preparing': { bg: '#fff3cd', border: '#ffc107', text: '#856404' },
    'ready': { bg: '#d4edda', border: '#28a745', text: '#155724' },
    'delivering': { bg: '#cce5ff', border: '#007bff', text: '#004085' },
    'delivered': { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460' }
  };

  const statusEmojis = {
    'preparing': '👨‍🍳',
    'ready': '✅',
    'delivering': '🚚',
    'delivered': '🎉'
  };

  const statusText = {
    'preparing': 'Preparing Your Order',
    'ready': 'Order Ready for Pickup',
    'delivering': 'On the Way to You',
    'delivered': 'Order Delivered Successfully'
  };

  const color = statusColors[status] || statusColors['preparing'];
  const emoji = statusEmojis[status] || statusEmojis['preparing'];
  const text = statusText[status] || statusText['preparing'];

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update - KwataLink</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #D57A1F 0%, #E89A4D 100%); padding: 30px; text-align: center;">
          <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px; color: white;">${emoji}</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">${text}</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Order Reference: ${orderData.orderReference}</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Hello ${orderData.customerName}! 👋</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            ${message}
          </p>

          <!-- Status Update Card -->
          <div style="background: ${color.bg}; border-radius: 16px; padding: 30px; margin: 30px 0; border-left: 5px solid ${color.border};">
            <h3 style="color: ${color.text}; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">📋</span>
              Order Status Update
            </h3>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 15px;">🍽️</span>
                <div>
                  <p style="margin: 0; color: #2c3e50; font-size: 18px; font-weight: 600;">${orderData.dishName}</p>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">From: ${orderData.restaurantName}</p>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Order Reference</p>
                <p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${orderData.orderReference}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600;">Status</p>
                <p style="margin: 5px 0 0 0; color: ${color.text}; font-size: 16px; font-weight: 600;">${text}</p>
              </div>
            </div>
          </div>

          <!-- Delivery Address -->
          <div style="background: #e8f5e8; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #28a745;">
            <h4 style="color: #28a745; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📍</span>
              Delivery Address
            </h4>
            <p style="margin: 0; color: #2c3e50; font-size: 16px; line-height: 1.5;">${orderData.deliveryAddress}</p>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin: 40px 0;">
            <p style="color: #555; font-size: 16px; margin: 0 0 20px 0;">
              Need to contact us about your order?
            </p>
            <a href="tel:${process.env.ADMIN_PHONE || '+237670416449'}" style="display: inline-block; background: linear-gradient(135deg, #D57A1F 0%, #E89A4D 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(213, 122, 31, 0.3);">
              📞 Contact Us
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2c3e50; color: white; padding: 30px; text-align: center;">
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 20px; color: #D57A1F;">KwataLink</h3>
            <p style="margin: 10px 0 0 0; color: #bdc3c7; font-size: 14px;">Authentic Cameroonian Cuisine Delivered</p>
          </div>
          <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
            <a href="tel:${process.env.ADMIN_PHONE || '+237670416449'}" style="color: #D57A1F; text-decoration: none; font-size: 14px;">📞 ${process.env.ADMIN_PHONE || '+237670416449'}</a>
            <a href="mailto:${process.env.ADMIN_EMAIL || 'admin@kwatalink.com'}" style="color: #D57A1F; text-decoration: none; font-size: 14px;">✉️ ${process.env.ADMIN_EMAIL || 'admin@kwatalink.com'}</a>
          </div>
          <p style="margin: 0; color: #95a5a6; font-size: 12px;">
            Thank you for choosing KwataLink! We appreciate your business.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendEmail,
  createOrderConfirmationEmail,
  createAdminNotificationEmail,
  createOrderStatusUpdateEmail
}; 