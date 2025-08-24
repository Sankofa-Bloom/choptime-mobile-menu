import { supabase } from '@/integrations/supabase/client';

interface MomoPaymentRequest {
  amount: number;
  currency: string;
  externalId: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
}

interface MomoPaymentResponse {
  success: boolean;
  data?: {
    status: string;
    referenceId: string;
    externalId: string;
    amount: string;
    currency: string;
    payer: {
      partyIdType: string;
      partyId: string;
    };
    payerMessage: string;
    payeeNote: string;
  };
  error?: string;
}

interface MomoStatusResponse {
  success: boolean;
  data?: {
    status: string;
    amount: string;
    currency: string;
    externalId: string;
    payer: {
      partyIdType: string;
      partyId: string;
    };
    payerMessage: string;
    payeeNote: string;
    reason?: string;
  };
  error?: string;
}

class MTNMomoService {
  private serverUrl: string;

  constructor() {
    // Use the Netlify functions URL in production, localhost in development
    this.serverUrl = process.env.NODE_ENV === 'production' 
      ? '/.netlify/functions' 
      : 'http://localhost:8888/.netlify/functions';
  }

  async requestToPay(paymentData: MomoPaymentRequest): Promise<MomoPaymentResponse> {
    try {
      console.log('MTN MoMo: Initiating payment request', { externalId: paymentData.externalId });

      const response = await fetch(`${this.serverUrl}/momo-request-to-pay`, {
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

      return result;
    } catch (error) {
      console.error('MTN MoMo: Payment request failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment request failed'
      };
    }
  }

  async checkPaymentStatus(referenceId: string): Promise<MomoStatusResponse> {
    try {
      console.log('MTN MoMo: Checking payment status for', referenceId);

      const response = await fetch(`${this.serverUrl}/momo-payment-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referenceId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('MTN MoMo: Status check failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  // Generate a unique external ID for the transaction
  generateExternalId(): string {
    return `CHOPTYM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Format phone number for MTN Cameroon (237 country code)
  formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 237, use as is
    if (cleaned.startsWith('237')) {
      return cleaned;
    }
    
    // If it starts with 6, add 237
    if (cleaned.startsWith('6')) {
      return `237${cleaned}`;
    }
    
    // If it's 9 digits starting with 6, add 237
    if (cleaned.length === 9 && cleaned.startsWith('6')) {
      return `237${cleaned}`;
    }
    
    // Default: assume it needs 237 prefix
    return `237${cleaned}`;
  }

  // Validate phone number for MTN network
  isValidMTNNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    
    // MTN Cameroon numbers: 237 6[5-9]X XXX XXX
    const mtnPattern = /^237(6[5-9]\d{7})$/;
    return mtnPattern.test(formatted);
  }

  // Store payment record in Supabase
  async storePaymentRecord(orderData: any, referenceId: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          id: referenceId,
          customer_name: orderData.customer.name,
          customer_phone: orderData.customer.phone,
          customer_email: orderData.customer.email,
          delivery_address: orderData.delivery_address,
          total_amount: orderData.amount,
          payment_method: 'mtn_momo',
          payment_status: 'pending',
          payment_reference: referenceId,
          order_details: orderData.order_details,
          restaurant_id: orderData.restaurant_id,
          delivery_fee: orderData.delivery_fee,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to store payment record:', error);
        throw error;
      }

      console.log('Payment record stored successfully:', referenceId);
    } catch (error) {
      console.error('Error storing payment record:', error);
      throw error;
    }
  }

  // Update payment status in Supabase
  async updatePaymentStatus(referenceId: string, status: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('payment_reference', referenceId);

      if (error) {
        console.error('Failed to update payment status:', error);
        throw error;
      }

      console.log('Payment status updated:', referenceId, status);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }
}

export default MTNMomoService;
