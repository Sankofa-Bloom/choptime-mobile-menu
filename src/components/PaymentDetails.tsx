
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, User, MessageCircle } from 'lucide-react';
import { OrderItem, CustomOrderItem } from '@/types/restaurant';
import { generateWhatsAppMessage, generateCustomOrderWhatsAppMessage, openWhatsApp } from '@/utils/whatsappUtils';
import { useToast } from '@/components/ui/use-toast';

interface PaymentDetailsProps {
  orderItems: OrderItem[];
  customOrderItems: CustomOrderItem[];
  onOrderSubmit: (orderData: any) => void;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  orderItems,
  customOrderItems,
  onOrderSubmit
}) => {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
                     customOrderItems.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Process regular orders
      for (const item of orderItems) {
        const restaurantPhone = item.restaurant.mtn_number || item.restaurant.contact_number;
        
        if (!restaurantPhone) {
          toast({
            title: "Error",
            description: `No contact number found for ${item.restaurant.name}`,
            variant: "destructive"
          });
          continue;
        }

        const orderData = {
          user_name: customerInfo.name,
          user_phone: customerInfo.phone,
          user_location: customerInfo.location,
          dish_name: item.dish.name,
          restaurant_name: item.restaurant.name,
          restaurant_id: item.restaurant.id,
          dish_id: item.dish.id,
          quantity: item.quantity,
          price: item.price,
          total_amount: item.price * item.quantity
        };

        // Submit order to database
        await onOrderSubmit(orderData);

        // Generate WhatsApp message
        const whatsappMessage = generateWhatsAppMessage(
          customerInfo.name,
          customerInfo.phone,
          customerInfo.location,
          item.dish.name,
          item.restaurant.name,
          item.quantity,
          item.price,
          item.price * item.quantity
        );

        // Open WhatsApp
        openWhatsApp(restaurantPhone, whatsappMessage);
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Process custom orders
      for (const item of customOrderItems) {
        const restaurantPhone = item.restaurant.mtn_number || item.restaurant.contact_number;
        
        if (!restaurantPhone) {
          toast({
            title: "Error",
            description: `No contact number found for ${item.restaurant.name}`,
            variant: "destructive"
          });
          continue;
        }

        const customOrderData = {
          user_name: customerInfo.name,
          user_phone: customerInfo.phone,
          user_location: customerInfo.location,
          custom_dish_name: item.customDishName,
          restaurant_name: item.restaurant.name,
          restaurant_id: item.restaurant.id,
          quantity: item.quantity,
          estimated_price: item.estimatedPrice,
          total_amount: item.estimatedPrice * item.quantity,
          special_instructions: item.specialInstructions
        };

        // Submit custom order to database
        await onOrderSubmit(customOrderData);

        // Generate WhatsApp message
        const whatsappMessage = generateCustomOrderWhatsAppMessage(
          customerInfo.name,
          customerInfo.phone,
          customerInfo.location,
          item.customDishName,
          item.restaurant.name,
          item.quantity,
          item.specialInstructions
        );

        // Open WhatsApp
        openWhatsApp(restaurantPhone, whatsappMessage);
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast({
        title: "Orders Submitted!",
        description: "Your orders have been submitted and WhatsApp messages sent to restaurants.",
      });

      // Reset form
      setCustomerInfo({ name: '', phone: '', location: '' });
      
    } catch (error) {
      console.error('Error submitting orders:', error);
      toast({
        title: "Error",
        description: "There was an error submitting your orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderItems.length === 0 && customOrderItems.length === 0) {
    return (
      <Card className="choptime-shadow">
        <CardContent className="p-6 text-center">
          <p className="text-choptime-brown/70">Your cart is empty. Add some delicious items to continue!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="choptime-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-choptime-brown">
          <MessageCircle className="w-5 h-5" />
          Order Details & Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="space-y-4">
          <h3 className="font-semibold text-choptime-brown">Order Summary</h3>
          
          {/* Regular Orders */}
          {orderItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">{item.dish.name}</p>
                <p className="text-sm text-gray-600">{item.restaurant.name} × {item.quantity}</p>
              </div>
              <p className="font-medium">{(item.price * item.quantity).toLocaleString()} FCFA</p>
            </div>
          ))}

          {/* Custom Orders */}
          {customOrderItems.map((item, index) => (
            <div key={`custom-${index}`} className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">{item.customDishName} (Custom)</p>
                <p className="text-sm text-gray-600">{item.restaurant.name} × {item.quantity}</p>
                {item.specialInstructions && (
                  <p className="text-xs text-gray-500">Note: {item.specialInstructions}</p>
                )}
              </div>
              <p className="font-medium">{(item.estimatedPrice * item.quantity).toLocaleString()} FCFA</p>
            </div>
          ))}

          <div className="flex justify-between items-center pt-4 border-t-2 border-choptime-orange">
            <p className="text-lg font-bold text-choptime-brown">Total:</p>
            <p className="text-lg font-bold text-choptime-orange">{totalAmount.toLocaleString()} FCFA</p>
          </div>
        </div>

        {/* Customer Information Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-semibold text-choptime-brown">Your Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name *
            </Label>
            <Input
              id="name"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="e.g., +237 6 70 12 34 56"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Delivery Location *
            </Label>
            <Textarea
              id="location"
              value={customerInfo.location}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter your complete delivery address with landmarks"
              required
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full choptime-gradient hover:opacity-90 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting Orders...' : 'Submit Orders via WhatsApp'}
          </Button>
        </form>

        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">How it works:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Fill in your details and click "Submit Orders via WhatsApp"</li>
            <li>WhatsApp will open with your order details pre-filled</li>
            <li>Send the message to the restaurant(s)</li>
            <li>The restaurant will confirm your order and delivery time</li>
            <li>Payment is made directly to the restaurant upon delivery</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentDetails;
