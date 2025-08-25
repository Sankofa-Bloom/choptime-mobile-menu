// Swychr Payment Service
// Simple service for handling Swychr payment API calls

export interface SwychrPaymentRequest {
  country_code: string;
  name: string;
  email: string;
  mobile?: string;
  amount: number;
  transaction_id: string;
  description: string;
  pass_digital_charge: boolean;
}

export interface SwychrPaymentResponse {
  success: boolean;
  data?: {
    payment_link?: string;
    transaction_id?: string;
    status?: string;
  };
  error?: string;
  message?: string;
}

export interface SwychrStatusRequest {
  transaction_id: string;
}

export interface SwychrStatusResponse {
  success: boolean;
  data?: {
    status: string;
    transaction_id: string;
    amount?: number;
    payment_date?: string;
  };
  error?: string;
  message?: string;
}

class SwychrService {
  private serverUrl: string;

  constructor() {
    // Use environment-specific URL
    this.serverUrl = process.env.NODE_ENV === 'production' 
      ? '/.netlify/functions' 
      : 'http://localhost:8888/.netlify/functions';
  }

  /**
   * Generate a unique transaction ID for the order
   */
  generateTransactionId(orderReference: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `CHOP_${orderReference}_${timestamp}_${random}`;
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
   * Create a payment link via Swychr API
   */
  async createPaymentLink(paymentData: SwychrPaymentRequest): Promise<SwychrPaymentResponse> {
    try {
      console.log('Swychr: Creating payment link', { 
        transaction_id: paymentData.transaction_id,
        amount: paymentData.amount 
      });

      const response = await fetch(`${this.serverUrl}/create-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('Swychr: Payment link creation failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment link creation failed'
      };
    }
  }

  /**
   * Check payment status via Swychr API
   */
  async checkPaymentStatus(transaction_id: string): Promise<SwychrStatusResponse> {
    try {
      console.log('Swychr: Checking payment status', { transaction_id });

      const response = await fetch(`${this.serverUrl}/check-payment-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('Swychr: Status check failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  /**
   * Store payment record in database for tracking
   */
  async storePaymentRecord(orderData: any, transactionId: string): Promise<boolean> {
    try {
      console.log('Swychr: Storing payment record', { transactionId });

      const response = await fetch(`${this.serverUrl}/store-payment-record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          order_data: orderData,
          payment_method: 'swychr',
          status: 'pending'
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Swychr: Failed to store payment record', error);
      return false;
    }
  }
}

export default SwychrService;
