import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Production-ready app initialization
createRoot(document.getElementById("root")!).render(<App />);
