// Payin API Service
// Clean implementation based on Payin API OpenAPI specification
// Communicates with backend proxy endpoints for security

export interface PayinAuthRequest {
  email: string;
  password: string;
}

export interface PayinAuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface PayinPaymentRequest {
  country_code: string;
  name: string;
  email: string;
  mobile?: string;
  amount: number;
  transaction_id: string;
  description: string;
  pass_digital_charge: boolean;
}

export interface PayinPaymentResponse {
  success: boolean;
  data?: {
    transaction_id?: string;
  };
  status?: number;
  message?: string;
  error?: string;
}

export interface PayinStatusRequest {
  transaction_id: string;
}

export interface PayinStatusResponse {
  success: boolean;
  data?: {
    status: string;
    transaction_id: string;
    amount?: number;
    payment_date?: string;
  };
  status?: number;
  message?: string;
  error?: string;
}

class PayinService {
  private serverUrl: string;
  private authToken: string | null = null;

  constructor() {
    // Use backend proxy for all API calls
    this.serverUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  /**
   * Authenticate with Payin API through backend proxy
   */
  async authenticate(): Promise<PayinAuthResponse> {
    try {
      console.log('Payin: Authenticating through backend proxy');

      const response = await fetch(`${this.serverUrl}/api/payin/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
        // Note: No body needed - backend uses its own secure credentials
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Authentication failed: ${response.status}`);
      }

      // Store the token for future requests
      if (result.token) {
        this.authToken = result.token;
        // Store token in localStorage for persistence
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('payin_auth_token', result.token);
          localStorage.setItem('payin_token_expires', Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
        }
      }

      return {
        success: true,
        token: result.token,
        message: result.message || 'Authentication successful'
      };
    } catch (error) {
      console.error('Payin: Authentication failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Check if we have a valid token and load it from storage if available
   */
  private loadStoredToken(): boolean {
    if (typeof localStorage === 'undefined') return false;

    const token = localStorage.getItem('payin_auth_token');
    const expires = localStorage.getItem('payin_token_expires');

    if (token && expires && Date.now() < parseInt(expires)) {
      this.authToken = token;
      return true;
    }

    // Token expired or not found, clear storage
    this.clearStoredToken();
    return false;
  }

  /**
   * Clear stored authentication token
   */
  private clearStoredToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('payin_auth_token');
      localStorage.removeItem('payin_token_expires');
    }
    this.authToken = null;
  }

  /**
   * Create a payment link via Payin API through backend proxy
   */
  async createPaymentLink(paymentData: PayinPaymentRequest): Promise<PayinPaymentResponse> {
    try {
      console.log('Payin: Creating payment link', {
        transaction_id: paymentData.transaction_id,
        amount: paymentData.amount
      });

      // Ensure we have a valid token
      if (!this.loadStoredToken()) {
        // Try to authenticate first
        const authResult = await this.authenticate();
        if (!authResult.success) {
          return {
            success: false,
            error: 'Authentication failed. Please try again.'
          };
        }
      }

      const response = await fetch(`${this.serverUrl}/api/payin/create_payment_links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear it and retry once
          this.clearStoredToken();
          return {
            success: false,
            error: 'Authentication expired. Please try again.'
          };
        }

        throw new Error(result.error || `Server error: ${response.status}`);
      }

      return {
        success: true,
        data: result.data,
        status: result.status,
        message: result.message
      };
    } catch (error) {
      console.error('Payin: Payment link creation failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment link creation failed'
      };
    }
  }

  /**
   * Check payment status via Payin API through backend proxy
   */
  async checkPaymentStatus(transaction_id: string): Promise<PayinStatusResponse> {
    try {
      console.log('Payin: Checking payment status', { transaction_id });

      // Ensure we have a valid token
      if (!this.loadStoredToken()) {
        // Try to authenticate first
        const authResult = await this.authenticate();
        if (!authResult.success) {
          return {
            success: false,
            error: 'Authentication failed. Please try again.'
          };
        }
      }

      const response = await fetch(`${this.serverUrl}/api/payin/payment-link-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ transaction_id }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear it
          this.clearStoredToken();
          return {
            success: false,
            error: 'Authentication expired. Please try again.'
          };
        }

        if (response.status === 404) {
          return {
            success: false,
            error: 'Transaction not found',
            status: 404
          };
        }

        throw new Error(result.error || `Server error: ${response.status}`);
      }

      return {
        success: true,
        data: result.data,
        status: result.status,
        message: result.message
      };
    } catch (error) {
      console.error('Payin: Status check failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  /**
   * Generate a unique transaction ID for the order
   */
  generateTransactionId(orderReference: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `PAYIN_${orderReference}_${timestamp}_${random}`;
  }

  /**
   * Validate Cameroon phone number format
   */
  isValidCameroonNumber(phone: string): boolean {
    // Cameroon numbers: +237XXXXXXXX or 237XXXXXXXX or 6XXXXXXXX
    const patterns = [
      /^\+237[6-9]\d{8}$/, // +237XXXXXXXX
      /^237[6-9]\d{8}$/,   // 237XXXXXXXX
      /^[6-9]\d{8}$/       // 6XXXXXXXX
    ];

    return patterns.some(pattern => pattern.test(phone.replace(/\s/g, '')));
  }

  /**
   * Format phone number to Cameroon standard
   */
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\s/g, '');

    if (cleaned.startsWith('+237')) {
      return cleaned;
    } else if (cleaned.startsWith('237')) {
      return `+${cleaned}`;
    } else if (/^[6-9]\d{8}$/.test(cleaned)) {
      return `+237${cleaned}`;
    }

    return phone; // Return as-is if doesn't match expected patterns
  }

  /**
   * Store payment record in database for tracking (optional)
   */
  async storePaymentRecord(orderData: any, transactionId: string): Promise<boolean> {
    try {
      console.log('Payin: Storing payment record', { transactionId });

      const response = await fetch(`${this.serverUrl}/store-payment-record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          order_data: orderData,
          payment_method: 'payin',
          status: 'pending'
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Payin: Failed to store payment record', error);
      return false;
    }
  }
}

export default PayinService;