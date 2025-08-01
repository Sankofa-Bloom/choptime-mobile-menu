# Environment Variables Reference

This document provides a comprehensive reference for all environment variables used in the ChopTime application.

## 📧 EmailJS Configuration

### Core EmailJS Variables
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service ID from dashboard | `service_4beuwe5` | ✅ Yes |
| `VITE_EMAILJS_USER_ID` | EmailJS public key (User ID) | `lTTBvyuuFE8XG5fZl` | ✅ Yes |
| `VITE_EMAILJS_ORDER_TEMPLATE_ID` | Template ID for all order confirmations | `order_confirmation` | ✅ Yes |
| `VITE_EMAILJS_ADMIN_TEMPLATE_ID` | Template ID for admin notifications | `admin_notification` | ✅ Yes |

### EmailJS Advanced Settings
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_EMAILJS_FALLBACK_ENABLED` | Enable fallback email system | `true` | ❌ No |
| `VITE_EMAILJS_RETRY_ATTEMPTS` | Number of retry attempts for failed emails | `3` | ❌ No |

## 👨‍💼 Admin Configuration

### Admin Contact Information
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_ADMIN_EMAIL` | Admin email for order notifications and sender address | `admin@choptime.com` | ✅ Yes |
| `VITE_ADMIN_NAME` | Admin display name | `ChopTime Admin` | ❌ No |
| `VITE_ADMIN_PHONE` | Admin phone number | `+237670416449` | ❌ No |
| `VITE_ADMIN_WHATSAPP` | Admin WhatsApp number | `+237670416449` | ❌ No |

## 🏢 Company Configuration

### Company Information
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_COMPANY_NAME` | Company name | `ChopTime` | ❌ No |
| `VITE_COMPANY_WEBSITE` | Company website | `https://choptime.com` | ❌ No |
| `VITE_COMPANY_ADDRESS` | Company address | `Douala, Cameroon` | ❌ No |

## 🚚 Delivery Configuration

### Delivery Fees
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_DEFAULT_DELIVERY_FEE` | Standard delivery fee (FCFA) | `500` | ❌ No |
| `VITE_PREMIUM_DELIVERY_FEE` | Premium delivery fee (FCFA) | `1000` | ❌ No |

### Delivery Times
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_MIN_DELIVERY_TIME` | Minimum delivery time (minutes) | `15` | ❌ No |
| `VITE_MAX_DELIVERY_TIME` | Maximum delivery time (minutes) | `45` | ❌ No |

## 💳 Payment Configuration

### Mobile Money Numbers
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_MTN_MOMO_NUMBER` | MTN Mobile Money number | `+237670416449` | ❌ No |
| `VITE_ORANGE_MONEY_NUMBER` | Orange Money number | `+237670416449` | ❌ No |

### Payment Methods
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_ENABLE_CASH_PAYMENT` | Enable cash on delivery | `true` | ❌ No |
| `VITE_ENABLE_MTN_MOMO` | Enable MTN Mobile Money | `true` | ❌ No |
| `VITE_ENABLE_ORANGE_MONEY` | Enable Orange Money | `true` | ❌ No |
| `VITE_ENABLE_EMAIL_PAYMENT` | Enable email payment | `true` | ❌ No |

## 🎛️ Feature Flags

### Core Features
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_ENABLE_PWA` | Enable Progressive Web App | `true` | ❌ No |
| `VITE_ENABLE_EMAIL_NOTIFICATIONS` | Enable email notifications | `true` | ❌ No |
| `VITE_ENABLE_ADMIN_NOTIFICATIONS` | Enable admin notifications | `true` | ❌ No |
| `VITE_ENABLE_SMS_NOTIFICATIONS` | Enable SMS notifications | `false` | ❌ No |
| `VITE_ENABLE_ORDER_TRACKING` | Enable order tracking | `true` | ❌ No |
| `VITE_ENABLE_CUSTOM_ORDERS` | Enable custom orders | `true` | ❌ No |
| `VITE_ENABLE_ORDER_HISTORY` | Enable order history | `true` | ❌ No |

## 🔧 Development Configuration

### Development Settings
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_DEV_MODE` | Enable development mode | `false` | ❌ No |
| `VITE_ENABLE_DEBUG_LOGS` | Enable debug logging | `true` | ❌ No |

