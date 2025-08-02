import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'default_service',
  templateId: import.meta.env.VITE_EMAILJS_GENERIC_TEMPLATE_ID || 'default_template',
  userId: import.meta.env.VITE_EMAILJS_USER_ID || 'default_user'
};

// Initialize EmailJS safely
let emailjsInitialized = false;
if (typeof window !== 'undefined') {
  try {
    const userId = import.meta.env.VITE_EMAILJS_USER_ID;
    if (userId && userId !== 'default_user') {
      emailjs.init(userId);
      emailjsInitialized = true;
      console.log('EmailJS initialized successfully');
    } else {
      console.warn('EmailJS not initialized: User ID not configured');
    }
  } catch (error) {
    console.warn('EmailJS initialization failed:', error);
  }
}

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  userId: string;
}

export const sendEmailViaEmailJS = async (
  templateParams: any,
  config: EmailConfig = EMAILJS_CONFIG
): Promise<boolean> => {
  try {
    // Check if emailjs is available and initialized
    if (!emailjsInitialized || !emailjs || typeof emailjs.send !== 'function') {
      console.error('EmailJS is not properly initialized or available');
      console.log('EmailJS status:', {
        initialized: emailjsInitialized,
        emailjs: !!emailjs,
        sendFunction: typeof emailjs?.send
      });
      return false;
    }

    console.log('EmailJS Configuration:', {
      serviceId: config.serviceId,
      templateId: config.templateId,
      userId: config.userId
    });
    console.log('Sending email via EmailJS with params:', templateParams);
    
    // Validate configuration
    if (!config.serviceId || config.serviceId === 'default_service') {
      console.error('EmailJS Service ID not configured');
      return false;
    }
    
    if (!config.templateId || config.templateId === 'default_template') {
      console.error('EmailJS Template ID not configured');
      return false;
    }
    
    if (!config.userId || config.userId === 'default_user') {
      console.error('EmailJS User ID not configured');
      return false;
    }
    
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      config.userId
    );
    
    console.log('Email sent successfully:', response);
    return true;
  } catch (error: any) {
    console.error('Error sending email via EmailJS:', error);
    
    // Provide specific error messages
    if (error.status === 400) {
      console.error('EmailJS 400 Error - Check your Service ID, Template ID, and User ID');
    } else if (error.status === 401) {
      console.error('EmailJS 401 Error - Check your User ID (Public Key)');
    } else if (error.status === 404) {
      console.error('EmailJS 404 Error - Service or Template not found');
    } else if (error.status === 422) {
      console.error('EmailJS 422 Error - Template parameters are invalid or missing required fields');
      console.error('Error details:', error.text);
      console.error('Check your EmailJS template variables and make sure all required fields are provided');
    }
    
    return false;
  }
};

// Alternative: Use a simple HTTP request to an email service
export const sendEmailViaHTTP = async (
  recipientEmail: string,
  subject: string,
  htmlContent: string,
  fromEmail: string = import.meta.env.VITE_ADMIN_EMAIL || 'admin@choptime.com',
  apiKey?: string
): Promise<boolean> => {
  try {
    // This would be a call to a service like SendGrid, Mailgun, etc.
    // For now, we'll just log the email details
    console.log('Email would be sent from:', fromEmail);
    console.log('Email would be sent to:', recipientEmail);
    console.log('Subject:', subject);
    console.log('Content length:', htmlContent.length);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error('Error sending email via HTTP:', error);
    return false;
  }
};

// Simple email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Email template helper
export const createEmailTemplate = (template: string, data: any): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}; 

 