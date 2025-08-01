import { supabase } from '@/integrations/supabase/client';
import { fapshiService } from '@/utils/fapshiService';

interface WebhookPayload {
  reference: string;
  status: 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  created_at: string;
  updated_at: string;
}

interface WebhookRequest {
  body: WebhookPayload;
  headers: {
    'x-fapshi-signature'?: string;
    'content-type': string;
  };
}

export async function handlePaymentWebhook(req: WebhookRequest) {
  try {
    const { body, headers } = req;
    
    // Verify webhook signature (security check)
    const signature = headers['x-fapshi-signature'];
    if (!signature) {
      console.error('Webhook signature missing');
      return { status: 400, error: 'Missing signature' };
    }

    // Verify the webhook signature
    const isValidSignature = fapshiService.verifyWebhookSignature(
      JSON.stringify(body),
      signature
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return { status: 400, error: 'Invalid signature' };
    }

    const { reference, status, amount, currency, customer } = body;

    console.log(`Processing webhook for payment: ${reference}, status: ${status}`);

    // Update order based on payment status
    if (status === 'success') {
      // Update orders status to confirmed
      const { error: ordersError } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('order_reference', reference);

      if (ordersError) {
        console.warn('Error updating orders:', ordersError);
      }

      // Update custom orders status to confirmed
      const { error: customOrdersError } = await supabase
        .from('custom_orders')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('order_reference', reference);

      if (customOrdersError) {
        console.warn('Error updating custom orders:', customOrdersError);
      }

      // Try to save payment record to payments table (if it exists)
      try {
        const paymentRecord = {
          order_reference: reference,
          payment_reference: reference,
          payment_method: 'fapshi',
          payment_status: 'paid',
          amount: amount,
          currency: currency,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          created_at: new Date().toISOString()
        };

        const { error: paymentError } = await supabase
          .from('payments')
          .insert(paymentRecord);

        if (paymentError) {
          console.warn('Payments table not available or error saving payment record:', paymentError);
        } else {
          console.log('Payment record saved successfully');
        }
      } catch (paymentError) {
        console.warn('Payments table not available:', paymentError);
      }

      console.log(`Order ${reference} updated successfully - payment confirmed`);
      
      // Send confirmation email to customer
      await sendPaymentConfirmationEmail(reference, customer.email);
      
      // Send notification to admin
      await sendAdminPaymentNotification(reference, amount, currency);

    } else if (status === 'failed' || status === 'cancelled') {
      // Payment failed or cancelled - update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          payment_reference: reference,
          payment_method: 'fapshi',
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('order_reference', reference);

      if (orderError) {
        // Try updating custom_orders table
        const { error: customOrderError } = await supabase
          .from('custom_orders')
          .update({
            payment_status: 'failed',
            payment_reference: reference,
            payment_method: 'fapshi',
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('order_reference', reference);

        if (customOrderError) {
          console.error('Error updating order status:', customOrderError);
          return { status: 500, error: 'Failed to update order status' };
        }
      }

      console.log(`Order ${reference} payment ${status}`);
    }

    return { status: 200, success: true, message: 'Webhook processed successfully' };

  } catch (error) {
    console.error('Webhook processing error:', error);
    return { status: 500, error: 'Internal server error' };
  }
}

async function sendPaymentConfirmationEmail(orderReference: string, customerEmail?: string) {
  try {
    // Import email service
    const { sendPaymentConfirmation } = await import('@/utils/genericEmailService');
    
    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', orderReference)
      .single();

    if (order) {
      // Send payment confirmation email
      await sendPaymentConfirmation({
        payment_reference: orderReference,
        payment_amount: `${order.total_amount} FCFA`,
        payment_method: 'Fapshi',
        payment_date: new Date().toLocaleString(),
        order_reference: orderReference,
        restaurant_name: order.restaurant_name,
        estimated_delivery: '15-30 minutes'
      });
    }
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
}

async function sendAdminPaymentNotification(orderReference: string, amount: number, currency: string) {
  try {
    // Import email service
    const { sendAdminNotification } = await import('@/utils/genericEmailService');
    
    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', orderReference)
      .single();

    if (order) {
      // Send admin notification
      await sendAdminNotification({
        order_reference: orderReference,
        customer_name: order.user_name,
        customer_email: 'Not provided',
        customer_phone: order.user_phone,
        order_total: `${order.total_amount} FCFA`
      });
    }
  } catch (error) {
    console.error('Error sending admin payment notification:', error);
  }
}

// Export for use in server routes
export default handlePaymentWebhook; 