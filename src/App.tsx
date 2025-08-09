import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import ThankYou from '@/pages/ThankYou';
import PaymentSuccess from '@/pages/PaymentSuccess';
import WhatsAppButton from '@/components/WhatsAppButton';
import { SplashScreen } from '@/components/SplashScreen';

// App component debug logging
console.log('🚀 APP COMPONENT: Loading App.tsx');
import { Toaster } from '@/components/ui/toaster';

function App() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Check if this is the first time visiting the app
    const hasVisited = localStorage.getItem('choptym_visited');
    
    if (!hasVisited) {
      setShowSplash(true);
      // Mark as visited after showing splash
              localStorage.setItem('choptym_visited', 'true');
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={3000} />;
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dash/login" element={<AdminLogin />} />
        <Route path="/dash/chp-ctrl" element={<AdminDashboard />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Floating WhatsApp Button - appears on all pages */}
      <WhatsAppButton />
      
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
