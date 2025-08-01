# Generic EmailJS Template Setup Guide

## Overview

The generic EmailJS template is a single, flexible template that can handle multiple email types including contact forms, order confirmations, admin notifications, payment confirmations, and custom messages. This eliminates the need to create and manage multiple EmailJS templates.

## Features

- ✅ **Single Template**: One template for all email types
- ✅ **Dynamic Content**: Content changes based on email type
- ✅ **Professional Design**: Consistent branding across all emails
- ✅ **Multiple Email Types**: Contact, order confirmation, admin notification, payment confirmation, custom
- ✅ **Action Buttons**: Support for clickable buttons in emails
- ✅ **Responsive Design**: Works on all devices
- ✅ **Type Safety**: Full TypeScript support

## Email Types Supported

### 1. **Contact Form** (`contact`)
- Customer contact form submissions
- Sends to admin with customer details
- Includes urgent response reminder

### 2. **Order Confirmation** (`order_confirmation`)
- Order confirmation to customers
- Includes order details, items, and delivery info
- Professional order summary

### 3. **Admin Notification** (`admin_notification`)
- New order notifications to admin
- Includes customer and order information
- Urgent processing reminder

### 4. **Payment Confirmation** (`payment_confirmation`)
- Payment success notifications
- Includes payment and order details
- Confirmation of successful payment

### 5. **Custom** (`custom`)
- Custom messages with flexible content
- Support for urgent, success, and warning messages
- Fully customizable titles and content

## Setup Instructions

### 1. Create EmailJS Template

