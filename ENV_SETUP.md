# Environment Variables Setup Guide

## Quick Setup

### 1. EmailJS Configuration (Required for Email Notifications)

**Option A: Use the Setup Script (Recommended)**
```bash
node setup-emailjs.js
```

**Option B: Manual Configuration**
1. Go to [EmailJS.com](https://www.emailjs.com/) and create an account
2. Add Gmail service for `choptime237@gmail.com`
3. Create email templates (see `EMAILJS_SETUP.md`)
4. Update these variables in your `.env` file:

```bash
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_USER_ID=your_public_key_here
VITE_EMAILJS_ORDER_TEMPLATE_ID=order_confirmation
VITE_EMAILJS_CUSTOM_TEMPLATE_ID=custom_order
```

### 2. Test Email System

1. Start development server:
   ```bash
   npm run dev
   ```

2. Scroll to the bottom of the page to find the "Email Test" component

3. Enter your email address and click "Send Test Email"

4. Check your inbox for the test email

## Environment Variables Overview

### Required Variables
- `VITE_EMAILJS_SERVICE_ID` - Your EmailJS service ID
- `VITE_EMAILJS_USER_ID` - Your EmailJS public key
- `VITE_EMAILJS_ORDER_TEMPLATE_ID` - Order confirmation template ID
- `VITE_EMAILJS_CUSTOM_TEMPLATE_ID` - Custom order template ID

### Optional Variables
- `VITE_ADMIN_EMAIL` - Admin email for notifications (default: choptime237@gmail.com)
- `VITE_ADMIN_PHONE` - Admin phone number (default: +237670416449)
- `VITE_DEFAULT_DELIVERY_FEE` - Default delivery fee in FCFA (default: 500)
- `VITE_ENABLE_DEBUG_LOGS` - Enable debug logging (default: true)

## Troubleshooting

### EmailJS Issues
1. **"Service not found"** - Check your Service ID
2. **"Template not found"** - Check your Template IDs
3. **"User ID not found"** - Check your Public Key
4. **Emails not sending** - Check browser console for errors

### Environment Variables Not Loading
1. Restart your development server after changing `.env`
2. Check that variables start with `VITE_`
3. Verify no spaces around `=` in `.env` file

### Debug Steps
1. Check browser console for environment variable values
2. Test with actual orders to verify configuration
3. Check EmailJS dashboard for service status

## Support

- EmailJS Documentation: https://www.emailjs.com/docs/
- ChopTime Support: choptime237@gmail.com
- Detailed EmailJS Setup: See `EMAILJS_SETUP.md` 