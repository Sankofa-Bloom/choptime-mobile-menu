# Admin Email Setup Guide

## Problem
You're using the same email address (`choptime237@gmail.com`) for both your EmailJS account and as the admin email for receiving order notifications. This can cause conflicts.

## Solution
Use a different email address for admin notifications than your EmailJS account email.

## Step 1: Choose Admin Email Address

### Option A: Use a Different Gmail Address
```env
VITE_ADMIN_EMAIL=choptime.admin@gmail.com
```

### Option B: Use a Business Email
```env
VITE_ADMIN_EMAIL=admin@choptime.com
```

### Option C: Use Your Personal Email
```env
VITE_ADMIN_EMAIL=your.personal.email@gmail.com
```

## Step 2: Update Environment Variables

1. **Edit your `.env` file**:
   ```env
   # Change this line
   VITE_ADMIN_EMAIL=admin@choptime.com
   ```

2. **Restart your development server**:
   ```bash
   npm run dev
   ```

## Step 3: Test Admin Email Notifications

1. **Go to your application**: `http://localhost:8084/`
2. **Place a test order** (regular or custom)
3. **Check the new admin email inbox** for the notification

## Step 4: EmailJS Account vs Admin Email

### EmailJS Account Email
- **Purpose**: Used to log into EmailJS dashboard
- **Current**: `choptime237@gmail.com`
- **Function**: Account management, billing, service configuration

### Admin Notification Email
- **Purpose**: Receives order notifications
- **New**: `admin@choptime.com` (or your chosen email)
- **Function**: Receives order confirmations and admin notifications

## Step 5: EmailJS Template Configuration

### Customer Template (`order_confirmation`)
- **Sends to**: Customer's email address
- **From**: Your EmailJS service
- **Template**: Uses customer-friendly design

### Admin Template (`admin_notification`)
- **Sends to**: Admin email address (`admin@choptime.com`)
- **From**: Your EmailJS service
- **Template**: Uses admin-focused design with action items

## Step 6: Verify Setup

### Test Both Email Types:
1. **Customer Email**: Should go to customer's email
2. **Admin Email**: Should go to admin email (different from EmailJS account)

### Check EmailJS Dashboard:
1. **Go to EmailJS Dashboard**: https://www.emailjs.com/
2. **Check Email Templates**: Verify both templates exist
3. **Test Templates**: Use EmailJS test feature
4. **Check Email Logs**: Verify emails are being sent

## Common Issues and Solutions

### Issue 1: Admin emails not received
**Solution**: 
- Check spam folder
- Verify admin email address is correct
- Test with a different email address

### Issue 2: EmailJS account conflicts
**Solution**:
- Use different email for admin notifications
- Keep EmailJS account email separate from admin email

### Issue 3: Template not found errors
**Solution**:
- Verify template IDs in environment variables
- Check EmailJS dashboard for correct template names

## Recommended Setup

### For Production:
```env
# EmailJS Account (for dashboard access)
# Use: choptime237@gmail.com (your existing account)

# Admin Notifications (for receiving orders)
VITE_ADMIN_EMAIL=admin@choptime.com

# Customer Support (optional)
VITE_SUPPORT_EMAIL=support@choptime.com
```

### For Development:
```env
# Use your personal email for testing
VITE_ADMIN_EMAIL=your.personal.email@gmail.com
```

## Testing Checklist

- [ ] Admin email is different from EmailJS account email
- [ ] Customer emails are sent to customer address
- [ ] Admin emails are sent to admin address
- [ ] Both email templates work correctly
- [ ] No EmailJS conflicts or errors
- [ ] Emails are received in correct inboxes
- [ ] Test with actual orders (regular and custom)

## Next Steps

1. **Choose your admin email address**
2. **Update the `.env` file**
3. **Restart the development server**
4. **Test with actual orders**
5. **Verify both customer and admin emails work** 