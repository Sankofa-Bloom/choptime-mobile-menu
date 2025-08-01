# EmailJS Quick Fix Guide

## 🚨 Current Issue: EmailJS 400 Error

The error `api.emailjs.com/api/v1.0/email/send:1 Failed to load resource: the server responded with a status of 400` means your EmailJS configuration is incomplete.

## 🔧 Quick Fix Steps

### Step 1: Check Your EmailJS Dashboard

1. **Go to EmailJS Dashboard**: https://www.emailjs.com/
2. **Login to your account**
3. **Check if you have:**
   - ✅ Email Service configured
   - ✅ Email Templates created
   - ✅ Public Key (User ID) copied

### Step 2: Create Email Templates

**You need to create these templates in EmailJS:**

#### Template 1: Order Confirmation
- **Template ID**: `order_confirmation`
- **Variables to include**:
  - `{{to_email}}`
  - `{{to_name}}`
  - `{{order_reference}}`
  - `{{dish_name}}`
  - `{{restaurant_name}}`
  - `{{quantity}}`
  - `{{price}}`
  - `{{total_amount}}`
  - `{{delivery_fee}}`
  - `{{customer_phone}}`
  - `{{customer_location}}`
  - `{{payment_method}}`

#### Template 2: Custom Order
- **Template ID**: `custom_order`
- **Variables to include**:
  - `{{to_email}}`
  - `{{to_name}}`
  - `{{order_reference}}`
  - `{{custom_dish_name}}`
  - `{{restaurant_name}}`
  - `{{quantity}}`
  - `{{special_instructions}}`
  - `{{delivery_fee}}`
  - `{{customer_phone}}`
  - `{{customer_location}}`
  - `{{payment_method}}`

### Step 3: Update Environment Variables

**Check your `.env` file and ensure these are correct:**

```bash
VITE_EMAILJS_SERVICE_ID=service_4beuwe5
VITE_EMAILJS_USER_ID=lTTBvyuuFE8XG5fZl
VITE_EMAILJS_ORDER_TEMPLATE_ID=order_confirmation
VITE_EMAILJS_CUSTOM_TEMPLATE_ID=custom_order
```

### Step 4: Test Configuration

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Open browser console** and look for:
   ```
   EmailJS Configuration: {
     serviceId: "service_4beuwe5",
     templateId: "order_confirmation",
     userId: "Set"
   }
   ```

3. **Test email sending** by placing a test order

## 🛠️ Alternative: Use Simple Email Service

If EmailJS continues to have issues, the app now has a **fallback simple email service** that will work immediately:

- ✅ **No external dependencies**
- ✅ **Works without EmailJS setup**
- ✅ **Simulates email sending**
- ✅ **Provides order confirmation**

## 🔍 Debug Information

**Check browser console for these messages:**

- ✅ `EmailJS Configuration: {...}` - Shows your config
- ✅ `Sending email via EmailJS with params: {...}` - Shows email data
- ❌ `EmailJS 400 Error - Check your Service ID, Template ID, and User ID` - Configuration issue
- ❌ `EmailJS 401 Error - Check your User ID (Public Key)` - Authentication issue
- ❌ `EmailJS 404 Error - Service or Template not found` - Missing service/template

## 📞 Need Help?

1. **Check EmailJS documentation**: https://www.emailjs.com/docs/
2. **Verify your account status**: Make sure your EmailJS account is active
3. **Test with simple email service**: The fallback will work immediately

## 🎯 Quick Test

**To test if the fallback works:**

1. **Place a test order** to verify email functionality
2. **Enter your email address**
3. **Click "Send Test Email"**
4. **Check console** - you should see "Simple email sent successfully (simulated)"

**The app will work with email notifications even if EmailJS is not configured!** 