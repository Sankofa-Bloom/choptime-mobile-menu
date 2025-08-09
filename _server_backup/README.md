# Campay API Server

This is a server-side API for handling Campay payment integration securely. It keeps sensitive API keys and credentials on the server side, preventing them from being exposed to the client.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the server directory with:
   ```env
   CAMPAY_API_KEY=your_campay_api_key_here
   CAMPAY_BASE_URL=https://api.campay.net
   CAMPAY_WEBHOOK_KEY=your_webhook_key_here
   PORT=3001
   CORS_ORIGIN=http://localhost:8081
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### POST /api/campay/initialize
Initialize a new Campay payment.

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "XAF",
  "reference": "ORDER-123",
  "description": "Order description",
  "customer": {
    "name": "John Doe",
    "phone": "237612345678",
    "email": "john@example.com"
  },
  "callback_url": "https://yourdomain.com/webhook",
  "return_url": "https://yourdomain.com/success"
}
```

### GET /api/campay/status/:reference
Check payment status for a given reference.

## Security Features

- ✅ API keys stored server-side only
- ✅ CORS protection
- ✅ Environment variable protection
- ✅ No sensitive data exposed to client

## Development

The server runs on port 3001 by default. Make sure your frontend is configured to connect to `http://localhost:3001`. 