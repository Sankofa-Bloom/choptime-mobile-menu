interface FapshiPaymentRequest {
  amount: number;
  currency: string;
  reference: string;
  description: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  callback_url: string;
  return_url: string;
}

// Fapshi API specific request format
interface FapshiAPIRequest {
  amount: number;
  email?: string;
  redirectUrl: string;
  userId?: string;
  externalId: string;
  message: string;
  currency?: string;
  phone?: string;
}

interface FapshiPaymentResponse {
  success: boolean;
  data?: {
    payment_url: string;
    reference: string;
    status: string;
  };
  error?: string;
}

interface FapshiPaymentStatus {
  success: boolean;
  data?: {
    reference: string;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    amount: number;
    currency: string;
    customer: {
      name: string;
      phone: string;
      email?: string;
    };
    created_at: string;
    updated_at: string;
  };
  error?: string;
}

class FapshiService {
  private apiKey: string;
  private apiUser: string;
  private baseUrl: string;
  private isTestMode: boolean;

  constructor() {
    this.apiKey = import.meta.env.VITE_FAPSHI_API_KEY || '';
    this.apiUser = import.meta.env.VITE_FAPSHI_API_USER || '';
    this.isTestMode = import.meta.env.VITE_FAPSHI_TEST_MODE === 'true';
    
    // Use correct base URLs based on test mode
    if (this.isTestMode) {
      this.baseUrl = 'https://sandbox.fapshi.com';
    } else {
      this.baseUrl = 'https://api.fapshi.com';
    }
    

  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    

    
    // Fapshi uses specific header format
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API credentials if available
    if (this.apiUser && this.apiKey) {
      // Use Fapshi's specific header format
      headers['apiuser'] = this.apiUser;
      headers['apikey'] = this.apiKey;
    } else {
      console.warn('Fapshi API credentials not fully configured. Please set VITE_FAPSHI_API_USER and VITE_FAPSHI_API_KEY');
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method === 'POST') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Handle non-JSON responses (like HTML error pages)
        const textResponse = await response.text();
        console.error('Fapshi API returned non-JSON response:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          response: textResponse.substring(0, 500) + '...',
          url: url,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.status === 404) {
          throw new Error(`API endpoint not found: ${url}. Please check the API documentation.`);
        } else if (response.status === 401) {
          throw new Error('Invalid API credentials. Please check your Fapshi API configuration.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your API permissions.');
        } else if (response.status === 500) {
          throw new Error('Internal server error. Please try again later.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Fapshi API Error:', error);
      throw error;
    }
  }





  async initializePayment(paymentData: FapshiPaymentRequest): Promise<FapshiPaymentResponse> {
    try {
      // Check if API credentials are configured
      if (!this.apiUser || this.apiUser === '') {
        console.warn('Fapshi API user not configured. Please set VITE_FAPSHI_API_USER');
        return {
          success: false,
          error: 'Payment service not configured. Please contact support.'
        };
      }
      if (!this.apiKey || this.apiKey === '') {
        console.warn('Fapshi API key not configured. Please set VITE_FAPSHI_API_KEY');
        return {
          success: false,
          error: 'Payment service not configured. Please contact support.'
        };
      }
      

      
      // Convert to Fapshi API format
      const fapshiRequest = {
        amount: paymentData.amount,
        email: paymentData.customer.email,
        redirectUrl: paymentData.return_url,
        userId: paymentData.customer.phone, // Use phone as userId
        externalId: paymentData.reference,
        message: paymentData.description,
        currency: paymentData.currency,
        phone: paymentData.customer.phone,
        callbackUrl: paymentData.callback_url
      };
      
      // Use the correct endpoint from Fapshi documentation
      const endpoint = '/initiate-pay';
      const response = await this.makeRequest(endpoint, 'POST', fapshiRequest);
      
      return {
        success: true,
        data: {
          payment_url: response.link || response.paymentUrl || response.url,
          reference: response.transId || response.reference || response.externalId,
          status: 'pending'
        }
      };
    } catch (error) {
      console.error('Fapshi API failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize payment'
      };
    }
  }

  async checkPaymentStatus(reference: string): Promise<FapshiPaymentStatus> {
    try {
      // Use the correct endpoint from Fapshi documentation
      const endpoint = `/payment-status/${reference}`;
      const response = await this.makeRequest(endpoint);
      
      return {
        success: true,
        data: {
          reference: response.transId || response.reference || reference,
          status: response.status,
          amount: response.amount,
          currency: response.currency || 'XAF',
          customer: response.customer,
          created_at: response.dateInitiated || response.created_at,
          updated_at: response.dateInitiated || response.updated_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check payment status'
      };
    }
  }

  async createPaymentLink(paymentData: Omit<FapshiPaymentRequest, 'callback_url' | 'return_url'>): Promise<FapshiPaymentResponse> {
    try {
      const response = await this.makeRequest('/payments/links', 'POST', paymentData);
      
      return {
        success: true,
        data: {
          payment_url: response.data.payment_url,
          reference: response.data.reference,
          status: response.data.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment link'
      };
    }
  }

  // Verify webhook signature (for server-side webhook processing)
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // This would typically use HMAC-SHA256 to verify the webhook signature
    // For now, we'll return true as a placeholder
    // In production, implement proper signature verification
    return true;
  }

  // Get supported payment methods
  getSupportedPaymentMethods(): string[] {
    return ['MTN MoMo', 'Orange Money'];
  }

  // Format phone number for Cameroon
  formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 237, return as is
    if (cleaned.startsWith('237')) {
      return cleaned;
    }
    
    // If it starts with 6 or 7 (Cameroon mobile), add 237 prefix
    if (cleaned.startsWith('6') || cleaned.startsWith('7')) {
      return `237${cleaned}`;
    }
    
    // If it's 9 digits and starts with 6 or 7, add 237 prefix
    if (cleaned.length === 9 && (cleaned.startsWith('6') || cleaned.startsWith('7'))) {
      return `237${cleaned}`;
    }
    
    return cleaned;
  }
}

// Create and export a singleton instance
export const fapshiService = new FapshiService();

// Export types for use in other components
export type {
  FapshiPaymentRequest,
  FapshiPaymentResponse,
  FapshiPaymentStatus
}; 