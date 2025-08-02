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
  private serverUrl: string;

  constructor() {
    // Use Vite proxy for server-side API calls
    this.serverUrl = '';
  }

  private async makeServerRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<any> {
    const url = endpoint;
    
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
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Server API request failed:', error);
      throw error;
    }
  }

  async initializePayment(paymentData: CampayPaymentRequest): Promise<CampayPaymentResponse> {
    try {
      const response = await this.makeServerRequest('/api/campay/initialize', 'POST', paymentData);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            payment_url: response.data.payment_url,
            reference: response.data.reference,
            status: 'pending',
            transaction_id: response.data.transaction_id
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to initialize payment'
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
      const response = await this.makeServerRequest(`/api/campay/status/${reference}`);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            reference: response.data.reference,
            status: this.mapCampayStatus(response.data.status),
            amount: response.data.amount,
            currency: response.data.currency,
            customer: {
              name: response.data.customer.name || '',
              phone: response.data.customer.phone || '',
              email: response.data.customer.email || ''
            },
            created_at: response.data.created_at,
            updated_at: response.data.updated_at,
            transaction_id: response.data.transaction_id
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to check payment status'
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
      const fullPaymentData = {
        ...paymentData,
        callback_url: import.meta.env.VITE_CAMPAY_CALLBACK_URL || `https://kwatalink.com/api/payment-webhook`,
        return_url: import.meta.env.VITE_CAMPAY_RETURN_URL || `https://kwatalink.com/payment-success?reference=${paymentData.reference}`,
      };

      const response = await this.makeServerRequest('/api/campay/initialize', 'POST', fullPaymentData);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            payment_url: response.data.payment_url,
            reference: response.data.reference,
            status: 'pending',
            transaction_id: response.data.transaction_id
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to create payment link'
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
    const webhookKey = import.meta.env.VITE_CAMPAY_WEBHOOK_KEY;
    
    if (!webhookKey) {
      console.warn('Campay webhook key not configured. Skipping signature verification.');
      return true; // Allow in development
    }
    
    // TODO: Implement proper webhook signature verification
    // This should verify the signature using the webhook key
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