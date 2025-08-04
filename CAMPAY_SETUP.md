# Campay Payment Gateway Setup Guide

## 🎯 **Campay API Integration Complete**

Your ChopTime app is now configured to use Campay as the default payment gateway. Here's how to set up your API keys:

## 📋 **Required API Keys**

From your Campay dashboard, you'll need these keys:

### 🔑 **Primary API Key (Required)**
- **Key Type**: `Permanent Access token`
- **Usage**: Main API authentication for payment processing
- **Environment Variable**: `VITE_CAMPAY_API_KEY`

### 🔐 **Webhook Key (Optional but Recommended)**
- **Key Type**: `App webhook key`
- **Usage**: Webhook signature verification for security
- **Environment Variable**: `VITE_CAMPAY_WEBHOOK_KEY`

## ⚙️ **Configuration Steps**

### 1. **Get Your API Keys**
1. Log into your [Campay Dashboard](https://campay.net)
2. Navigate to "API ACCESS KEYS" section
3. Copy the "Permanent Access token" (this is your main API key)
4. Copy the "App webhook key" (for webhook security)

### 2. **Configure Environment Variables**

#### **For Development (.env.local)**
```bash
# Campay API Configuration
VITE_CAMPAY_API_KEY=your_permanent_access_token_here
VITE_CAMPAY_TEST_MODE=true
VITE_CAMPAY_CALLBACK_URL=http://localhost:8080/api/payment-webhook
VITE_CAMPAY_RETURN_URL=http://localhost:8080/payment-success
VITE_CAMPAY_WEBHOOK_KEY=your_webhook_key_here
```

#### **For Production (Vercel/Netlify Environment Variables)**
```bash
VITE_CAMPAY_API_KEY=your_permanent_access_token_here
VITE_CAMPAY_TEST_MODE=false
VITE_CAMPAY_CALLBACK_URL=https://choptime.com/api/payment-webhook
VITE_CAMPAY_RETURN_URL=https://choptime.com/payment-success
VITE_CAMPAY_WEBHOOK_KEY=your_webhook_key_here
```

### 3. **Test Your Integration**
1. Set `VITE_CAMPAY_TEST_MODE=true` for testing
2. Make a test payment using the app
3. Verify payment status updates work correctly
4. Check webhook notifications (if configured)

### 4. **Go Live**
1. Set `VITE_CAMPAY_TEST_MODE=false` for production
2. Update callback URLs to your production domain
3. Configure webhook endpoints on your server
4. Test with real payments

## 🔧 **API Key Security**

### ✅ **Best Practices**
- **Never commit API keys** to version control
- **Use environment variables** for all sensitive data
- **Rotate keys regularly** for security
- **Use webhook signature verification** in production
- **Monitor API usage** in your Campay dashboard

### 🚨 **Security Notes**
- The `Permanent Access token` has full API access
- Keep your webhook key secret for signature verification
- Use test mode during development
- Monitor for unusual API activity

## 📱 **Supported Payment Methods**

Campay supports these payment methods:
- **MTN Mobile Money** (Cameroon)
- **Orange Money** (Cameroon)
- **Moov Money** (Cameroon)
- **Card Payment** (International)
- **Bank Transfer** (Local banks)

## 🔄 **Payment Flow**

1. **Customer selects payment method**
2. **Campay payment page opens**
3. **Customer completes payment**
4. **Webhook notification sent** (if configured)
5. **Payment status updated** in real-time
6. **Order confirmed** automatically

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **"API key not configured" error**
- Check that `VITE_CAMPAY_API_KEY` is set correctly
- Verify you're using the "Permanent Access token"
- Ensure no extra spaces in the environment variable

#### **Payment not initializing**
- Check network connectivity
- Verify API key permissions
- Check browser console for errors
- Ensure test mode is set correctly

#### **Webhook not working**
- Verify webhook URL is accessible
- Check webhook signature verification
- Ensure server can handle POST requests
- Monitor webhook delivery in Campay dashboard

### **Support Resources**
- [Campay Documentation](https://docs.campay.net)
- [Campay Dashboard](https://campay.net)
- [API Reference](https://docs.campay.net/api)

## 🎉 **Ready to Go!**

Your ChopTime app is now fully integrated with Campay payment gateway. The integration includes:

- ✅ **Real-time payment processing**
- ✅ **Multiple payment methods**
- ✅ **Secure API authentication**
- ✅ **Webhook support**
- ✅ **Error handling**
- ✅ **Mobile-optimized UI**
- ✅ **Production-ready configuration**

**Start accepting payments with Campay today!** 🚀 