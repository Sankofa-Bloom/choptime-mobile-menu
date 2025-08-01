# Fapshi API Credentials Setup

## Overview
The Fapshi payment integration requires both an **API User** and an **API Key** from your Fapshi dashboard.

## Required Environment Variables

Add these variables to your `.env` file:

```env
# Fapshi API Credentials
VITE_FAPSHI_API_USER=your_api_user_here
VITE_FAPSHI_API_KEY=your_api_key_here
VITE_FAPSHI_TEST_MODE=true
```

## How to Get Your Credentials

1. **Login to Fapshi Dashboard**
   - Go to your Fapshi merchant dashboard
   - Navigate to the API section

2. **Find Your Credentials**
   - Look for "API User" field
   - Look for "API Key" field
   - Copy both values

3. **Environment Setup**
   - Create or update your `.env` file
   - Add both `VITE_FAPSHI_API_USER` and `VITE_FAPSHI_API_KEY`
   - Set `VITE_FAPSHI_TEST_MODE=true` for testing

## Important Notes

- **Both credentials are required**: The API will not work with just one credential
- **Test Mode**: Use `VITE_FAPSHI_TEST_MODE=true` for sandbox testing
- **Live Mode**: Use `VITE_FAPSHI_TEST_MODE=false` for production
- **Security**: Never commit your `.env` file to version control

## Verification

After setting up the credentials, you should see in the browser console:
```
FapshiService initialized: {
  hasApiKey: true,
  hasApiUser: true,
  baseUrl: "https://sandbox.fapshi.com",
  isTestMode: true
}
```

## Troubleshooting

If you see warnings about missing credentials:
1. Check that both environment variables are set
2. Restart your development server after updating `.env`
3. Verify the credentials in your Fapshi dashboard
4. Ensure there are no extra spaces in the environment variables 