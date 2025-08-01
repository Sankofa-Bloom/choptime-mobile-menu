import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import emailjs from '@emailjs/browser'

// Initialize EmailJS
emailjs.init(import.meta.env.VITE_EMAILJS_USER_ID || 'default_user')

createRoot(document.getElementById("root")!).render(<App />);
