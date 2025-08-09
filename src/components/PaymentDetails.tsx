import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertCircle, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '@/utils/serverEmailService';
import { isValidEmail } from '@/utils/emailService';
import { fapshiService } from '@/utils/fapshiService';
import RestaurantInfo from './payment/RestaurantInfo';
import OrderSummary from './payment/OrderSummary';
import PaymentMethodSelector from './payment/PaymentMethodSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Restaurant {
  id: string;
  name: string;
  contact_number: string;
  town: string;
  delivery_time_min?: number;
  delivery_time_max?: number;
}

interface OrderDetails {
  dishName: string;
  quantity: number;
  price: number;
  total: number;
  customerName: string;
  customerPhone: string;
  location: string;
}

interface CustomOrder {
  dishName: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  location: string;
  specialInstructions?: string;
}

interface DeliveryZone {
  id: string;
  zone_name: string;
  fee: number;
}

interface PaymentDetailsProps {
  selectedRestaurant: Restaurant | null;
  orderDetails: OrderDetails | null;
  customOrder: CustomOrder | null;
  onBack: () => void;
  onOrderComplete: () => void;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  selectedRestaurant,
  orderDetails,
  customOrder,
  onBack,
  onOrderComplete
}) => {
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone | null>(null);
  const [loading, setLoading] = useState(false);
  const [momoNumber, setMomoNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'campay' | 'fapshi'>('fapshi');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderReference, setOrderReference] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  

  const { toast } = useToast();

  const currentOrder = orderDetails || customOrder;
  const isCustomOrder = !orderDetails && !!customOrder;

  // Admin email - this should come from server configuration
  const adminEmail: string = 'admin@choptym.com';

  useEffect(() => {
    // Only calculate delivery fee for custom orders
    // Regular orders already have delivery fee included in total
    if (isCustomOrder && currentOrder?.location && selectedRestaurant?.town) {
      calculateDeliveryFee();
    }
  }, [currentOrder?.location, selectedRestaurant?.town, isCustomOrder]);

  const calculateDeliveryFee = async () => {
    if (!currentOrder?.location || !selectedRestaurant?.town) return;

    try {
      const { data, error } = await supabase.rpc('calculate_delivery_fee', {
        town_name: selectedRestaurant.town,
        location_description: currentOrder.location
      });

      if (error) {
        console.error('Error calculating delivery fee:', error);
        setDeliveryFee(1000);
        return;
      }

      if (data && data.length > 0) {
        setDeliveryFee(data[0].fee);
        setDeliveryZone({
          id: data[0].zone_id,
          zone_name: data[0].zone_name,
          fee: data[0].fee
        });
      } else {
        setDeliveryFee(1000);
      }
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      setDeliveryFee(1000);
    }
  };

  const generateOrderReference = async (): Promise<string> => {
    console.log('Generating order reference for town:', selectedRestaurant?.town);
    
    if (!selectedRestaurant?.town) {
      const fallbackRef = `CHT-${Date.now()}`;
      console.log('No town found, using fallback reference:', fallbackRef);
      return fallbackRef;
    }
    
    try {
      const { data, error } = await supabase.rpc('generate_order_reference', {
        town_name: selectedRestaurant.town
      });
      
      if (error || !data) {
        console.error('Error generating order reference:', error);
        const fallbackRef = `CHT-${Date.now()}`;
        console.log('Using fallback reference:', fallbackRef);
        return fallbackRef;
      }
      
      console.log('Generated order reference:', data);
      return data;
    } catch (error) {
      console.error('Error generating order reference:', error);
      const fallbackRef = `CHT-${Date.now()}`;
      console.log('Using fallback reference:', fallbackRef);
      return fallbackRef;
    }
  };

  const saveOrder = async () => {
    console.log('saveOrder called with:', { currentOrder, selectedRestaurant });
    if (!currentOrder || !selectedRestaurant) {
      console.log('Missing currentOrder or selectedRestaurant, returning null');
      return null;
    }

    try {
      console.log('Generating order reference...');
      const orderReference = await generateOrderReference();
      console.log('Generated order reference:', orderReference);
      
      if (isCustomOrder) {
        const customOrderData = currentOrder as CustomOrder;
        const customOrderInsertData: any = {
          custom_dish_name: customOrderData.dishName,
          quantity: customOrderData.quantity,
          restaurant_id: selectedRestaurant.id,
          restaurant_name: selectedRestaurant.name,
          user_name: customOrderData.customerName,
          user_phone: customOrderData.customerPhone,
          user_location: customOrderData.location,
          special_instructions: customOrderData.specialInstructions,
          order_reference: orderReference,
          payment_method: 'campay',
          status: 'pending'
        };
        
        // Only add optional fields if they exist
        if (customerEmail) {
          customOrderInsertData.user_email = customerEmail;
        }
        
        console.log('Sending custom order data:', customOrderInsertData);
        
        const { data, error } = await supabase
          .from('custom_orders')
          .insert(customOrderInsertData)
          .select()
          .single();

        if (error) {
          console.error('Supabase custom order error:', error);
          throw error;
        }
        return data;
      } else {
        const regularOrder = currentOrder as OrderDetails;
        const totalAmount = regularOrder.total + deliveryFee;
        
        const orderData: any = {
          dish_name: regularOrder.dishName,
          quantity: regularOrder.quantity,
          price: Math.round(regularOrder.price),
          total_amount: Math.round(totalAmount),
          restaurant_id: selectedRestaurant.id,
          restaurant_name: selectedRestaurant.name,
          user_name: regularOrder.customerName,
          user_phone: regularOrder.customerPhone,
          user_location: regularOrder.location,
          order_reference: orderReference,
          payment_method: 'campay',
          status: 'pending'
        };
        
        // Only add optional fields if they exist
        if (customerEmail) {
          orderData.user_email = customerEmail;
        }
        if (deliveryZone?.id) {
          orderData.delivery_zone_id = deliveryZone.id;
        }
        
        console.log('Sending order data:', orderData);
        
        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        return data;
      }
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  };

  const handleEmailOrder = async (orderReference: string): Promise<boolean> => {
    if (!selectedRestaurant || !currentOrder) return false;

    try {
      if (isCustomOrder) {
        const customOrderData = currentOrder as CustomOrder;
        
        // For custom orders, we'll use a simple notification for now
        console.log('Custom order email would be sent for:', {
          orderReference,
          customerName: customOrderData.customerName,
          customerEmail: customerEmail,
          restaurantName: selectedRestaurant.name,
          dishName: customOrderData.dishName
        });
        
        // Return true for now - in production, implement custom order email
        return true;
      } else {
        const regularOrder = currentOrder as OrderDetails;
        
        // Send order confirmation email using server-side service
        console.log('Preparing to send order confirmation email with data:', {
          orderReference: orderReference,
          customerName: regularOrder.customerName,
          customerEmail: customerEmail,
          customerPhone: regularOrder.customerPhone,
          restaurantName: selectedRestaurant.name,
          dishName: regularOrder.dishName,
          quantity: regularOrder.quantity,
          totalAmount: `${regularOrder.total + deliveryFee} FCFA`,
          deliveryAddress: regularOrder.location
        });
        
        const emailSent = await sendOrderConfirmationEmail({
          orderReference: orderReference,
          customerName: regularOrder.customerName,
          customerEmail: customerEmail,
          customerPhone: regularOrder.customerPhone,
          restaurantName: selectedRestaurant.name,
          dishName: regularOrder.dishName,
          quantity: regularOrder.quantity,
          totalAmount: `${regularOrder.total + deliveryFee} FCFA`,
          deliveryAddress: regularOrder.location
        });
        
        return emailSent;
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  const handleSubmitOrder = async () => {
    if (!currentOrder || !selectedRestaurant) return;

    // Validate email
    if (!customerEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to receive order confirmation.",
        variant: "destructive"
      });
      return;
    }
    
    if (!isValidEmail(customerEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // For payment processing, save order first then redirect to payment
    if (paymentMethod === 'campay' || paymentMethod === 'fapshi') {
      setLoading(true);
      try {
        console.log('Saving order to database...');
        const savedOrder = await saveOrder();
        console.log('Order saved successfully:', savedOrder);
        
        if (savedOrder) {
          console.log('Order saved successfully, order reference:', savedOrder.order_reference);
          // Store the saved order reference
          const orderRef = savedOrder.order_reference || '';
          setOrderReference(orderRef);
          
          // Save order data to localStorage for email sending in PaymentSuccess page
          if (orderRef) {
            const orderDataForEmail = {
              orderReference: orderRef,
              customerName: isCustomOrder ? (currentOrder as CustomOrder).customerName : (currentOrder as OrderDetails).customerName,
              customerEmail: customerEmail,
              customerPhone: isCustomOrder ? (currentOrder as CustomOrder).customerPhone : (currentOrder as OrderDetails).customerPhone,
              restaurantName: selectedRestaurant.name,
              dishName: isCustomOrder ? (currentOrder as CustomOrder).dishName : (currentOrder as OrderDetails).dishName,
              quantity: isCustomOrder ? 1 : (currentOrder as OrderDetails).quantity,
              totalAmount: `${total} FCFA`,
              deliveryAddress: isCustomOrder ? (currentOrder as CustomOrder).location : (currentOrder as OrderDetails).location
            };
            
            localStorage.setItem(`order_${orderRef}`, JSON.stringify(orderDataForEmail));
            console.log('Order data saved to localStorage for email sending:', orderDataForEmail);
          }
          
          // Initialize payment and get payment URL
          const currentOrderData = currentOrder as OrderDetails;
          
          // Validate required data
          if (!orderRef) {
            throw new Error('Order reference is missing');
          }
          
          if (!selectedRestaurant?.name) {
            throw new Error('Restaurant name is missing');
          }
          
          if (!currentOrderData?.dishName) {
            throw new Error('Dish name is missing');
          }
          
          if (!customerEmail) {
            throw new Error('Customer email is missing');
          }
          
          // Prepare payment data based on payment method
          
          if (paymentMethod === 'campay') {
            // Campay payment logic
            const paymentData = {
              amount: total,
              currency: "XAF",
              reference: orderRef,
              description: `ChopTym Order - ${selectedRestaurant.name} - ${currentOrderData.dishName}`,
              customer: {
                name: currentOrderData.customerName || '',
                phone: currentOrderData.customerPhone || '',
                email: customerEmail
              },
              callback_url: import.meta.env.VITE_CAMPAY_CALLBACK_URL || `http://localhost:3001/api/payment-webhook`,
              return_url: import.meta.env.VITE_CAMPAY_RETURN_URL || `http://localhost:3001/payment-success?reference=${orderRef}`
            };

            console.log('Sending Campay payment initialization request:', paymentData);
            
            const response = await fetch('/api/campay/initialize', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(paymentData)
            });

            console.log('Campay payment initialization response status:', response.status);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Campay payment initialization result:', result);
            
            // Handle Campay response
            if (result.success) {
              console.log('Campay payment initialization successful, checking response data:', result.data);
              if (result.data?.payment_url) {
                // Redirect directly to payment gateway
                console.log('Payment URL found, redirecting to payment gateway');
                setPaymentUrl(result.data.payment_url);
              } else if (result.data?.status === 'success') {
                // Handle immediate success (mock payment)
                await handlePaymentSuccess(result.data, 'campay');
              } else {
                throw new Error(result.error || 'Failed to initialize Campay payment');
              }
            } else {
              throw new Error(result.error || 'Failed to initialize Campay payment');
            }
          } else if (paymentMethod === 'fapshi') {
            // Fapshi payment logic
            const formattedPhone = fapshiService.formatPhoneNumber(currentOrderData.customerPhone || '');
            
            const paymentData = {
              amount: Math.round(total * 100), // Convert to cents for Fapshi
              currency: "XAF",
              reference: orderRef,
              description: `ChopTym Order - ${selectedRestaurant.name} - ${currentOrderData.dishName}`,
              customer: {
                name: currentOrderData.customerName || '',
                phone: formattedPhone,
                email: customerEmail
              },
              // Callback URLs are handled server-side
            };

            console.log('Sending Fapshi payment initialization request:', paymentData);
            
            const result = await fapshiService.initializePayment(paymentData);
            console.log('Fapshi payment initialization result:', result);
            
            if (result.success && result.data) {
              console.log('Fapshi payment initialization successful:', result.data);
              if (result.data.payment_url) {
                // Redirect to Fapshi payment gateway
                console.log('Fapshi payment URL found, redirecting to payment gateway');
                setPaymentUrl(result.data.payment_url);
              } else {
                throw new Error('No payment URL received from Fapshi');
              }
            } else {
              throw new Error(result.error || 'Failed to initialize Fapshi payment');
            }
          }


        }
      } catch (error) {
        console.error('Error processing payment:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          error: error
        });
        toast({
          title: "Payment Error",
          description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // This should not happen since we support Campay and Fapshi
    toast({
      title: "Payment Method Error",
      description: "Please select a valid payment method (Campay or Fapshi).",
      variant: "destructive"
    });
  };

  const getOrderSuccessMessage = () => {
    return "Your order has been submitted successfully! Please complete your payment to confirm your order.";
  };



  const handlePaymentSuccess = async (paymentData: any, paymentMethod: string) => {
    console.log('Mock payment success detected, proceeding with email sending');
    console.log('Payment successful:', paymentData);
    
    console.log('About to update order in database...');
    
    // Update the order with payment information
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_reference: paymentData.reference,
        payment_method: paymentMethod,
        status: 'confirmed'
      })
      .eq('order_reference', orderReference);

    // Send confirmation email to customer
    let emailSent = false;
    let adminEmailSent = false;
    
    try {
      console.log('Sending order confirmation email...');
      emailSent = await handleEmailOrder(orderReference);
      console.log('Order confirmation email result:', emailSent);
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
    }
    
    // Send notification to admin
    try {
      console.log('Sending admin notification email...');
      adminEmailSent = await sendAdminNotificationEmailLocal({ order_reference: orderReference });
      console.log('Admin notification email result:', adminEmailSent);
    } catch (adminEmailError) {
      console.error('Error sending admin notification email:', adminEmailError);
    }

    // Store order reference for success page
    localStorage.setItem('lastOrderReference', orderReference);

    // Show email status in toast
    if (emailSent && adminEmailSent) {
      toast({
        title: "Payment Successful!",
        description: "Your order has been confirmed and confirmation emails sent.",
      });
    } else if (emailSent) {
      toast({
        title: "Payment Successful!",
        description: "Your order has been confirmed. Customer email sent, admin notification failed.",
      });
    } else {
      toast({
        title: "Payment Successful!",
        description: "Your order has been confirmed. Email notifications failed to send.",
      });
    }

    // Navigate to success page
    window.location.href = `/payment-success?reference=${orderReference}`;
  };

  const sendAdminNotificationEmailLocal = async (savedOrder: any): Promise<boolean> => {
    try {
      if (isCustomOrder) {
        const customOrderData = currentOrder as CustomOrder;
        
        // For custom orders, log the notification for now
        console.log('Admin notification would be sent for custom order:', {
          orderReference: savedOrder.order_reference || '',
          customerName: customOrderData.customerName,
          customerEmail: customerEmail,
          customerPhone: customOrderData.customerPhone,
          orderTotal: 'Custom order - pricing to be determined'
        });
        
        return true; // Return true for now
      } else {
        const regularOrder = currentOrder as OrderDetails;
        
        // Send admin notification using server-side service
        console.log('Preparing to send admin notification email with data:', {
          orderReference: savedOrder.order_reference || '',
          customerName: regularOrder.customerName,
          customerEmail: customerEmail,
          customerPhone: regularOrder.customerPhone,
          restaurantName: selectedRestaurant?.name || '',
          dishName: regularOrder.dishName,
          quantity: regularOrder.quantity,
          totalAmount: `${regularOrder.total + deliveryFee} FCFA`,
          deliveryAddress: regularOrder.location
        });
        
        const emailSent = await sendAdminNotificationEmail({
          orderReference: savedOrder.order_reference || '',
          customerName: regularOrder.customerName,
          customerEmail: customerEmail,
          customerPhone: regularOrder.customerPhone,
          restaurantName: selectedRestaurant?.name || '',
          dishName: regularOrder.dishName,
          quantity: regularOrder.quantity,
          totalAmount: `${regularOrder.total + deliveryFee} FCFA`,
          deliveryAddress: regularOrder.location
        });
        
        return emailSent;
      }
    } catch (error) {
      console.error('Error sending admin notification:', error);
      return false;
    }
  };

  if (!currentOrder || !selectedRestaurant) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">No order details found</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </CardContent>
      </Card>
    );
  }

    // For regular orders, the total already includes delivery fee from cart
    // For custom orders, we need to add delivery fee
    const subtotal = isCustomOrder ? 0 : (orderDetails?.price || 0);
    const total = isCustomOrder ? (subtotal + deliveryFee) : (orderDetails?.total || 0);

  // Show Campay payment component if selected
  // Redirect to payment gateway if payment URL is available
  if (paymentUrl) {
    window.location.href = paymentUrl;
    return (
      <div className="max-w-md mx-auto text-center">
        <Card>
          <CardContent className="p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-choptym-orange mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to payment gateway...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

 

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-choptym-brown">
            <CreditCard className="w-5 h-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RestaurantInfo restaurant={selectedRestaurant} />
          
          <OrderSummary
            currentOrder={currentOrder}
            isCustomOrder={isCustomOrder}
            deliveryZone={deliveryZone}
            deliveryFee={deliveryFee}
            subtotal={subtotal}
            total={total}
          />

          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isCustomOrder={isCustomOrder}
            momoNumber={momoNumber}
            setMomoNumber={setMomoNumber}
            adminEmail={adminEmail}
          />

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-sm text-gray-600">
              We'll send your order confirmation to this email address
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
              disabled={loading}
            >
              Back
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={loading || !customerEmail.trim()}
              className="flex-1 choptym-gradient hover:opacity-90 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Complete Order & Pay
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>


    </>
  );
};

export default PaymentDetails;
