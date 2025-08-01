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
    console.warn('EmailJS not initialized: User ID not configured');
  }
} catch (error) {
  console.error('Error initializing EmailJS:', error);
}

createRoot(document.getElementById("root")!).render(<App />);
