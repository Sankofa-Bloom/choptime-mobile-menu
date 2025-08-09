import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ThankYou() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000); // 3 seconds
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-choptym-beige">
      <h1 className="text-3xl font-bold mb-4 text-choptym-brown">Thank you for your order!</h1>
      <p className="text-lg text-choptym-brown">We've received your order and will contact you soon.</p>
    </div>
  );
} 