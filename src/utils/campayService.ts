interface CampayPaymentRequest {
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

// Campay API specific request format
interface CampayAPIRequest {
  amount: number;
  currency: string;
  external_reference: string;
  description: string;
  callback_url: string;
  return_url: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

interface CampayPaymentResponse {
  success: boolean;
  data?: {
    payment_url: string;
    reference: string;
    status: string;
    transaction_id: string;
  };
  error?: string;
}

interface CampayPaymentStatus {
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
    transaction_id: string;
  };
  error?: string;
}

class CampayService {
  private apiKey: string;
  private baseUrl: string;
  private isTestMode: boolean;

  constructor() {
    this.apiKey = import.meta.env.VITE_CAMPAY_API_KEY || '';
    this.isTestMode = import.meta.env.VITE_CAMPAY_TEST_MODE === 'true';
    
    // Use correct base URLs based on test mode
    if (this.isTestMode) {
      this.baseUrl = 'https://sandbox.campay.net';
    } else {
      this.baseUrl = 'https://api.campay.net';
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if available
    if (this.apiKey) {
      headers['Authorization'] = `Token ${this.apiKey}`;
    } else {
      console.warn('Campay API key not configured. Please set VITE_CAMPAY_API_KEY');
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Campay API request failed:', error);
      throw error;
    }
  }

  async initializePayment(paymentData: CampayPaymentRequest): Promise<CampayPaymentResponse> {
    try {
      const campayRequest: CampayAPIRequest = {
        amount: paymentData.amount,
        currency: paymentData.currency,
        external_reference: paymentData.reference,
        description: paymentData.description,
        callback_url: paymentData.callback_url,
        return_url: paymentData.return_url,
        customer_name: paymentData.customer.name,
        customer_phone: paymentData.customer.phone,
        customer_email: paymentData.customer.email,
      };

      const response = await this.makeRequest('/api/collect/', 'POST', campayRequest);

      if (response.status === 'success') {
        return {
          success: true,
          data: {
            payment_url: response.payment_url,
            reference: paymentData.reference,
            status: 'pending',
            transaction_id: response.transaction_id
          }
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to initialize payment'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initialization failed'
      };
    }
  }

  async checkPaymentStatus(reference: string): Promise<CampayPaymentStatus> {
    try {
      const response = await this.makeRequest(`/api/transaction/${reference}/`);

      if (response.status === 'success') {
        return {
          success: true,
          data: {
            reference: response.external_reference,
            status: this.mapCampayStatus(response.status),
            amount: response.amount,
            currency: response.currency,
            customer: {
              name: response.customer_name || '',
              phone: response.customer_phone || '',
              email: response.customer_email || ''
            },
            created_at: response.created_at,
            updated_at: response.updated_at,
            transaction_id: response.transaction_id
          }
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to check payment status'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  async createPaymentLink(paymentData: Omit<CampayPaymentRequest, 'callback_url' | 'return_url'>): Promise<CampayPaymentResponse> {
    try {
      const campayRequest: CampayAPIRequest = {
        amount: paymentData.amount,
        currency: paymentData.currency,
        external_reference: paymentData.reference,
        description: paymentData.description,
        callback_url: import.meta.env.VITE_CAMPAY_CALLBACK_URL || `https://kwatalink.com/api/payment-webhook`,
        return_url: import.meta.env.VITE_CAMPAY_RETURN_URL || `https://kwatalink.com/payment-success?reference=${paymentData.reference}`,
        customer_name: paymentData.customer.name,
        customer_phone: paymentData.customer.phone,
        customer_email: paymentData.customer.email,
      };

      const response = await this.makeRequest('/api/collect/', 'POST', campayRequest);

      if (response.status === 'success') {
        return {
          success: true,
          data: {
            payment_url: response.payment_url,
            reference: paymentData.reference,
            status: 'pending',
            transaction_id: response.transaction_id
          }
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to create payment link'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment link creation failed'
      };
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Campay webhook signature verification
    // Implementation depends on Campay's signature method
    // For now, return true (implement proper verification later)
    return true;
  }

  getSupportedPaymentMethods(): string[] {
    return [
      'MTN Mobile Money',
      'Orange Money',
      'Moov Money',
      'Card Payment',
      'Bank Transfer'
    ];
  }

  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Ensure it starts with country code
    if (cleaned.startsWith('237')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '237' + cleaned.substring(1);
    } else {
      return '237' + cleaned;
    }
  }

  private mapCampayStatus(campayStatus: string): 'pending' | 'success' | 'failed' | 'cancelled' {
    switch (campayStatus.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'success';
      case 'failed':
      case 'error':
        return 'failed';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }
}

// Export singleton instance
export const campayService = new CampayService();

// Export types for use in other files
export type {
  CampayPaymentRequest,
  CampayPaymentResponse,
  CampayPaymentStatus
}; 