# Contact Form Setup Guide

## Overview

The ChopTime contact form allows customers to send messages directly to the admin via EmailJS. This guide explains how to set up and configure the contact form.

## Features

- ✅ Contact form with validation
- ✅ Direct email to admin
- ✅ Professional email template
- ✅ Form validation and error handling
- ✅ Responsive design
- ✅ Easy navigation integration

## Files Created

1. **`src/pages/Contact.tsx`** - Main contact page component
2. **`EMAILJS_CONTACT_TEMPLATE.html`** - EmailJS template for contact messages
3. **`CONTACT_FORM_SETUP.md`** - This setup guide

## Files Modified

1. **`src/App.tsx`** - Added contact route
2. **`src/components/Header.tsx`** - Added contact navigation link
3. **`src/components/Footer.tsx`** - Added contact link

## EmailJS Template Setup

### 1. Create EmailJS Template

1. Go to your [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Navigate to **Email Templates**
3. Click **Create New Template**
4. Copy the content from `EMAILJS_CONTACT_TEMPLATE.html`
5. Save the template with ID: `contact_form`

### 2. Template Variables

The template uses these variables:
- `{{from_name}}` - Customer's name
- `{{from_email}}` - Customer's email
- `{{from_phone}}` - Customer's phone (optional)
- `{{subject}}` - Message subject
- `{{message}}` - Customer's message
- `{{company_name}}` - Company name (ChopTime)
- `{{admin_email}}` - Admin email address
- `{{admin_phone}}` - Admin phone number
- `{{company_address}}` - Company address
- `{{sent_date}}` - Date sent

## Environment Variables

Add these to your `.env` file:

```env
# Contact Form Configuration
VITE_EMAILJS_CONTACT_TEMPLATE_ID=contact_form
```

## Usage

### Accessing the Contact Page

1. **Via Header**: Click "Contact" button in the header
2. **Via Footer**: Click "Send us a message" link in footer
3. **Direct URL**: Navigate to `/contact`

### Form Fields

- **Full Name** (required)
- **Email Address** (required)
- **Phone Number** (optional)
- **Subject** (required)
- **Message** (required)

### Form Validation

- All required fields must be filled
- Email must be in valid format
- Form shows success/error messages
- Loading state during submission

## Email Flow

1. **Customer submits form**
2. **Form validation** checks all fields
3. **EmailJS sends email** to admin
4. **Success message** shown to customer
5. **Form resets** for new submission

## Customization

### Styling

The contact page uses Tailwind CSS classes and can be customized by modifying:
- Colors in `src/pages/Contact.tsx`
- Layout and spacing
- Form field styling

### Email Template

Customize the email template by editing:
- `EMAILJS_CONTACT_TEMPLATE.html`
- Template variables
- Email styling and branding

### Form Fields

Add or remove form fields by modifying:
- Form state in `Contact.tsx`
- Validation logic
- Email template variables

## Testing

### Test the Contact Form

1. **Fill out the form** with test data
2. **Submit the form** and check for success message
3. **Check admin email** for received message
4. **Verify email template** formatting

### Test Scenarios

- ✅ Valid form submission
- ✅ Missing required fields
- ✅ Invalid email format
- ✅ Long messages
- ✅ Special characters in message

## Troubleshooting

### Common Issues

1. **Email not received**
   - Check EmailJS configuration
   - Verify template ID is correct
   - Check spam folder

2. **Form validation errors**
   - Check browser console for errors
   - Verify all required fields are filled
   - Check email format

3. **Styling issues**
   - Check Tailwind CSS classes
   - Verify responsive design
   - Test on different screen sizes

### Debug Mode

Enable debug logging by checking browser console for:
- EmailJS configuration
- Form submission details
- Error messages

## Security Considerations

1. **Input Validation**: All form inputs are validated
2. **Email Sanitization**: Email addresses are validated
3. **Rate Limiting**: Consider implementing rate limiting
4. **Spam Protection**: EmailJS provides basic spam protection

## Future Enhancements

1. **File Uploads**: Add file attachment support
2. **Auto-Response**: Send confirmation email to customer
3. **Contact Categories**: Add dropdown for message types
4. **Chat Integration**: Add live chat option
5. **Analytics**: Track contact form usage

## Support

For issues with the contact form:
1. Check EmailJS dashboard for errors
2. Verify environment variables
3. Test email template separately
4. Check browser console for errors

## Conclusion

The contact form provides a professional way for customers to reach the admin team. The EmailJS integration ensures reliable email delivery with a beautiful, branded template. 