1. Go to your [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Navigate to **Email Templates**
3. Click **Create New Template**
4. Copy the content from `EMAILJS_GENERIC_TEMPLATE.html`
5. Save the template with ID: `generic_template`

### 2. Environment Variables

Add this to your `.env` file:

```env
# Generic Email Template
VITE_EMAILJS_GENERIC_TEMPLATE_ID=generic_template
```

### 3. Template Variables

The template uses these dynamic variables:

#### Base Variables (all email types)
- `{{email_type}}` - Type of email (contact, order_confirmation, etc.)
- `{{email_title}}` - Email subject/title
- `{{email_subtitle}}` - Email subtitle
- `{{company_name}}` - Company name (ChopTime)
- `{{company_address}}` - Company address
- `{{admin_email}}` - Admin email address
- `{{admin_phone}}` - Admin phone number
- `{{sent_date}}` - Date sent
- `{{email_id}}` - Unique email identifier

#### Contact Form Variables
- `{{from_name}}` - Customer's name
- `{{from_email}}` - Customer's email
- `{{from_phone}}` - Customer's phone (optional)
- `{{subject}}` - Message subject
- `{{message}}` - Customer's message

#### Order Confirmation Variables
- `{{order_reference}}` - Order reference number
- `{{restaurant_name}}` - Restaurant name
- `{{order_date}}` - Order date
- `{{estimated_delivery}}` - Estimated delivery time
- `{{order_items}}` - Array of order items
- `{{order_total}}` - Total order amount
- `{{delivery_address}}` - Delivery address
- `{{customer_phone}}` - Customer phone
- `{{payment_method}}` - Payment method

#### Admin Notification Variables
- `{{order_reference}}` - Order reference
- `{{customer_name}}` - Customer name
- `{{customer_email}}` - Customer email
- `{{customer_phone}}` - Customer phone
- `{{order_total}}` - Order total

#### Payment Confirmation Variables
- `{{payment_reference}}` - Payment reference
- `{{payment_amount}}` - Payment amount
- `{{payment_method}}` - Payment method
- `{{payment_date}}` - Payment date
- `{{order_reference}}` - Order reference
- `{{restaurant_name}}` - Restaurant name
- `{{estimated_delivery}}` - Estimated delivery

#### Custom Email Variables
- `{{custom_title}}` - Custom title
- `{{custom_message}}` - Custom message
- `{{custom_urgent}}` - Urgent message (optional)
- `{{custom_success}}` - Success message (optional)
- `{{custom_warning}}` - Warning message (optional)

#### Action Buttons
- `{{action_buttons}}` - Array of action buttons with `text` and `url`

## Usage Examples

### Contact Form Email

```typescript
import { sendContactEmail } from '@/utils/genericEmailService';

const success = await sendContactEmail({
  from_name: 'John Doe',
  from_email: 'john@example.com',
  from_phone: '+237612345678',
  subject: 'General Inquiry',
  message: 'I have a question about your services.'
});
```

### Order Confirmation Email

```typescript
import { sendOrderConfirmation } from '@/utils/genericEmailService';

const success = await sendOrderConfirmation({
  order_reference: 'CHT-123456789',
  restaurant_name: 'ChopTime Restaurant',
  order_date: '2024-01-15 14:30',
  estimated_delivery: '15-30 minutes',
  order_items: [
    { name: 'Eru Soup', quantity: 2, price: '₣1500' },
    { name: 'Achu', quantity: 1, price: '₣800' }
  ],
  order_total: '₣3800',
  delivery_address: '123 Main St, Limbe',
  customer_phone: '+237612345678',
  payment_method: 'MTN MoMo'
});
```

### Admin Notification Email

```typescript
import { sendAdminNotification } from '@/utils/genericEmailService';

const success = await sendAdminNotification({
  order_reference: 'CHT-123456789',
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '+237612345678',
  order_total: '₣3800'
});
```

### Payment Confirmation Email

```typescript
import { sendPaymentConfirmation } from '@/utils/genericEmailService';

const success = await sendPaymentConfirmation({
  payment_reference: 'PAY-987654321',
  payment_amount: '₣3800',
  payment_method: 'MTN MoMo',
  payment_date: '2024-01-15 14:35',
  order_reference: 'CHT-123456789',
  restaurant_name: 'ChopTime Restaurant',
  estimated_delivery: '15-30 minutes'
});
```

### Custom Email

```typescript
import { sendCustomEmail } from '@/utils/genericEmailService';

const success = await sendCustomEmail({
  custom_title: 'Special Offer',
  custom_message: 'Get 20% off your next order!',
  custom_success: '🎉 Limited time offer available!'
});
```

### Email with Action Buttons

```typescript
import { sendEmailWithActions } from '@/utils/genericEmailService';

const success = await sendEmailWithActions(
  {
    email_type: 'custom',
    custom_title: 'Welcome to ChopTime',
    custom_message: 'Thank you for joining us!'
  },
  [
    { text: 'View Menu', url: 'https://choptime.com/menu' },
    { text: 'Place Order', url: 'https://choptime.com/order' }
  ]
);
```

## Migration from Multiple Templates

### Before (Multiple Templates)
```typescript
// Contact form
await sendEmailViaEmailJS(contactParams, { templateId: 'contact_template' });

// Order confirmation
await sendEmailViaEmailJS(orderParams, { templateId: 'order_template' });

// Admin notification
await sendEmailViaEmailJS(adminParams, { templateId: 'admin_template' });
```

### After (Single Generic Template)
```typescript
// Contact form
await sendContactEmail(contactParams);

// Order confirmation
await sendOrderConfirmation(orderParams);

// Admin notification
await sendAdminNotification(adminParams);
```

## Benefits

### 1. **Simplified Management**
- One template to maintain
- Consistent branding across all emails
- Easier updates and modifications

### 2. **Type Safety**
- Full TypeScript support
- Compile-time error checking
- IntelliSense support

### 3. **Flexibility**
- Easy to add new email types
- Custom content support
- Action button support

### 4. **Consistency**
- Uniform design across all emails
- Standardized contact information
- Professional appearance

## Testing

### Test the Template

```typescript
import { testEmailTemplate } from '@/utils/genericEmailService';

const success = await testEmailTemplate();
if (success) {
  console.log('✅ Generic template is working correctly');
} else {
  console.log('❌ Template test failed');
}
```

### Test Different Email Types

```typescript
// Test contact email
await sendContactEmail({
  from_name: 'Test User',
  from_email: 'test@example.com',
  subject: 'Test Message',
  message: 'This is a test message.'
});

// Test custom email
await sendCustomEmail({
  custom_title: 'Test Email',
  custom_message: 'This is a test of the generic template.',
  custom_success: 'Test successful!'
});
```

## Troubleshooting

### Common Issues

1. **Template Not Found**
   - Verify template ID in EmailJS dashboard
   - Check environment variable `VITE_EMAILJS_GENERIC_TEMPLATE_ID`

2. **Missing Variables**
   - Check console for missing variable errors
   - Ensure all required variables are provided

3. **Styling Issues**
   - Test email in different email clients
   - Check CSS compatibility

### Debug Mode

Enable debug logging by checking browser console for:
- Email parameters being sent
- Template ID and service configuration
- Success/failure responses

## Conclusion

The generic EmailJS template provides a powerful, flexible solution for all email needs in the ChopTime application. It eliminates the complexity of managing multiple templates while providing a consistent, professional appearance across all communications. 