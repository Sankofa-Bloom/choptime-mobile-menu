import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import emailjs from '@emailjs/browser'

// Initialize EmailJS with proper error handling
try {
  const userId = import.meta.env.VITE_EMAILJS_USER_ID || 'default_user';
  if (userId !== 'default_user') {
    emailjs.init(userId);
    console.log('EmailJS initialized successfully with user ID:', userId);
  } else {
    console.warn('EmailJS not initialized: User ID not configured - emails will not be sent');
  }
} catch (error) {
  console.warn('EmailJS initialization failed:', error);
}

createRoot(document.getElementById("root")!).render(<App />);
