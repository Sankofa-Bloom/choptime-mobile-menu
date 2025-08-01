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
      email_title: 'New Contact Message - ChopTime',
      email_subtitle: 'Contact Form Submission',
      sent_date: new Date().toLocaleString(),
      email_id: `contact_${Date.now()}`
    };

    return this.sendEmail(emailParams);
  }

  /**
   * Send order confirmation email to customer
   */
  static async sendOrderConfirmation(params: Omit<OrderConfirmationParams, 'email_type'>): Promise<boolean> {
    const emailParams: OrderConfirmationParams = {
      ...params,
      email_type: 'order_confirmation',
      email_title: 'Order Confirmed - ChopTime',
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
      email_title: 'New Order Notification - ChopTime',
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
      email_title: 'Payment Confirmed - ChopTime',
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
      email_title: params.custom_title || 'ChopTime Notification',
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
        company_name: import.meta.env.VITE_COMPANY_NAME || 'ChopTime',
        company_address: import.meta.env.VITE_COMPANY_ADDRESS || 'Busumbu Junction, Limbe - Cameroon',
        admin_email: import.meta.env.VITE_ADMIN_EMAIL || 'choptime237@gmail.com',
        admin_phone: import.meta.env.VITE_ADMIN_PHONE || '+237 670 416 449',
        ...params
      };

      console.log('Sending generic email:', {
        type: completeParams.email_type,
        templateId: this.TEMPLATE_ID,
        params: completeParams
      });

      const success = await sendEmailViaEmailJS(completeParams, {
        serviceId: this.SERVICE_ID,
        templateId: this.TEMPLATE_ID,
        userId: this.USER_ID
      });

      if (success) {
        console.log('Generic email sent successfully:', completeParams.email_type);
      } else {
        console.error('Failed to send generic email:', completeParams.email_type);
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

  /**
   * Test the generic email template
   */
  static async testTemplate(): Promise<boolean> {
    const testParams: CustomEmailParams = {
      email_type: 'custom',
      custom_title: 'Test Email - ChopTime',
      custom_message: 'This is a test email to verify the generic template is working correctly.',
      custom_success: '✅ Template test successful!',
      email_title: 'Test Email',
      email_subtitle: 'Template Verification'
    };

    return this.sendEmail(testParams);
  }
}

// Export convenience functions
export const sendContactEmail = GenericEmailService.sendContactEmail;
export const sendOrderConfirmation = GenericEmailService.sendOrderConfirmation;
export const sendAdminNotification = GenericEmailService.sendAdminNotification;
export const sendPaymentConfirmation = GenericEmailService.sendPaymentConfirmation;
export const sendCustomEmail = GenericEmailService.sendCustomEmail;
export const sendEmailWithActions = GenericEmailService.sendEmailWithActions;
export const testEmailTemplate = GenericEmailService.testTemplate; 