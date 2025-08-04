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
  private serverUrl: string;

  constructor() {
    // Use our unified payment API server instead of direct Fapshi API
    this.serverUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    console.log('FapshiService initialized:', { serverUrl: this.serverUrl });
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<any> {
    const url = `${this.serverUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method === 'POST') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment API Error:', error);
      throw error;
    }
  }





  async initializePayment(paymentData: FapshiPaymentRequest): Promise<FapshiPaymentResponse> {
    try {
      // Use our unified payment API
      const endpoint = '/api/fapshi/initialize';
      const response = await this.makeRequest(endpoint, 'POST', paymentData);
      
      return {
        success: response.success,
        data: response.data,
        error: response.error
      };
    } catch (error) {
      console.error('Fapshi payment failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize payment'
      };
    }
  }

  async checkPaymentStatus(reference: string): Promise<FapshiPaymentStatus> {
    try {
      // Use our unified payment API
      const endpoint = `/api/fapshi/status/${reference}`;
      const response = await this.makeRequest(endpoint);
      
      return {
        success: response.success,
        data: response.data,
        error: response.error
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