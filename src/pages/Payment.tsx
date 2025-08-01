import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CreditCard, Smartphone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FapshiPayment from '@/components/payment/FapshiPayment';
import { supabase } from '@/integrations/supabase/client';
import { sendOrderConfirmation, sendAdminNotification, sendCustomEmail } from '@/utils/genericEmailService';

interface OrderData {
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  cart: any[];
  total: number;
  deliveryFee: number;
  additionalMessage: string;
  town?: string;
}

const Payment: React.FC = () => {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [showFapshiPayment, setShowFapshiPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load order data from localStorage
    const savedOrder = localStorage.getItem('pendingOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        setOrderData(parsedOrder);
      } catch (error) {
        console.error('Error parsing order data:', error);
        toast({
          title: "Error",
          description: "Failed to load order data. Please try again.",
          variant: "destructive"
        });
        navigate('/');
      }
    } else {
      toast({
        title: "No Order Found",
        description: "Please add items to your cart and try again.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [navigate, toast]);

  const handleBack = () => {
    navigate('/');
  };

  const generateOrderReference = async (): Promise<string> => {
    try {
      // Get town from orderData or localStorage
      const town = orderData?.town || localStorage.getItem('kwatalink-town') || 'BUE';
      
      // Create town-specific prefix
      const townPrefix = town.toUpperCase().substring(0, 3);
      
      // Generate a 5-digit number (00001 to 99999)
      const orderNumber = Math.floor(Math.random() * 99999) + 1;
      const paddedNumber = orderNumber.toString().padStart(5, '0');
      
      const orderReference = `CHP-${townPrefix}-${paddedNumber}`;
      
      console.log('Generated order reference:', orderReference, 'for town:', town);
      
      return orderReference;
    } catch (error) {
      console.error('Error generating order reference:', error);
      const fallbackNumber = Math.floor(Math.random() * 99999) + 1;
      return `CHP-UNK-${fallbackNumber.toString().padStart(5, '0')}`;
    }
  };

  const saveOrder = async () => {
    if (!orderData) return null;

    try {
      const orderReference = await generateOrderReference();
      const fullPhone = `+237${orderData.customerPhone.replace(/\D/g, '')}`;
      
      // Save orders to database
      for (const item of orderData.cart) {
        if ('dish' in item) {
          const orderDataToSave = {
            user_name: orderData.customerName,
            user_phone: fullPhone,
            user_location: orderData.customerLocation,
            dish_name: item.dish.name,
            restaurant_name: item.restaurant.name,
            restaurant_id: item.restaurant.id,
            dish_id: item.dish.id,
            quantity: item.quantity,
            price: item.price,
            total_amount: orderData.total,
            order_reference: orderReference,
            status: 'pending'
          };
          
          const { error } = await supabase
            .from('orders')
            .insert(orderDataToSave);
            
          if (error) throw error;
        } else {
          const customOrderData = {
            user_name: orderData.customerName,
            user_phone: fullPhone,
            user_location: orderData.customerLocation,
            custom_dish_name: item.customDishName,
            restaurant_name: item.restaurant.name,
            restaurant_id: item.restaurant.id,
            quantity: item.quantity,
            special_instructions: item.specialInstructions,
            estimated_price: item.estimatedPrice,
            total_amount: orderData.total,
            order_reference: orderReference,
            status: 'pending'
          };
          
          const { error } = await supabase
            .from('custom_orders')
            .insert(customOrderData);
            
          if (error) throw error;
        }
      }

      return { order_reference: orderReference };
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  };

  const handleFapshiPaymentSuccess = async (paymentData: any) => {
    try {
      // Prevent multiple executions with component state and localStorage
      if (paymentProcessed) {
        console.log('Payment already processed in component state');
        return;
      }
      
      const processingKey = `paymentProcessing_${paymentData.reference}`;
      const globalProcessingKey = 'globalPaymentProcessing';
      
      if (localStorage.getItem(processingKey) || localStorage.getItem(globalProcessingKey)) {
        console.log('Payment already being processed for reference:', paymentData.reference);
        return;
      }
      
      // Set processing flags and component state
      setPaymentProcessed(true);
      localStorage.setItem(processingKey, 'true');
      localStorage.setItem(globalProcessingKey, 'true');
      console.log('Starting payment processing for reference:', paymentData.reference);
      
      // Generate order reference if not already saved
      let orderReference = '';
      
      // Check if we already have a saved order reference
      const existingOrderRef = localStorage.getItem('currentOrderReference');
      if (existingOrderRef) {
        orderReference = existingOrderRef;
      } else {
        // Save order and get reference
        const savedOrder = await saveOrder();
        if (savedOrder) {
          orderReference = savedOrder.order_reference;
          // Store the reference for future use
          localStorage.setItem('currentOrderReference', orderReference);
        }
      }
      
      if (orderReference) {
        // Update orders status to confirmed
        try {
          const { error: ordersError } = await supabase
            .from('orders')
            .update({
              status: 'confirmed'
            })
            .eq('order_reference', orderReference);

          if (ordersError) {
            console.warn('Error updating orders:', ordersError);
          }
        } catch (updateError) {
          console.warn('Error updating orders:', updateError);
        }

        // Update custom orders status to confirmed
        try {
          const { error: customOrdersError } = await supabase
            .from('custom_orders')
            .update({
              status: 'confirmed'
            })
            .eq('order_reference', orderReference);

          if (customOrdersError) {
            console.warn('Error updating custom orders:', customOrdersError);
          }
        } catch (updateError) {
          console.warn('Error updating custom orders:', updateError);
        }

        // Try to save payment record to payments table (if it exists)
        try {
          const paymentRecord = {
            order_reference: orderReference,
            payment_reference: paymentData.reference,
            payment_method: 'fapshi',
            payment_status: 'paid',
            amount: orderData?.total || 0,
            currency: 'XAF',
            customer_name: orderData?.customerName || '',
            customer_phone: orderData?.customerPhone || '',
            customer_email: customerEmail,
            created_at: new Date().toISOString()
          };

          const { error: paymentError } = await supabase
            .from('payments')
            .insert(paymentRecord);

          if (paymentError) {
            console.warn('Payments table not available or error saving payment record:', paymentError);
            // Continue without saving to payments table
          } else {
            console.log('Payment record saved successfully');
          }
        } catch (paymentError) {
          console.warn('Payments table not available:', paymentError);
          // Continue without saving to payments table
        }

        // Send email notification to admin
        try {
          const firstItem = orderData?.cart[0];
          if (firstItem) {
            if ('dish' in firstItem) {
              // Regular order - send admin notification
              await sendAdminNotification({
                order_reference: orderReference,
                customer_name: orderData!.customerName,
                customer_email: customerEmail,
                customer_phone: orderData!.customerPhone,
                order_total: `${orderData!.total} FCFA`
              });
            } else {
              // Custom order - send admin notification
              await sendAdminNotification({
                order_reference: orderReference,
                customer_name: orderData!.customerName,
                customer_email: customerEmail,
                customer_phone: orderData!.customerPhone,
                order_total: 'Custom order - pricing to be determined'
              });
            }
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail the payment success if email fails
        }

        // Clear localStorage
        localStorage.removeItem('pendingOrder');
        localStorage.removeItem('currentOrderReference');
        localStorage.removeItem(processingKey);
        localStorage.removeItem(globalProcessingKey);
        
        // Navigate to homepage instead of payment-success
        navigate('/', { 
          state: { 
            orderReference: orderReference,
            paymentReference: paymentData.reference,
            paymentSuccess: true
          } 
        });
      }
    } catch (error) {
      console.error('Error processing payment success:', error);
      localStorage.removeItem(processingKey);
      localStorage.removeItem(globalProcessingKey);
      toast({
        title: "Order Update Failed",
        description: "Payment was successful but there was an error updating your order. Please contact support.",
        variant: "destructive"
      });
    }
  };

  const handleFapshiPaymentFailure = (error: string) => {
    console.error('Fapshi payment failed:', error);
    setShowFapshiPayment(false);
    
    toast({
      title: "Payment Failed",
      description: error || "Payment was not completed. Please try again.",
      variant: "destructive"
    });
  };

  const handleFapshiPaymentCancel = () => {
    setShowFapshiPayment(false);
  };

  const handleSubmitOrder = async () => {
    if (!orderData) return;

    // Validate email
    if (!customerEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to receive order confirmation.",
        variant: "destructive"
      });
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Initialize Fapshi payment
    setShowFapshiPayment(true);
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-choptime-orange mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show Fapshi payment component if selected
  if (showFapshiPayment) {
    const firstItem = orderData.cart[0];
    const dishName = 'dish' in firstItem ? firstItem.dish.name : firstItem.customDishName;
    const restaurantName = firstItem.restaurant.name;
    
    return (
      <FapshiPayment
        amount={orderData.total}
        currency="XAF"
        orderReference={`CHT-${Date.now()}`}
        customerName={orderData.customerName}
        customerPhone={orderData.customerPhone}
        customerEmail={customerEmail}
        description={`KwataLink Order - ${restaurantName} - ${dishName}`}
        onPaymentSuccess={handleFapshiPaymentSuccess}
        onPaymentFailure={handleFapshiPaymentFailure}
        onCancel={handleFapshiPaymentCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Cart
              </Button>
              <CardTitle className="flex items-center gap-2 text-choptime-brown">
                <CreditCard className="w-5 h-5" />
                Complete Payment
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{orderData.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>+237 {orderData.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span>{orderData.customerLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{orderData.cart.length} item(s)</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{orderData.total.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* Payment Method Info */}
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Secure Online Payment</p>
                <p className="text-sm">
                  You'll be redirected to a secure payment page where you can choose between MTN MoMo and Orange Money. 
                  Your payment will be processed securely and you'll receive instant confirmation.
                </p>
              </AlertDescription>
            </Alert>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email Address *</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="your.email@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
              />
              <p className="text-xs text-gray-600">
                We'll send your order confirmation and updates to this email address
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitOrder}
                disabled={loading || !customerEmail.trim()}
                className="flex-1 choptime-gradient hover:opacity-90 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment; 