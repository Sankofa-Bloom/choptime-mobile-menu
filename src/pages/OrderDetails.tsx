import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PaymentDetails from '@/components/PaymentDetails';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface OrderDetailsState {
  selectedRestaurant: any;
  orderDetails: any;
  customOrder: any;
  cart: any[];
  selectedTown: string;
}

const OrderDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showInstallPrompt, installPWA, dismissPrompt } = usePWAInstall();
  
  // Extract state from navigation
  const state = location.state as OrderDetailsState;

  useEffect(() => {
    // Redirect to home if no order data is provided
    if (!state || (!state.orderDetails && !state.customOrder) || !state.selectedRestaurant) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  const handleBack = () => {
    // Navigate back to home with cart state preserved
    navigate('/', { 
      state: { 
        preserveCart: true,
        cart: state?.cart || [],
        selectedTown: state?.selectedTown || ''
      } 
    });
  };

  const handleOrderComplete = () => {
    // Navigate to thank you page or success page
    navigate('/thank-you', { replace: true });
  };

  // Show loading or redirect if no valid state
  if (!state || (!state.orderDetails && !state.customOrder) || !state.selectedRestaurant) {
    return (
      <div className="min-h-screen bg-choptym-beige flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-choptym-beige">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 african-pattern"></div>
      </div>

      <Header 
        selectedTown={state.selectedTown}
        cart={state.cart || []}
        cartItemCount={(state.cart || []).reduce((sum: number, item: any) => sum + item.quantity, 0)}
        onTownChange={() => {}} // Disabled on this page
        onCartClick={() => {}} // Disabled on this page
        showPWAPrompt={showInstallPrompt}
        onInstallPWA={installPWA}
        onDismissPWA={dismissPrompt}
      />

      <main className="relative z-10 pt-8 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Page Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4 text-choptym-brown hover:bg-choptym-orange/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
            
            <h1 className="text-2xl font-bold text-choptym-brown mb-2">
              Complete Your Order
            </h1>
            <p className="text-gray-600">
              Review your order details and proceed with payment
            </p>
          </div>

          {/* Payment Details Component - now full page */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-none overflow-y-auto">
              <PaymentDetails
                selectedRestaurant={state.selectedRestaurant}
                orderDetails={state.orderDetails}
                customOrder={state.customOrder}
                onBack={handleBack}
                onOrderComplete={handleOrderComplete}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderDetails;
