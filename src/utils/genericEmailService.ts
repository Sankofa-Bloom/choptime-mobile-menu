import { sendEmailViaEmailJS } from './emailService';

// Email types supported by the generic template
export type EmailType = 
  | 'contact'
  | 'order_confirmation'
  | 'admin_notification'
  | 'payment_confirmation'
  | 'custom';

// Base email parameters
interface BaseEmailParams {
  email_type: EmailType;
  email_title?: string;
  email_subtitle?: string;
  company_name?: string;
  company_address?: string;
  admin_email?: string;
  admin_phone?: string;
  sent_date?: string;
  email_id?: string;
}

// Contact form email parameters
interface ContactEmailParams extends BaseEmailParams {
  email_type: 'contact';
  from_name: string;
  from_email: string;
  from_phone?: string;
  subject: string;
  message: string;
}

// Order confirmation email parameters
interface OrderConfirmationParams extends BaseEmailParams {
  email_type: 'order_confirmation';
  order_reference: string;
  restaurant_name: string;
  order_date: string;
  estimated_delivery: string;
  order_items?: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  order_total: string;
  delivery_address: string;
  customer_phone: string;
  payment_method: string;
}

// Admin notification email parameters
interface AdminNotificationParams extends BaseEmailParams {
  email_type: 'admin_notification';
  order_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_total: string;
}

// Payment confirmation email parameters
interface PaymentConfirmationParams extends BaseEmailParams {
  email_type: 'payment_confirmation';
  payment_reference: string;
  payment_amount: string;
  payment_method: string;
  payment_date: string;
  order_reference: string;
  restaurant_name: string;
  estimated_delivery: string;
}

// Custom email parameters
interface CustomEmailParams extends BaseEmailParams {
  email_type: 'custom';
  custom_title?: string;
  custom_message: string;
  custom_urgent?: string;
  custom_success?: string;
  custom_warning?: string;
}

// Union type for all email parameters
export type EmailParams = 
  | ContactEmailParams
  | OrderConfirmationParams
  | AdminNotificationParams
  | PaymentConfirmationParams
  | CustomEmailParams;

// Action button interface
export interface ActionButton {
  text: string;
  url: string;
}

// Generic email service class
export class GenericEmailService {
  // All emails use the same generic template
  private static readonly TEMPLATE_ID = import.meta.env.VITE_EMAILJS_GENERIC_TEMPLATE_ID || 'generic_template';
  private static readonly SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
  private static readonly USER_ID = import.meta.env.VITE_EMAILJS_USER_ID || '';

  /**
   * Send a contact form email to admin
   */
  static async sendContactEmail(params: Omit<ContactEmailParams, 'email_type'>): Promise<boolean> {
    const emailParams: ContactEmailParams = {
      ...params,
      email_type: 'contact',
      email_title: 'New Contact Message - KwataLink',
      email_subtitle: 'Contact Form Submission',
      sent_date: new Date().toLocaleString(),
      email_id: `contact_${Date.now()}`
    };

    // Map contact form parameters to EmailJS template variables
    const mappedParams = {
      ...emailParams,
      // Map to common EmailJS template variables
      customer_name: params.from_name,
      customer_email: params.from_email,
      customer_phone: params.from_phone || '',
      subject: params.subject,
      message: params.message,
      // Additional mappings for compatibility
      to_name: params.from_name,
      to_email: params.from_email,
      from_name: params.from_name,
      from_email: params.from_email,
      from_phone: params.from_phone || '',
      // Admin email for replies
              reply_to: import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'
    };

    return this.sendEmail(mappedParams as any);
  }

  /**
   * Send order confirmation email to customer
   */
  static async sendOrderConfirmation(params: Omit<OrderConfirmationParams, 'email_type'>): Promise<boolean> {
    const emailParams: OrderConfirmationParams = {
      ...params,
      email_type: 'order_confirmation',
      email_title: 'Order Confirmed - KwataLink',
      email_subtitle: 'Your order is being prepared',
      sent_date: new Date().toLocaleString(),
      email_id: `order_${params.order_reference}`
    };

    return this.sendEmail(emailParams);
  }

  /**
   * Send admin notification for new order
   */
  static async sendAdminNotification(params: Omit<AdminNotificationParams, 'email_type'>): Promise<boolean> {
    const emailParams: AdminNotificationParams = {
      ...params,
      email_type: 'admin_notification',
      email_title: 'New Order Notification - KwataLink',
      email_subtitle: 'Action Required',
      sent_date: new Date().toLocaleString(),
      email_id: `admin_${params.order_reference}`
    };

    return this.sendEmail(emailParams);
  }

