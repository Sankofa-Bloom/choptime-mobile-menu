import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'default_service',
  templateId: import.meta.env.VITE_EMAILJS_GENERIC_TEMPLATE_ID || 'default_template',
  userId: import.meta.env.VITE_EMAILJS_USER_ID || 'default_user'
};

// Ensure EmailJS is initialized
if (typeof window !== 'undefined') {
  emailjs.init(import.meta.env.VITE_EMAILJS_USER_ID || 'default_user');
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
    // Check if emailjs is available
    if (!emailjs || typeof emailjs.send !== 'function') {
      console.error('EmailJS is not properly initialized or available');
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

// Test function to identify correct EmailJS template variables
export const testEmailJSTemplate = async (testEmail: string): Promise<boolean> => {
  const testConfig = {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'default_service',
    templateId: import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID || 'default_template',
    userId: import.meta.env.VITE_EMAILJS_USER_ID || 'default_user'
  };

  // Test with minimal parameters first
  const minimalParams = {
    to_email: testEmail,
    to_name: 'Test User'
  };

  try {
    console.log('Testing EmailJS template with minimal parameters:', minimalParams);
    
    const response = await emailjs.send(
      testConfig.serviceId,
      testConfig.templateId,
      minimalParams,
      testConfig.userId
    );
    
    console.log('✅ Minimal test successful:', response);
    return true;
  } catch (error: any) {
    console.error('❌ Minimal test failed:', error);
    
    if (error.status === 422) {
      console.log('🔍 Template requires additional variables. Testing individual variable names...');
      
      // Test individual variable names to identify which ones work
      const variableTests = [
        { user_email: testEmail, user_name: 'Test User' },
        { email: testEmail, name: 'Test User' },
        { recipient_email: testEmail, recipient_name: 'Test User' },
        { contact_email: testEmail, contact_name: 'Test User' },
        { customer_email: testEmail, customer_name: 'Test User' }
      ];
      
      for (let i = 0; i < variableTests.length; i++) {
        const testParams = variableTests[i];
        console.log(`🔍 Testing variable set ${i + 1}:`, testParams);
        
        try {
          const response = await emailjs.send(
            testConfig.serviceId,
            testConfig.templateId,
            testParams,
            testConfig.userId
          );
          
          console.log(`✅ Variable set ${i + 1} successful:`, response);
          console.log(`🎯 Your template uses these variable names:`, Object.keys(testParams));
          return true;
        } catch (error2: any) {
          console.log(`❌ Variable set ${i + 1} failed:`, error2.text);
        }
      }
      
      // If individual tests fail, try with all variables
      console.log('🔍 Trying with all variable names...');
      const extendedParams = {
        to_email: testEmail,
        to_name: 'Test User',
        user_email: testEmail,
        user_name: 'Test User',
        email: testEmail,
        name: 'Test User',
        recipient_email: testEmail,
        recipient_name: 'Test User',
        contact_email: testEmail,
        contact_name: 'Test User',
        customer_email: testEmail,
        customer_name: 'Test User'
      };
      
      try {
        const response2 = await emailjs.send(
          testConfig.serviceId,
          testConfig.templateId,
          extendedParams,
          testConfig.userId
        );
        
        console.log('✅ Extended test successful:', response2);
        console.log('🎯 Your template works with multiple variable names');
        return true;
      } catch (error2: any) {
        console.error('❌ Extended test also failed:', error2);
        console.error('🔍 Template error details:', error2.text);
        return false;
      }
    }
    
    return false;
  }
}; 