## 📱 Notifications

### Notification Settings
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_TOAST_DURATION` | Toast notification duration (ms) | `5000` | ❌ No |
| `VITE_ORDER_CONFIRMATION_TIMEOUT` | Order confirmation timeout (s) | `30` | ❌ No |
| `VITE_EMAIL_NOTIFICATION_DELAY` | Email notification delay (ms) | `2000` | ❌ No |
| `VITE_ADMIN_NOTIFICATION_DELAY` | Admin notification delay (ms) | `1000` | ❌ No |

## 🎨 Customization

### Brand Colors
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_PRIMARY_COLOR` | Primary brand color | `#FF6B35` | ❌ No |
| `VITE_SECONDARY_COLOR` | Secondary brand color | `#F7931E` | ❌ No |
| `VITE_ACCENT_COLOR` | Accent color | `#2C3E50` | ❌ No |

### Localization
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_CURRENCY` | Currency code | `FCFA` | ❌ No |
| `VITE_CURRENCY_SYMBOL` | Currency symbol | `₣` | ❌ No |
| `VITE_DEFAULT_LANGUAGE` | Default language | `en` | ❌ No |
| `VITE_SUPPORTED_LANGUAGES` | Supported languages | `en,fr` | ❌ No |

## 📊 Analytics & Monitoring

### Analytics
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_GA_TRACKING_ID` | Google Analytics tracking ID | `GA-XXXXXXXXX-X` | ❌ No |
| `VITE_SENTRY_DSN` | Sentry error reporting DSN | `https://...` | ❌ No |

## 🔒 Security

### Security Settings
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_RATE_LIMIT` | API rate limit per window | `100` | ❌ No |
| `VITE_API_RATE_LIMIT_WINDOW` | Rate limit window (ms) | `60000` | ❌ No |
| `VITE_SESSION_TIMEOUT` | Session timeout (minutes) | `30` | ❌ No |

## 🚀 Deployment

### Build Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_BUILD_MODE` | Build mode | `production` | ❌ No |
| `VITE_APP_VERSION` | Application version | `2.0.0` | ❌ No |
| `VITE_CDN_URL` | CDN URL for assets | `https://cdn.choptime.com` | ❌ No |
| `VITE_ASSET_URL` | Asset URL | `https://assets.choptime.com` | ❌ No |

## 📡 Integrations

### SMS Gateway (Optional)
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_SMS_API_URL` | SMS API endpoint | `https://api.sms.com` | ❌ No |
| `VITE_SMS_API_KEY` | SMS API key | `your_sms_api_key` | ❌ No |

## 🗄️ Database Configuration

### Supabase (Required)
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` | ✅ Yes |

## 📝 Usage Examples

### Basic Setup (Required Variables)
```env
# EmailJS (Required)
VITE_EMAILJS_SERVICE_ID=service_4beuwe5
VITE_EMAILJS_USER_ID=lTTBvyuuFE8XG5fZl
VITE_EMAILJS_ORDER_TEMPLATE_ID=order_confirmation
VITE_EMAILJS_ADMIN_TEMPLATE_ID=admin_notification

# Admin (Required)
VITE_ADMIN_EMAIL=admin@choptime.com

# Database (Required)
VITE_SUPABASE_URL=https://qrpukxmzdwkepfpuapzh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Complete Setup (All Variables)
```env
# Copy the entire .env file for complete configuration
# All variables are documented above
```

## 🔄 Environment File Setup

1. **Copy the template**: `cp .env .env.local`
2. **Edit variables**: Update values for your environment
3. **Restart server**: `npm run dev`
4. **Test configuration**: Use EmailTest component

## 🚨 Important Notes

- **Required variables** must be set for the app to function
- **Optional variables** have sensible defaults
- **Development variables** should be `false` in production
- **API keys** should be kept secure and not committed to version control
- **Test variables** should be enabled during development

 