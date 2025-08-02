// Server-side email service - no exposed keys
export interface OrderEmailData {
  orderReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  restaurantName: string;
  dishName: string;
  quantity: number;
  totalAmount: string;
  deliveryAddress: string;
}

/**
 * Send order confirmation email to customer via server
 */
export const sendOrderConfirmationEmail = async (orderData: OrderEmailData): Promise<boolean> => {
  try {
    console.log('Sending order confirmation email via server:', orderData);
    
    const response = await fetch('/api/email/send-order-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderData })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Order confirmation email result:', result);
    
    return result.success;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

/**
 * Send admin notification email via server
 */
export const sendAdminNotificationEmail = async (orderData: OrderEmailData): Promise<boolean> => {
  try {
    console.log('Sending admin notification email via server:', orderData);
    
    const response = await fetch('/api/email/send-admin-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderData })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Admin notification email result:', result);
    
    return result.success;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
}; 