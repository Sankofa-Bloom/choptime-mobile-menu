import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Early debug logging
console.log('🚀 REACT APP STARTING - main.tsx loaded');
console.log('🚀 Environment:', import.meta.env.MODE);
console.log('🚀 Base URL env:', import.meta.env.VITE_API_BASE_URL);

// Global error handlers to prevent crashes
window.addEventListener('error', (event) => {
  console.error('🚨 Global error caught:', event.error);
  // Prevent default error handling that might crash the app
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  // Prevent default error handling that might crash the app
  event.preventDefault();
});

try {
  console.log('🚀 Creating React root...');
  const root = createRoot(document.getElementById("root")!);
  console.log('🚀 Rendering App component...');
  root.render(<App />);
  console.log('🚀 App rendered successfully');
} catch (error) {
  console.error('🚨 CRITICAL ERROR in main.tsx:', error);
  // Show fallback UI instead of crashing
  document.getElementById("root")!.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1>Something went wrong</h1>
      <p>We're sorry, but something unexpected happened. Please try refreshing the page.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Refresh Page
      </button>
    </div>
  `;
}
