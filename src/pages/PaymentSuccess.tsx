import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '@/utils/serverEmailService';

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderReference, setOrderReference] = useState<string>('');
  const [emailsSent, setEmailsSent] = useState(false);

  useEffect(() => {
    // Get order reference from URL parameters or localStorage
    const urlParams = new URLSearchParams(location.search);
    const reference = urlParams.get('reference') || localStorage.getItem('lastOrderReference');
    
    if (reference) {
      setOrderReference(reference);
      localStorage.removeItem('lastOrderReference'); // Clean up
      
      // Send confirmation emails
      sendConfirmationEmails(reference);
      
      // Show success toast
      toast({
        title: "Payment Successful! 🎉",
        description: `Your order (${reference}) has been confirmed. We'll notify you when it's ready for delivery.`,
        variant: "default",
      });
    }
  }, [location, toast]);

  const sendConfirmationEmails = async (reference: string) => {
    if (emailsSent) return; // Prevent duplicate emails
    
    try {
      // Get order details from localStorage or try to fetch from database
      const orderData = localStorage.getItem(`order_${reference}`);
      let parsedOrderData = null;
      
      if (orderData) {
        try {
          parsedOrderData = JSON.parse(orderData);
        } catch (e) {
          console.warn('Could not parse order data from localStorage');
        }
      }

      if (parsedOrderData) {
        // Send customer confirmation email
        const customerEmailSent = await sendOrderConfirmationEmail({
          orderReference: reference,
          customerName: parsedOrderData.customerName || 'Customer',
          customerEmail: parsedOrderData.customerEmail || '',
          customerPhone: parsedOrderData.customerPhone || '',
          restaurantName: parsedOrderData.restaurantName || 'Restaurant',
          dishName: parsedOrderData.dishName || 'Dish',
          quantity: parsedOrderData.quantity || 1,
          totalAmount: parsedOrderData.totalAmount || '0 FCFA',
          deliveryAddress: parsedOrderData.deliveryAddress || 'Delivery Address'
        });

        // Send admin notification email
        const adminEmailSent = await sendAdminNotificationEmail({
          orderReference: reference,
          customerName: parsedOrderData.customerName || 'Customer',
          customerEmail: parsedOrderData.customerEmail || '',
          customerPhone: parsedOrderData.customerPhone || '',
          restaurantName: parsedOrderData.restaurantName || 'Restaurant',
          dishName: parsedOrderData.dishName || 'Dish',
          quantity: parsedOrderData.quantity || 1,
          totalAmount: parsedOrderData.totalAmount || '0 FCFA',
          deliveryAddress: parsedOrderData.deliveryAddress || 'Delivery Address'
        });

        setEmailsSent(true);
        
        console.log('Email sending results:', {
          customerEmail: customerEmailSent,
          adminEmail: adminEmailSent
        });

        // Show email status in toast
        if (customerEmailSent && adminEmailSent) {
          toast({
            title: "Emails Sent! 📧",
            description: "Order confirmation and admin notification emails have been sent.",
            variant: "default",
          });
        } else if (customerEmailSent) {
          toast({
            title: "Partial Email Success",
            description: "Customer email sent, but admin notification failed.",
            variant: "default",
          });
        } else {
          toast({
            title: "Email Issue",
            description: "Email notifications failed to send. Please contact support.",
            variant: "destructive",
          });
        }
      } else {
        console.warn('No order data found for email sending');
        // Try to send emails with minimal data
        const fallbackEmailSent = await sendOrderConfirmationEmail({
          orderReference: reference,
          customerName: 'Customer',
          customerEmail: '',
          customerPhone: '',
          restaurantName: 'Restaurant',
          dishName: 'Order',
          quantity: 1,
          totalAmount: '0 FCFA',
          deliveryAddress: 'Delivery Address'
        });
        
        if (fallbackEmailSent) {
          setEmailsSent(true);
          toast({
            title: "Order Confirmed! 📧",
            description: "Order confirmation email sent.",
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Error sending confirmation emails:', error);
      toast({
        title: "Email Error",
        description: "Failed to send confirmation emails. Please contact support.",
        variant: "destructive",
      });
    }
  };

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
                      <a href="mailto:support@choptym.com" className="text-choptime-orange hover:underline">
          support@choptym.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess; 