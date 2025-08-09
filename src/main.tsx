import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Early debug logging
console.log('🚀 REACT APP STARTING - main.tsx loaded');
console.log('🚀 Environment:', import.meta.env.MODE);
console.log('🚀 Base URL env:', import.meta.env.VITE_API_BASE_URL);

try {
  console.log('🚀 Creating React root...');
  const root = createRoot(document.getElementById("root")!);
  console.log('🚀 Rendering App component...');
  root.render(<App />);
  console.log('🚀 App rendered successfully');
} catch (error) {
  console.error('🚨 CRITICAL ERROR in main.tsx:', error);
}
