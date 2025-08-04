import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderReference, setOrderReference] = useState<string>('');

  useEffect(() => {
    // Get order reference from URL parameters or localStorage
    const urlParams = new URLSearchParams(location.search);
    const reference = urlParams.get('reference') || localStorage.getItem('lastOrderReference');
    
    if (reference) {
      setOrderReference(reference);
      localStorage.removeItem('lastOrderReference'); // Clean up
      
      // Show success toast
      toast({
        title: "Payment Successful! 🎉",
        description: `Your order (${reference}) has been confirmed. We'll notify you when it's ready for delivery.`,
        variant: "default",
      });
    }
  }, [location, toast]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleNewOrder = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Thank you for your order! Your payment has been processed successfully.
            </p>
            {orderReference && (
              <p className="text-sm text-gray-500">
                Order Reference: <span className="font-mono">{orderReference}</span>
              </p>
            )}
            <p className="text-sm text-gray-600">
              We'll send you an email confirmation and notify you when your order is ready for delivery.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleNewOrder}
              className="w-full"
              size="lg"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Place Another Order
            </Button>
            
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact us at{' '}
                      <a href="mailto:support@choptime.com" className="text-choptime-orange hover:underline">
          support@choptime.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess; 