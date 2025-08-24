import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChopTymData } from '@/hooks/useChopTymData';
import { supabase } from '@/integrations/supabase/client';
import RestaurantInfo from './payment/RestaurantInfo';
import OrderSummary from './payment/OrderSummary';
import MTNMomoPayment from './payment/MTNMomoPayment';
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
  cart: any[];
  subtotal: number;
  total: number;
  customerName: string;
  customerPhone: string;
  location: string;
  deliveryFee: number;
  additionalMessage: string;
}

interface CustomOrder {
  dishName: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  location: string;
  specialInstructions?: string;
  budget?: number;
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
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderReference, setOrderReference] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);
  const [additionalMessage, setAdditionalMessage] = useState('');
  
  const { toast } = useToast();
  const { deliveryFees } = useChopTymData();

  const currentOrder = orderDetails || customOrder;
  const isCustomOrder = !orderDetails && !!customOrder;

  useEffect(() => {
    if (isCustomOrder && selectedRestaurant?.town && deliveryFees.length > 0) {
      calculateDeliveryFee();
    }
  }, [selectedRestaurant?.town, isCustomOrder, deliveryFees]);

  const calculateDeliveryFee = () => {
    if (!selectedRestaurant?.town) return;

    const deliveryInfo = deliveryFees.find(
      df => df.town.toLowerCase() === selectedRestaurant.town.toLowerCase()
    );

    if (deliveryInfo) {
      setDeliveryFee(deliveryInfo.fee);
      setDeliveryZone({
        id: deliveryInfo.id,
        zone_name: `${deliveryInfo.town} Zone`,
        fee: deliveryInfo.fee
      });
    } else {
      setDeliveryFee(1000);
      setDeliveryZone({
        id: `zone-${selectedRestaurant.town}`,
        zone_name: `${selectedRestaurant.town} Zone`,
        fee: 1000
      });
    }
  };

  const generateOrderReference = async (): Promise<string> => {
    if (!selectedRestaurant?.town) {
      return `CHT-${Date.now()}`;
    }
    
    try {
      const { data, error } = await supabase.rpc('generate_order_reference', {
        town_name: selectedRestaurant.town
      });
      
      if (error || !data) {
        return `CHT-${Date.now()}`;
      }
      
      return data;
    } catch (error) {
      console.error('Error generating order reference:', error);
      return `CHT-${Date.now()}`;
    }
  };

  const getOrderTotal = () => {
    if (isCustomOrder && customOrder) {
      return (customOrder.budget || 0) + deliveryFee;
    }
    return orderDetails?.total || 0;
  };

  const getOrderItems = () => {
    if (isCustomOrder && customOrder) {
      return [{
        name: customOrder.dishName,
        quantity: customOrder.quantity,
        price: customOrder.budget || 0,
        description: customOrder.specialInstructions
      }];
    }
    
    if (orderDetails && orderDetails.cart) {
      return orderDetails.cart.map(item => ({
        name: 'dish' in item ? item.dish.name : item.customDishName,
        quantity: item.quantity,
        price: 'dish' in item ? item.price : item.estimatedPrice,
        isCustom: !('dish' in item),
        specialInstructions: 'specialInstructions' in item ? item.specialInstructions : undefined,
        restaurant: item.restaurant.name
      }));
    }
    
    return [];
  };

  const prepareOrderData = async () => {
    const reference = await generateOrderReference();
    setOrderReference(reference);

    const orderData = {
      customer: {
        name: currentOrder?.customerName || '',
        phone: currentOrder?.customerPhone || '',
        email: customerEmail
      },
      delivery_address: currentOrder?.location || '',
      total_amount: getOrderTotal(),
      delivery_fee: isCustomOrder ? deliveryFee : 0,
      restaurant_id: selectedRestaurant?.id,
      restaurant_name: selectedRestaurant?.name,
      order_details: {
        items: getOrderItems(),
        customOrder: isCustomOrder ? customOrder : null,
        additionalMessage: additionalMessage,
        isCustomOrder: isCustomOrder
      }
    };

    return orderData;
  };

  const handleProceedToPayment = async () => {
    if (!currentOrder?.customerName || !currentOrder?.customerPhone || !currentOrder?.location) {
      toast({
        title: "Missing Information",
        description: "Please ensure all required fields are filled.",
        variant: "destructive",
      });
      return;
    }

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await prepareOrderData();
      setShowPayment(true);
    } catch (error) {
      console.error('Error preparing order:', error);
      toast({
        title: "Error",
        description: "Failed to prepare order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    toast({
      title: "Payment Successful!",
      description: "Your order has been confirmed. You will receive a confirmation shortly.",
    });
    
    // Small delay to show success message, then redirect
    setTimeout(() => {
      onOrderComplete();
    }, 2000);
  };

  const handlePaymentFailure = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
    
    // Go back to order form
    setShowPayment(false);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  if (!currentOrder || !selectedRestaurant) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">No order information available</span>
          </div>
        </div>
      </div>
    );
  }

  if (showPayment) {
    const orderData = {
      customer: {
        name: currentOrder.customerName,
        phone: currentOrder.customerPhone,
        email: customerEmail
      },
      delivery_address: currentOrder.location,
      total_amount: getOrderTotal(),
      delivery_fee: isCustomOrder ? deliveryFee : (orderDetails?.deliveryFee || 0),
      restaurant_id: selectedRestaurant.id,
      restaurant_name: selectedRestaurant.name,
      order_details: {
        items: getOrderItems(),
        customOrder: isCustomOrder ? customOrder : null,
        additionalMessage: additionalMessage || (orderDetails?.additionalMessage || ''),
        isCustomOrder: isCustomOrder
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePaymentCancel}
            className="text-choptym-brown hover:bg-choptym-orange/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Order
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <MTNMomoPayment
              amount={getOrderTotal()}
              currency="FCFA"
              orderReference={orderReference}
              customerName={currentOrder.customerName}
              customerPhone={currentOrder.customerPhone}
              customerEmail={customerEmail}
              description={`ChopTym Order - ${selectedRestaurant.name}`}
              orderData={orderData}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
              onCancel={handlePaymentCancel}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Restaurant Information */}
      <RestaurantInfo restaurant={selectedRestaurant} />

      {/* Order Summary */}
      <div className="space-y-4">
        <h3 className="font-semibold text-choptym-brown">Order Summary</h3>
        
        {orderDetails && orderDetails.cart && (
          <div className="space-y-3">
            {orderDetails.cart.map((item, index) => (
              <div key={index} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">
                      {'dish' in item ? item.dish.name : item.customDishName}
                    </h4>
                    <p className="text-sm text-gray-600">From: {item.restaurant.name}</p>
                    {'specialInstructions' in item && item.specialInstructions && (
                      <p className="text-sm text-gray-600 mt-1">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Qty: {item.quantity}</p>
                    <p className="text-sm text-choptym-orange">
                      {(('dish' in item ? item.price : item.estimatedPrice) * item.quantity).toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{orderDetails.subtotal.toLocaleString()} FCFA</span>
              </div>
              {orderDetails.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>{orderDetails.deliveryFee.toLocaleString()} FCFA</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-choptym-orange">
                  <span>Total:</span>
                  <span>{orderDetails.total.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isCustomOrder && customOrder && (
          <OrderSummary
            orderDetails={null}
            customOrder={customOrder}
            deliveryFee={deliveryFee}
            deliveryZone={deliveryZone}
            total={getOrderTotal()}
          />
        )}
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-choptym-brown">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Name</Label>
              <Input
                id="customerName"
                value={currentOrder.customerName}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                value={currentOrder.customerPhone}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="customerEmail">Email (Optional)</Label>
            <Input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="deliveryAddress">Delivery Address</Label>
            <Input
              id="deliveryAddress"
              value={currentOrder.location}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="additionalMessage">Additional Message (Optional)</Label>
            <textarea
              id="additionalMessage"
              value={additionalMessage}
              onChange={(e) => setAdditionalMessage(e.target.value)}
              placeholder="Any special instructions for your order..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-choptym-orange focus:border-transparent"
              rows={3}
            />
            {orderDetails?.additionalMessage && (
              <p className="text-sm text-gray-600 mt-1">
                Previous note: {orderDetails.additionalMessage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Actions */}
      <div className="space-y-4">
        <div className="bg-choptym-orange/10 border border-choptym-orange/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-choptym-brown">Total Amount</p>
              <p className="text-2xl font-bold text-choptym-orange">{getOrderTotal()} FCFA</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-medium text-choptym-brown">MTN MoMo Only</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex-1"
          >
            Back to Menu
          </Button>
          <Button 
            onClick={handleProceedToPayment}
            disabled={loading}
            className="flex-1 bg-choptym-orange hover:bg-choptym-orange/90"
          >
            {loading ? 'Preparing...' : 'Pay with MTN MoMo'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;