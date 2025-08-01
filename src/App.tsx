import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import ThankYou from '@/pages/ThankYou';
import PaymentSuccess from '@/pages/PaymentSuccess';
import Payment from '@/pages/Payment';
import Contact from '@/pages/Contact';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/dash/login" element={<AdminLogin />} />
        <Route path="/dash/chp-ctrl" element={<AdminDashboard />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
