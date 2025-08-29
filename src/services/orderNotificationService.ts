// Order Notification Service
// Handles sending notifications to customers when order status changes

export interface OrderNotificationData {
  orderId: string;
  customerPhone: string;
  customerEmail?: string;
  customerName: string;
  dishName: string;
  restaurantName: string;
  newStatus: string;
  orderReference?: string;
}

class OrderNotificationService {
  // Send SMS notification (placeholder - integrate with SMS provider)
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      console.log(`📱 Sending SMS to ${phoneNumber}: ${message}`);

      // TODO: Integrate with SMS provider (Twilio, Africa's Talking, etc.)
      // Example:
      // const response = await fetch('/api/send-sms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phoneNumber, message })
      // });
      // return response.ok;

      // For now, just simulate success
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  // Send email notification (placeholder - integrate with email provider)
  async sendEmail(email: string, subject: string, message: string): Promise<boolean> {
    try {
      console.log(`📧 Sending email to ${email}: ${subject}`);

      // TODO: Integrate with email provider (SendGrid, Mailgun, etc.)
      // Example:
      // const response = await fetch('/api/send-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, subject, message })
      // });
      // return response.ok;

      // For now, just simulate success
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Generate status-specific messages
  private getStatusMessage(status: string, data: OrderNotificationData): string {
    const { customerName, dishName, restaurantName, orderReference } = data;

    const messages = {
      confirmed: `Hi ${customerName}! 🎉 Your order for ${dishName} from ${restaurantName} has been confirmed. We'll start preparing it soon!`,

      preparing: `Hi ${customerName}! 👨‍🍳 We're now preparing your ${dishName} from ${restaurantName}. It will be ready for pickup/delivery shortly.`,

      ready: `Hi ${customerName}! ✅ Your ${dishName} from ${restaurantName} is ready! You can pick it up now or expect delivery soon.`,

      'out_for_delivery': `Hi ${customerName}! 🚚 Your ${dishName} from ${restaurantName} is out for delivery. Our driver will contact you soon.`,

      delivered: `Hi ${customerName}! 🎊 Your ${dishName} from ${restaurantName} has been delivered successfully. Enjoy your meal!`,

      cancelled: `Hi ${customerName}, we're sorry but your order for ${dishName} from ${restaurantName} has been cancelled. Please contact us for assistance.`
    };

    return messages[status as keyof typeof messages] ||
           `Hi ${customerName}! Your order status has been updated to: ${status}`;
  }

  // Send notification when order status changes
  async notifyOrderStatusChange(data: OrderNotificationData): Promise<void> {
    const { customerPhone, customerEmail, newStatus } = data;
    const message = this.getStatusMessage(newStatus, data);

    console.log(`🔔 Sending order status notification for order ${data.orderId}`);
    console.log(`📊 New status: ${newStatus}`);

    // Send SMS notification
    if (customerPhone) {
      const smsSuccess = await this.sendSMS(customerPhone, message);
      if (smsSuccess) {
        console.log(`✅ SMS notification sent to ${customerPhone}`);
      } else {
        console.log(`❌ SMS notification failed for ${customerPhone}`);
      }
    }

    // Send email notification (if email provided)
    if (customerEmail) {
      const subject = `Order Update: ${newStatus.replace('_', ' ').toUpperCase()}`;
      const emailSuccess = await this.sendEmail(customerEmail, subject, message);
      if (emailSuccess) {
        console.log(`✅ Email notification sent to ${customerEmail}`);
      } else {
        console.log(`❌ Email notification failed for ${customerEmail}`);
      }
    }

    // Log notification for tracking
    this.logNotification(data, message);
  }

  // Log notification for analytics/tracking
  private logNotification(data: OrderNotificationData, message: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      orderId: data.orderId,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      newStatus: data.newStatus,
      message: message,
      notificationType: 'order_status_update'
    };

    console.log('📝 Notification logged:', logEntry);

    // TODO: Store in database for analytics
    // Example:
    // await supabase.from('notification_logs').insert([logEntry]);
  }

  // Batch notification for multiple orders (useful for bulk updates)
  async notifyMultipleOrders(orders: OrderNotificationData[]): Promise<void> {
    console.log(`📤 Sending notifications for ${orders.length} orders`);

    for (const order of orders) {
      await this.notifyOrderStatusChange(order);

      // Small delay to avoid overwhelming notification services
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ All ${orders.length} notifications processed`);
  }
}

// Export singleton instance
export const orderNotificationService = new OrderNotificationService();

// Export types
export type { OrderNotificationData };