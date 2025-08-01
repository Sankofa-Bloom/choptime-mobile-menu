# EmailJS Setup Guide

## Problem
You're getting a 422 error: "The recipients address is empty" when trying to send emails via EmailJS.

## Solution
The issue is likely with your EmailJS template configuration. Here's how to fix it:

## Step 1: Check Your EmailJS Template

1. **Go to EmailJS Dashboard**: https://www.emailjs.com/
2. **Navigate to Email Templates**
3. **Find your template**: `order_confirmation`
4. **Check the template variables**

## Step 2: Required Template Variables

Your EmailJS template should include these variables:

### Customer Template Variables:
- `{{customer_name}}` - Customer's name
- `{{customer_phone}}` - Customer's phone number
- `{{customer_location}}` - Delivery location
- `{{payment_method}}` - Payment method
- `{{order_id}}` - Order reference number
- `{{order_date}}` - Order date
- `{{orders}}` - Array of order items (each with `image_url`, `name`, `restaurant_name`, `units`, `price`)
- `{{cost}}` - Object with `subtotal`, `shipping`, `tax`, `total`
- `{{reply_to}}` - Admin email for replies

### Admin Template Variables (Additional):
- `{{order_time}}` - Order time (for admin notifications)
- `{{reply_to}}` - Admin email for replies
- `{{email}}` - Customer's email address (only shown if provided - email payment method)

```html
<!-- Basic EmailJS Template Structure -->
<!DOCTYPE html>
<html>
<head>
    <title>ChopTime Order Confirmation</title>
</head>
<body>
    <h1>Order Confirmation</h1>
    
    <!-- Customer Information -->
    <p>Dear {{customer_name}},</p>
    <p>Phone: {{customer_phone}}</p>
    <p>Location: {{customer_location}}</p>
    
    <!-- Order Details -->
    <h2>Order Reference: {{order_id}}</h2>
    <p>Order Date: {{order_date}}</p>
    
    <!-- Order Items -->
    {{#orders}}
    <div>
        <img src="{{image_url}}" alt="{{name}}" />
        <h3>{{name}}</h3>
        <p>Restaurant: {{restaurant_name}}</p>
        <p>Quantity: {{units}}</p>
        <p>Price: {{price}} FCFA</p>
    </div>
    {{/orders}}
    
    <!-- Cost Breakdown -->
    <h3>Order Summary</h3>
    <p>Subtotal: {{cost.subtotal}} FCFA</p>
    <p>Delivery Fee: {{cost.shipping}} FCFA</p>
    <p>Tax: {{cost.tax}} FCFA</p>
    <p><strong>Total: {{cost.total}} FCFA</strong></p>
    
    <!-- Payment Method -->
    <p>Payment Method: {{payment_method}}</p>
    
    <!-- Footer -->
    <p>Thank you for choosing ChopTime!</p>
    <p>We'll contact you shortly to confirm your order.</p>
</body>
</html>
```

## Step 3: Common EmailJS Template Variables

Make sure your template uses these variable names:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{to_name}}` | Customer name | "John Doe" |
| `{{to_email}}` | Customer email | "customer@example.com" |
| `{{order_reference}}` | Order reference | "CHP-123456" |
| `{{dish_name}}` | Dish name | "Eru with Fufu" |
| `{{restaurant_name}}` | Restaurant name | "Mama's Kitchen" |
| `{{quantity}}` | Quantity ordered | 2 |
| `{{price}}` | Price per item | 2500 |
| `{{total_amount}}` | Total order amount | 5000 |
| `{{delivery_fee}}` | Delivery fee | 500 |
| `{{customer_phone}}` | Customer phone | "+237 670 416 449" |
| `{{customer_location}}` | Delivery address | "Douala, Cameroon" |
| `{{payment_method}}` | Payment method | "Cash on Delivery" |

## Step 4: Alternative Template Variables

If your template uses different variable names, update the code in your order processing functions:

```typescript
const testParams = {
  // Standard EmailJS variables
  to_name: 'Test Customer',
  to_email: testEmail,
  
  // Your custom variables
  customer_name: 'Test Customer',
  customer_email: testEmail,
  order_id: 'TEST-123456',
  item_name: 'Test Dish',
  restaurant: 'Test Restaurant',
  qty: 2,
  unit_price: 2500,
  total: 5000,
  delivery: 500,
  phone: '+237 670 416 449',
  address: 'Test Location, Douala',
  payment: 'Cash on Delivery',
  
  // Additional variables
  message: 'This is a test order confirmation email from ChopTime.',
  reply_to: 'choptime237@gmail.com'
};
```

## Step 5: Test Your Template

1. **Update your EmailJS template** with the correct variables
2. **Test the email functionality** using the EmailTest component
3. **Check the console** for any remaining errors

## Step 6: Environment Variables Check

Make sure these are set in your `.env` file:

```env
VITE_EMAILJS_SERVICE_ID=service_4beuwe5
VITE_EMAILJS_USER_ID=lTTBvyuuFE8XG5fZl
VITE_EMAILJS_ORDER_TEMPLATE_ID=order_confirmation
VITE_EMAILJS_ADMIN_TEMPLATE_ID=admin_notification
VITE_ADMIN_EMAIL=admin@choptime.com
```

## Common Issues and Solutions

### Issue 1: "The recipients address is empty"
**Solution**: Make sure your template uses `{{to_email}}` or `{{user_email}}` variable

### Issue 2: Template variables not showing
**Solution**: Check that variable names match exactly (case-sensitive)

### Issue 3: 422 Unprocessable Content
**Solution**: Verify all required template variables are provided in the code

### Issue 4: 401 Unauthorized
**Solution**: Check your User ID (Public Key) in EmailJS dashboard

### Issue 5: 404 Not Found
**Solution**: Verify Service ID and Template ID are correct

## Testing

After setting up your template correctly:

1. **Start the development server**: `npm run dev`
2. **Place a test order** to verify email functionality
3. **Check your email inbox** for order confirmation
4. **Check admin email** for order notification

## Quick Fix

If you're still getting "The recipients address is empty" error:

1. **Copy the template from `CHOPTIME_EMAIL_TEMPLATE.html`**
2. **Go to EmailJS Dashboard** → Email Templates
3. **Edit your `order_confirmation` template**
4. **Replace the content** with the new ChopTime template
5. **Save the template**
6. **Test again** by placing a test order

## New Template Features

The new ChopTime template includes:
- ✅ **Professional design** with ChopTime branding
- ✅ **Complete customer information** section
- ✅ **Order items with images** and restaurant details
- ✅ **Detailed cost breakdown** (subtotal, shipping, tax, total)
- ✅ **Order date** and reference number
- ✅ **Next steps** information
- ✅ **Mobile-responsive** design

## Admin Email Notifications

The system now automatically sends order notifications to the admin email:
- ✅ **Every order** triggers an admin notification
- ✅ **Dedicated admin template** with action items
- ✅ **Real-time notifications** with order time
- ✅ **Complete order details** for admin review
- ✅ **Action checklist** for order processing

## Fallback Solution

If EmailJS continues to have issues, the app has a fallback email system that will still work for order confirmations. 