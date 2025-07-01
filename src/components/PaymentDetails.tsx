import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  Truck,
  AlertCircle,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateWhatsAppMessage, generateCustomOrderWhatsAppMessage, openWhatsApp } from '@/utils/whatsappUtils';
import WhatsAppFallbackModal from './WhatsAppFallbackModal';

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
        setDeliveryFee(1000); // Default fee
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
        setDeliveryFee(1000); // Default fee if no zone found
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

      // Convert contact_number to string
      const contactNumber = String(selectedRestaurant.contact_number);
      openWhatsApp(
        contactNumber,
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

      // Convert contact_number to string
      const contactNumber = String(selectedRestaurant.contact_number);
      openWhatsApp(
        contactNumber,
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
          {/* Restaurant Info */}
          <div className="bg-choptime-beige/30 p-4 rounded-lg">
            <h3 className="font-semibold text-choptime-brown mb-2">{selectedRestaurant.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {selectedRestaurant.contact_number}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {selectedRestaurant.town}
              </div>
              {selectedRestaurant.delivery_time_min && selectedRestaurant.delivery_time_max && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedRestaurant.delivery_time_min}-{selectedRestaurant.delivery_time_max} mins
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-choptime-brown">Order Details</h3>
            
            <div className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{currentOrder.dishName}</h4>
                  {isCustomOrder && customOrder?.specialInstructions && (
                    <p className="text-sm text-gray-600 mt-1">
                      Special instructions: {customOrder.specialInstructions}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">Qty: {currentOrder.quantity}</Badge>
              </div>
              
              {!isCustomOrder && (
                <div className="flex justify-between text-sm">
                  <span>Price per item:</span>
                  <span>{orderDetails?.price.toLocaleString()} FCFA</span>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {currentOrder.customerName}</p>
                <p><strong>Phone:</strong> {currentOrder.customerPhone}</p>
                <p><strong>Location:</strong> {currentOrder.location}</p>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-choptime-orange" />
              <span className="font-medium">Delivery Information</span>
            </div>
            {deliveryZone && (
              <p className="text-sm text-gray-600">
                Delivery Zone: {deliveryZone.zone_name}
              </p>
            )}
          </div>

          {/* Price Breakdown */}
          {!isCustomOrder && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{subtotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>{deliveryFee.toLocaleString()} FCFA</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-choptime-orange">{total.toLocaleString()} FCFA</span>
              </div>
            </div>
          )}

          {isCustomOrder && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This is a custom order. The restaurant will provide pricing details when they contact you.
                Delivery fee: {deliveryFee.toLocaleString()} FCFA
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-choptime-brown">Order Method</h3>
            
            <div className="grid gap-3">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="whatsapp"
                  checked={paymentMethod === 'whatsapp'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'whatsapp' | 'momo')}
                  className="text-choptime-orange"
                />
                <MessageCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium">WhatsApp Order</div>
                  <div className="text-sm text-gray-600">Send order directly to restaurant via WhatsApp</div>
                </div>
              </label>

              {!isCustomOrder && (
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={paymentMethod === 'momo'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'whatsapp' | 'momo')}
                    className="text-choptime-orange"
                  />
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Mobile Money</div>
                    <div className="text-sm text-gray-600">Pay with MTN or Orange Money</div>
                  </div>
                </label>
              )}
            </div>

            {paymentMethod === 'momo' && !isCustomOrder && (
              <div className="space-y-2">
                <Label htmlFor="momoNumber">Mobile Money Number</Label>
                <Input
                  id="momoNumber"
                  type="tel"
                  placeholder="Enter your mobile money number"
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                />
                <p className="text-xs text-gray-600">
                  You'll receive a payment prompt on your phone
                </p>
              </div>
            )}
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
                      <MessageCircle className="w-4 h-4 mr-2" />
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

          {paymentMethod === 'whatsapp' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your order will be sent directly to the restaurant via WhatsApp. 
                They will confirm availability and arrange payment upon delivery.
              </AlertDescription>
            </Alert>
          )}
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
