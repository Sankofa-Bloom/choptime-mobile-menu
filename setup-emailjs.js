#!/usr/bin/env node

/**
 * EmailJS Setup Script for ChopTime
 * This script helps you configure EmailJS environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🍽️  ChopTime EmailJS Setup\n');
console.log('This script will help you configure EmailJS for email notifications.\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEmailJS() {
  try {
    // Check if .env file exists
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env file not found. Please create it first.');
      return;
    }

    console.log('📧 EmailJS Configuration\n');
    console.log('To get these values, follow these steps:');
    console.log('1. Go to https://www.emailjs.com/ and create an account');
    console.log('2. Add a Gmail service for choptime237@gmail.com');
    console.log('3. Create email templates (see EMAILJS_SETUP.md)');
    console.log('4. Get your credentials from the dashboard\n');

    // Get EmailJS credentials
    const serviceId = await question('Enter your EmailJS Service ID: ');
    const userId = await question('Enter your EmailJS Public Key (User ID): ');
    const orderTemplateId = await question('Enter Order Confirmation Template ID (default: order_confirmation): ') || 'order_confirmation';
    const customTemplateId = await question('Enter Custom Order Template ID (default: custom_order): ') || 'custom_order';

    // Read current .env file
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update EmailJS variables
    const updates = {
      'VITE_EMAILJS_SERVICE_ID': serviceId,
      'VITE_EMAILJS_USER_ID': userId,
      'VITE_EMAILJS_ORDER_TEMPLATE_ID': orderTemplateId,
      'VITE_EMAILJS_CUSTOM_TEMPLATE_ID': customTemplateId
    };

    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add to EmailJS section if not found
        const emailjsSection = envContent.indexOf('# EMAILJS CONFIGURATION');
        if (emailjsSection !== -1) {
          const insertIndex = envContent.indexOf('\n', emailjsSection) + 1;
          envContent = envContent.slice(0, insertIndex) + `${key}=${value}\n` + envContent.slice(insertIndex);
        }
      }
    });

    // Write updated .env file
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ EmailJS configuration updated successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Test email sending using the EmailTest component');
    console.log('3. Check your email inbox for test emails');
    console.log('\n📚 For detailed setup instructions, see EMAILJS_SETUP.md');

  } catch (error) {
    console.error('❌ Error setting up EmailJS:', error.message);
  } finally {
    rl.close();
  }
}

// Run setup
setupEmailJS(); 