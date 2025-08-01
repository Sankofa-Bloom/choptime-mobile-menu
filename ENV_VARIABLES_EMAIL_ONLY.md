# Environment Variables - Email-Only Payment System

## Overview

This document describes the environment variables for ChopTime's email-only ordering system. All payment processing has been removed, and the system now operates purely through email notifications.

## Key Changes

### ✅ **Enabled Features**
- Email-only ordering system
- Customer email notifications
- Admin (restaurant) email notifications
- Order tracking and history
- Custom orders support

### ❌ **Disabled Features**
- Online payment processing
- Cash payment options
- Mobile money integration
- Payment gateway integrations
- Automatic payment confirmation

## Environment Variables Reference

### Core Configuration

```env
# System Mode
VITE_EMAIL_ONLY_MODE=true
VITE_PAYMENT_METHOD=email
VITE_REQUIRE_CUSTOMER_EMAIL=true
```

### Email Configuration

```env
# EmailJS Service
VITE_EMAILJS_SERVICE_ID=service_4beuwe5
VITE_EMAILJS_USER_ID=lTTBvyuuFE8XG5fZl

# Email Templates
VITE_EMAILJS_ORDER_TEMPLATE_ID=order_confirmation
VITE_EMAILJS_ADMIN_TEMPLATE_ID=admin_notification
VITE_CUSTOMER_EMAIL_TEMPLATE=order_confirmation
VITE_ADMIN_EMAIL_TEMPLATE=admin_notification
VITE_CUSTOM_ORDER_ADMIN_TEMPLATE=custom_order_admin
```

### Admin Configuration

```env
# Admin Contact
VITE_ADMIN_EMAIL=choptime237@gmail.com
VITE_ADMIN_NAME=ChopTime Admin
VITE_ADMIN_PHONE=+237670416449
VITE_ADMIN_WHATSAPP=+237670416449
```

### Payment System (Disabled)

```env
# Payment Methods (All Disabled)
VITE_ENABLE_CASH_PAYMENT=false
VITE_ENABLE_MTN_MOMO=false
VITE_ENABLE_ORANGE_MONEY=false
VITE_ENABLE_ONLINE_PAYMENT=false
VITE_ENABLE_PAYMENT_PROCESSING=false
VITE_ENABLE_PAYMENT_GATEWAYS=false

# Payment Features (Disabled)
VITE_ENABLE_ONLINE_PAYMENTS=false
```

### Order Processing

```env
# Order Settings
VITE_AUTO_CONFIRM_ORDERS=false
VITE_RESTAURANT_CONFIRMATION_REQUIRED=true
VITE_PAYMENT_ARRANGEMENT_MODE=manual
VITE_SEND_ADMIN_NOTIFICATIONS=true
```

### Notifications

```env
# Email Notifications
VITE_ENABLE_EMAIL_NOTIFICATIONS=true
VITE_ENABLE_ADMIN_NOTIFICATIONS=true
VITE_EMAIL_NOTIFICATION_DELAY=2000
VITE_ADMIN_NOTIFICATION_DELAY=1000

# Other Notifications
VITE_ENABLE_SMS_NOTIFICATIONS=false
```

## Payment Gateway Variables (Commented Out)

The following variables are preserved but commented out for future reference:

```env
# Fapshi Payment Gateway (Disabled)
# VITE_FAPSHI_API_KEY=your_fapshi_api_key_here
# VITE_FAPSHI_TEST_MODE=true
# VITE_FAPSHI_CALLBACK_URL=https://yourdomain.com/api/payment-webhook
# VITE_FAPSHI_RETURN_URL=https://yourdomain.com/payment-success

# Mobile Money Numbers (Not Used)
# VITE_MTN_MOMO_NUMBER=+237670416449
# VITE_ORANGE_MONEY_NUMBER=+237670416449
```

## Feature Flags

