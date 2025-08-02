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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #D57A1F;">Order Confirmed - KwataLink</h2>
      <p>Dear ${orderData.customerName},</p>
      <p>Your order has been confirmed and is being prepared!</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Order Details</h3>
        <p><strong>Order Reference:</strong> ${orderData.orderReference}</p>
        <p><strong>Restaurant:</strong> ${orderData.restaurantName}</p>
        <p><strong>Dish:</strong> ${orderData.dishName}</p>
        <p><strong>Quantity:</strong> ${orderData.quantity}</p>
        <p><strong>Total Amount:</strong> ${orderData.totalAmount}</p>
        <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
        <p><strong>Estimated Delivery:</strong> 15-30 minutes</p>
      </div>
      
      <p>We'll notify you when your order is ready for delivery.</p>
      <p>Thank you for choosing KwataLink!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>KwataLink - Authentic Cameroonian Cuisine Delivered</p>
        <p>Contact: ${process.env.ADMIN_PHONE || '+237670416449'}</p>
      </div>
    </div>
  `;
};

const createAdminNotificationEmail = (orderData) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #D57A1F;">New Order Notification - KwataLink</h2>
      <p>A new order has been placed and requires your attention.</p>
      
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3>Order Details</h3>
        <p><strong>Order Reference:</strong> ${orderData.orderReference}</p>
        <p><strong>Customer Name:</strong> ${orderData.customerName}</p>
        <p><strong>Customer Email:</strong> ${orderData.customerEmail}</p>
        <p><strong>Customer Phone:</strong> ${orderData.customerPhone}</p>
        <p><strong>Restaurant:</strong> ${orderData.restaurantName}</p>
        <p><strong>Dish:</strong> ${orderData.dishName}</p>
        <p><strong>Total Amount:</strong> ${orderData.totalAmount}</p>
        <p><strong>Payment Status:</strong> Paid</p>
      </div>
      
      <p><strong>Action Required:</strong> Please prepare this order for delivery.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>KwataLink Admin Panel</p>
      </div>
    </div>
  `;
};

module.exports = {
  sendEmail,
  createOrderConfirmationEmail,
  createAdminNotificationEmail
}; 