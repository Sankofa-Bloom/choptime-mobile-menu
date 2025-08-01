import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertCircle, Smartphone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sendOrderConfirmation, sendAdminNotification, sendCustomEmail } from '@/utils/genericEmailService';
import { isValidEmail } from '@/utils/emailService';
import RestaurantInfo from './payment/RestaurantInfo';
import OrderSummary from './payment/OrderSummary';
import PaymentMethodSelector from './payment/PaymentMethodSelector';
import CampayPayment from './payment/CampayPayment';
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
  const [paymentMethod, setPaymentMethod] = useState<'email' | 'cash' | 'momo' | 'campay'>('campay');
  const [customerEmail, setCustomerEmail] = useState('');
  const [showCampayPayment, setShowCampayPayment] = useState(false);
  

  const { toast } = useToast();

  const currentOrder = orderDetails || customOrder;
  const isCustomOrder = !orderDetails && !!customOrder;

  // Get admin email from environment variables
  const adminEmail: string = String(import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com');

  useEffect(() => {
    if (currentOrder?.location && selectedRestaurant?.town) {
      calculateDeliveryFee();
    }
  }, [currentOrder?.location, selectedRestaurant?.town]);

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
    if (!selectedRestaurant?.town) return `CHT-${Date.now()}`;
    
    try {
      const { data, error } = await supabase.rpc('generate_order_reference', {
        town_name: selectedRestaurant.town
      });
      
      if (error || !data) {
        console.error('Error generating order reference:', error);
        return `CHT-${Date.now()}`;
      }
      
      return data;
    } catch (error) {
      console.error('Error generating order reference:', error);
      return `CHT-${Date.now()}`;
    }
  };

  const saveOrder = async () => {
    if (!currentOrder || !selectedRestaurant) return null;

    try {
      const orderReference = await generateOrderReference();
      
      if (isCustomOrder) {
        const customOrderData = currentOrder as CustomOrder;
        const { data, error } = await supabase
          .from('custom_orders')
          .insert({
            custom_dish_name: customOrderData.dishName,
            quantity: customOrderData.quantity,
            restaurant_id: selectedRestaurant.id,
            restaurant_name: selectedRestaurant.name,
            user_name: customOrderData.customerName,
            user_phone: customOrderData.customerPhone,
            user_location: customOrderData.location,
            special_instructions: customOrderData.specialInstructions,
            order_reference: orderReference,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const regularOrder = currentOrder as OrderDetails;
        const totalAmount = regularOrder.total + deliveryFee;
        
        const { data, error } = await supabase
          .from('orders')
          .insert({
            dish_name: regularOrder.dishName,
            quantity: regularOrder.quantity,
            price: regularOrder.price,
            total_amount: totalAmount,
            restaurant_id: selectedRestaurant.id,
            restaurant_name: selectedRestaurant.name,
            user_name: regularOrder.customerName,
            user_phone: regularOrder.customerPhone,
            user_location: regularOrder.location,
            delivery_zone_id: deliveryZone?.id,
            order_reference: orderReference,
            momo_number: momoNumber || null,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  };

  const handleEmailOrder = async (orderReference: string) => {
    if (!selectedRestaurant || !currentOrder) return;

    try {
      if (isCustomOrder) {
        const customOrderData = currentOrder as CustomOrder;
        
        // Send custom order email using generic service
        await sendCustomEmail({
          custom_title: 'Custom Order Request - ChopTime',
          custom_message: `A custom order has been placed:
          
Order Reference: ${orderReference}
Customer: ${customOrderData.customerName}
Phone: ${customOrderData.customerPhone}
Email: ${customerEmail}
Location: ${customOrderData.location}

Restaurant: ${selectedRestaurant.name}
Custom Dish: ${customOrderData.dishName}
Quantity: ${customOrderData.quantity}
Special Instructions: ${customOrderData.specialInstructions || 'None'}

Delivery Fee: ${deliveryFee} FCFA
Payment Method: ${paymentMethod}

This is a custom order request. Please review and contact the customer with pricing details.`,
          custom_urgent: '⚡ Custom order requires immediate attention and pricing review.'
        });
      } else {
        const regularOrder = currentOrder as OrderDetails;
        
        // Send order confirmation email using generic service
        await sendOrderConfirmation({
          order_reference: orderReference,
          restaurant_name: selectedRestaurant.name,
          order_date: new Date().toLocaleString(),
          estimated_delivery: '15-30 minutes',
          order_items: [{
            name: regularOrder.dishName,
            quantity: regularOrder.quantity,
            price: `${regularOrder.price} FCFA`
          }],
          order_total: `${regularOrder.total + deliveryFee} FCFA`,
          delivery_address: regularOrder.location,
          customer_phone: regularOrder.customerPhone,
          payment_method: paymentMethod
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw error here, just log it
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

    // Validate mobile money number if selected
    if (paymentMethod === 'momo' && !momoNumber.trim()) {
      toast({
        title: "Mobile Money Number Required",
        description: "Please enter your mobile money number for payment.",
        variant: "destructive"
      });
      return;
    }

          // Handle Campay payment
      if (paymentMethod === 'campay') {
              setShowCampayPayment(true);
      return;
    }

    setLoading(true);
    try {
      const savedOrder = await saveOrder();
      
      if (savedOrder) {
        // Send email to customer
        await handleEmailOrder(savedOrder.order_reference || '');
        
        // Send notification to admin
        await sendAdminNotificationEmail(savedOrder);
      }

      toast({
        title: "Order Submitted!",
        description: getOrderSuccessMessage(),
      });

      onOrderComplete();
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Order Failed",
        description: "There was an error submitting your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrderSuccessMessage = () => {
    switch (paymentMethod) {
      case 'cash':
        return "Your order has been submitted! Pay with cash when your order is delivered.";
      case 'momo':
        return "Your order has been submitted! You'll receive a mobile money payment prompt shortly.";
      case 'email':
        return "Your order has been submitted and sent to the restaurant. You'll receive a confirmation email shortly.";
      default:
        return "Your order has been submitted successfully!";
    }
  };

  const handleCampayPaymentSuccess = async (paymentData: any) => {
    try {
      const savedOrder = await saveOrder();
      
      if (savedOrder) {
        // Update order with payment information
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_reference: paymentData.reference,
            payment_method: 'fapshi',
            status: 'confirmed'
          })
          .eq('order_reference', savedOrder.order_reference);

        // Send confirmation email to customer
        await handleEmailOrder(savedOrder.order_reference || '');
        
        // Send notification to admin
        await sendAdminNotification(savedOrder);
      }

      toast({
        title: "Payment Successful!",
        description: "Your order has been confirmed and payment processed successfully.",
      });

      onOrderComplete();
    } catch (error) {
      console.error('Error processing payment success:', error);
      toast({
        title: "Order Update Failed",
        description: "Payment was successful but there was an error updating your order. Please contact support.",
        variant: "destructive"
      });
    }
  };

  const handleCampayPaymentFailure = (error: string) => {
    console.error('Campay payment failed:', error);
    setShowCampayPayment(false);
    
    toast({
      title: "Payment Failed",
      description: error || "Payment was not completed. Please try again.",
      variant: "destructive"
    });
  };

  const handleCampayPaymentCancel = () => {
    setShowCampayPayment(false);
    // Keep the default payment method as 'campay' when canceling
    // User can manually change it if they want
  };

  const sendAdminNotificationEmail = async (savedOrder: any) => {
    try {
      if (isCustomOrder) {
        const customOrderData = currentOrder as CustomOrder;
        
        // Send admin notification for custom order
        await sendAdminNotification({
          order_reference: savedOrder.order_reference || '',
          customer_name: customOrderData.customerName,
          customer_email: customerEmail,
          customer_phone: customOrderData.customerPhone,
          order_total: 'Custom order - pricing to be determined'
        });
      } else {
        const regularOrder = currentOrder as OrderDetails;
        
        // Send admin notification for regular order
        await sendAdminNotification({
          order_reference: savedOrder.order_reference || '',
          customer_name: regularOrder.customerName,
          customer_email: customerEmail,
          customer_phone: regularOrder.customerPhone,
          order_total: `${regularOrder.total + deliveryFee} FCFA`
        });
      }
      
      console.log('Admin notification sent successfully');
    } catch (error) {
      console.error('Error sending admin notification:', error);
      // Don't throw error here, just log it
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

    const subtotal = isCustomOrder ? 0 : (orderDetails?.total || 0);
  const total = subtotal + deliveryFee;

  // Show Campay payment component if selected
  if (showCampayPayment) {
    const currentOrderData = currentOrder as OrderDetails;
    return (
      <CampayPayment
        amount={total}
        currency="XAF"
        orderReference={currentOrderData?.orderReference || `CHT-${Date.now()}`}
        customerName={currentOrderData?.customerName || ''}
        customerPhone={currentOrderData?.customerPhone || ''}
        customerEmail={customerEmail}
        description={`KwataLink Order - ${selectedRestaurant?.name} - ${currentOrderData?.dishName}`}
        onPaymentSuccess={handleCampayPaymentSuccess}
        onPaymentFailure={handleCampayPaymentFailure}
        onCancel={handleCampayPaymentCancel}
      />
    );
  }

 

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-choptime-brown">
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
              onClick={onBack}
              className="flex-1"
              disabled={loading}
            >
              Back
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={loading || !customerEmail.trim() || (paymentMethod === 'momo' && !momoNumber.trim())}
              className="flex-1 choptime-gradient hover:opacity-90 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  {paymentMethod === 'fapshi' ? (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Pay Now
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Submit Order
                    </>
                  )}
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