### Enabled Features
```env
VITE_ENABLE_PWA=true
VITE_ENABLE_EMAIL_NOTIFICATIONS=true
VITE_ENABLE_ADMIN_NOTIFICATIONS=true
VITE_ENABLE_ORDER_TRACKING=true
VITE_ENABLE_CUSTOM_ORDERS=true
VITE_ENABLE_ORDER_HISTORY=true
```

### Disabled Features
```env
VITE_ENABLE_SMS_NOTIFICATIONS=false
VITE_ENABLE_ONLINE_PAYMENTS=false
VITE_ENABLE_PAYMENT_PROCESSING=false
VITE_ENABLE_PAYMENT_GATEWAYS=false
```

## Development Configuration

```env
# Development Settings
VITE_DEV_MODE=false
VITE_ENABLE_DEBUG_LOGS=true
VITE_BUILD_MODE=production
VITE_APP_VERSION=2.0.0
```

## Security Configuration

```env
# API Security
VITE_API_RATE_LIMIT=100
VITE_API_RATE_LIMIT_WINDOW=60000
VITE_SESSION_TIMEOUT=30
```

## Customization

```env
# Brand Colors
VITE_PRIMARY_COLOR=#FF6B35
VITE_SECONDARY_COLOR=#F7931E
VITE_ACCENT_COLOR=#2C3E50

# Currency
VITE_CURRENCY=XAF
VITE_CURRENCY_SYMBOL=₣

# Language
VITE_DEFAULT_LANGUAGE=en
VITE_SUPPORTED_LANGUAGES=en,fr
```

## Order Flow Configuration

### Current Flow
1. Customer places order → Email required
2. System saves order → Database
3. Customer email sent → Order confirmation
4. Admin email sent → Restaurant notification
5. Restaurant contacts customer → Manual payment arrangement
6. Order fulfilled → Payment handled directly

### Configuration Variables
```env
# Flow Control
VITE_EMAIL_ONLY_MODE=true
VITE_REQUIRE_CUSTOMER_EMAIL=true
VITE_SEND_ADMIN_NOTIFICATIONS=true
VITE_AUTO_CONFIRM_ORDERS=false
VITE_RESTAURANT_CONFIRMATION_REQUIRED=true
```

## Migration Notes

### From Payment System
- All payment-related variables are disabled
- Payment gateway configurations are commented out
- Mobile money numbers are preserved but not used
- Order flow simplified to email-only

### To Future Payment System
- Payment variables can be easily re-enabled
- Gateway configurations are preserved
- Database schema supports payment tracking
- Email notifications can be enhanced

## Testing Configuration

### Test Environment
```env
# Test Settings
VITE_DEV_MODE=true
VITE_ENABLE_DEBUG_LOGS=true
VITE_TEST_MODE=true

# Test Email Addresses
VITE_TEST_CUSTOMER_EMAIL=test@example.com
VITE_TEST_ADMIN_EMAIL=admin@example.com
```

### Production Environment
```env
# Production Settings
VITE_DEV_MODE=false
VITE_ENABLE_DEBUG_LOGS=false
VITE_BUILD_MODE=production
```

## Monitoring Variables

```env
# Analytics
VITE_GA_TRACKING_ID=your_ga_tracking_id_here

# Error Reporting
VITE_SENTRY_DSN=your_sentry_dsn_here

# Notifications
VITE_TOAST_DURATION=5000
VITE_ORDER_CONFIRMATION_TIMEOUT=30
```

## Best Practices

1. **Security**: Never commit API keys to version control
2. **Backup**: Keep a backup of production environment variables
3. **Documentation**: Update this document when adding new variables
4. **Testing**: Test all email notifications in development
5. **Monitoring**: Monitor email delivery success rates

## Troubleshooting

### Common Issues
1. **Email Not Sending**: Check EmailJS configuration
2. **Admin Not Notified**: Verify `VITE_ADMIN_EMAIL` is correct
3. **Order Not Saved**: Check Supabase configuration
4. **Template Errors**: Verify EmailJS template IDs

### Debug Mode
```env
VITE_ENABLE_DEBUG_LOGS=true
VITE_DEV_MODE=true
```

This will log all email operations and API calls for debugging. 