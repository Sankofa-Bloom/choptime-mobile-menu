import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateWhatsAppMessage, generateCustomOrderWhatsAppMessage, openWhatsApp } from '@/utils/whatsappUtils';
import WhatsAppFallbackModal from './WhatsAppFallbackModal';
import RestaurantInfo from './payment/RestaurantInfo';
import OrderSummary from './payment/OrderSummary';
import PaymentMethodSelector from './payment/PaymentMethodSelector';

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
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'momo'>('whatsapp');
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackModalData, setFallbackModalData] = useState<{phone: string, message: string}>({phone: '', message: ''});
  const { toast } = useToast();

  const currentOrder = orderDetails || customOrder;
  const isCustomOrder = !orderDetails && !!customOrder;

  // Get admin phone from environment variables and ensure it's a string
  const adminPhone = String(import.meta.env.VITE_ADMIN_PHONE || '237670416449');

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

  const handleWhatsAppOrder = () => {
    if (selectedRestaurant && orderDetails) {
      const message = generateWhatsAppMessage(
        orderDetails.dishName,
        orderDetails.quantity,
        orderDetails.price,
        deliveryFee,
        orderDetails.total,
        orderDetails.customerName,
        orderDetails.customerPhone,
        orderDetails.location,
        selectedRestaurant.name
      );

      openWhatsApp(
        adminPhone,
        message,
        (phone, msg) => {
          setFallbackModalData({ phone, message: msg });
          setShowFallbackModal(true);
        }
      );
    }
  };

  const handleCustomWhatsAppOrder = () => {
    if (selectedRestaurant && customOrder) {
      const message = generateCustomOrderWhatsAppMessage(
        customOrder.dishName,
        customOrder.quantity,
        customOrder.customerName,
        customOrder.customerPhone,
        customOrder.location,
        selectedRestaurant.name,
        customOrder.specialInstructions
      );

      openWhatsApp(
        adminPhone,
        message,
        (phone, msg) => {
          setFallbackModalData({ phone, message: msg });
          setShowFallbackModal(true);
        }
      );
    }
  };

  const handleSubmitOrder = async () => {
    if (!currentOrder || !selectedRestaurant) return;

    setLoading(true);
    try {
      await saveOrder();
      
      if (paymentMethod === 'whatsapp') {
        if (isCustomOrder) {
          handleCustomWhatsAppOrder();
        } else {
          handleWhatsAppOrder();
        }
      }

      toast({
        title: "Order Submitted!",
        description: "Your order has been sent to the restaurant. You'll receive confirmation shortly.",
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
            adminPhone={adminPhone}
          />

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
              disabled={loading || (paymentMethod === 'momo' && !momoNumber.trim())}
              className="flex-1 choptime-gradient hover:opacity-90 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  {paymentMethod === 'whatsapp' ? (
                    <>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      Send via WhatsApp
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Submit Order
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <WhatsAppFallbackModal
        isOpen={showFallbackModal}
        onClose={() => setShowFallbackModal(false)}
        phone={fallbackModalData.phone}
        message={fallbackModalData.message}
      />
    </>
  );
};

export default PaymentDetails;