  /**
   * Send payment confirmation email
   */
  static async sendPaymentConfirmation(params: Omit<PaymentConfirmationParams, 'email_type'>): Promise<boolean> {
    const emailParams: PaymentConfirmationParams = {
      ...params,
      email_type: 'payment_confirmation',
      email_title: 'Payment Confirmed - KwataLink',
      email_subtitle: 'Your payment was successful',
      sent_date: new Date().toLocaleString(),
      email_id: `payment_${params.payment_reference}`
    };

    return this.sendEmail(emailParams);
  }

  /**
   * Send custom email with custom content
   */
  static async sendCustomEmail(params: Omit<CustomEmailParams, 'email_type'>): Promise<boolean> {
    const emailParams: CustomEmailParams = {
      ...params,
      email_type: 'custom',
      email_title: params.custom_title || 'KwataLink Notification',
      email_subtitle: 'Custom Message',
      sent_date: new Date().toLocaleString(),
      email_id: `custom_${Date.now()}`
    };

    return this.sendEmail(emailParams);
  }

  /**
   * Send any type of email with custom parameters
   */
  static async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      // Add default values for missing fields
      const completeParams = {
        company_name: import.meta.env.VITE_COMPANY_NAME || 'KwataLink',
        company_address: import.meta.env.VITE_COMPANY_ADDRESS || 'Your Company Address',
        admin_email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com',
        admin_phone: import.meta.env.VITE_ADMIN_PHONE || '+1234567890',
        ...params
      };

      // Map parameters to common EmailJS template variables
      const mappedParams = {
        ...completeParams,
        // Common mappings for all email types
        to_name: completeParams.customer_name || completeParams.from_name || 'Customer',
        to_email: completeParams.customer_email || completeParams.from_email || completeParams.admin_email,
        reply_to: completeParams.admin_email || 'admin@example.com',
        // Ensure all required fields are present
        customer_name: completeParams.customer_name || completeParams.from_name || 'Customer',
        customer_email: completeParams.customer_email || completeParams.from_email || completeParams.admin_email,
        customer_phone: completeParams.customer_phone || completeParams.from_phone || '',
        // Additional compatibility mappings
        user_name: completeParams.customer_name || completeParams.from_name || 'Customer',
        user_email: completeParams.customer_email || completeParams.from_email || completeParams.admin_email,
        recipient_name: completeParams.customer_name || completeParams.from_name || 'Customer',
        recipient_email: completeParams.customer_email || completeParams.from_email || completeParams.admin_email,
        contact_name: completeParams.customer_name || completeParams.from_name || 'Customer',
        contact_email: completeParams.customer_email || completeParams.from_email || completeParams.admin_email
      };

      console.log('Sending generic email:', {
        type: mappedParams.email_type,
        templateId: this.TEMPLATE_ID,
        serviceId: this.SERVICE_ID,
        userId: this.USER_ID,
        params: mappedParams
      });

      // Validate EmailJS configuration
      if (!this.SERVICE_ID || this.SERVICE_ID === 'default_service') {
        console.warn('EmailJS Service ID not configured - emails will not be sent');
        return false;
      }

      if (!this.TEMPLATE_ID || this.TEMPLATE_ID === 'default_template') {
        console.warn('EmailJS Template ID not configured - emails will not be sent');
        return false;
      }

      if (!this.USER_ID || this.USER_ID === 'default_user') {
        console.warn('EmailJS User ID not configured - emails will not be sent');
        return false;
      }

      const success = await sendEmailViaEmailJS(mappedParams, {
        serviceId: this.SERVICE_ID,
        templateId: this.TEMPLATE_ID,
        userId: this.USER_ID
      });

      if (success) {
        console.log('Generic email sent successfully:', mappedParams.email_type);
      } else {
        console.error('Failed to send generic email:', mappedParams.email_type);
      }

      return success;
    } catch (error) {
      console.error('Error sending generic email:', error);
      return false;
    }
  }

  /**
   * Send email with action buttons
   */
  static async sendEmailWithActions(
    params: EmailParams, 
    actionButtons: ActionButton[]
  ): Promise<boolean> {
    const paramsWithActions = {
      ...params,
      action_buttons: actionButtons
    };

    return this.sendEmail(paramsWithActions as any);
  }

}

// Export convenience functions
export const sendContactEmail = GenericEmailService.sendContactEmail;
export const sendOrderConfirmation = GenericEmailService.sendOrderConfirmation;
export const sendAdminNotification = GenericEmailService.sendAdminNotification;
export const sendPaymentConfirmation = GenericEmailService.sendPaymentConfirmation;
export const sendCustomEmail = GenericEmailService.sendCustomEmail;
export const sendEmailWithActions = GenericEmailService.sendEmailWithActions; 