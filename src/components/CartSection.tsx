
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Package } from 'lucide-react';
import { OrderItem, CustomOrderItem } from '@/types/restaurant';
import PaymentDetails from '@/components/PaymentDetails';

interface CartSectionProps {
  cart: (OrderItem | CustomOrderItem)[];
  orderDetails: any;
  selectedTown: string;
  onOrderDetailsChange: (details: any) => void;
  onQuantityUpdate: (index: number, quantity: number) => void;
  onWhatsAppOrder: () => void;
  calculateSubtotal: () => number;
  calculateTotal: () => number;
}

const CartSection: React.FC<CartSectionProps> = ({
  cart,
  orderDetails,
  selectedTown,
  onOrderDetailsChange,
  onQuantityUpdate,
  onWhatsAppOrder,
  calculateSubtotal,
  calculateTotal
}) => {
  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  return (
    <section id="cart-section" className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <h3 className="text-2xl font-bold text-choptime-brown mb-6">Your Order</h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-choptime-brown mb-4">Cart Items</h4>
            <div className="space-y-4">
              {cart.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {'dish' in item ? (
                        <>
                          <img 
                            src={item.dish.image_url || 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400'} 
                            alt={item.dish.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h5 className="font-semibold text-choptime-brown">{item.dish.name}</h5>
                            <p className="text-xs text-choptime-orange font-medium">{item.restaurant.name}</p>
                            <p className="text-sm text-choptime-brown/70">{formatPrice(item.price)} each</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-choptime-orange/10 rounded flex items-center justify-center">
                            <Package className="w-8 h-8 text-choptime-orange" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-choptime-brown">{item.customDishName}</h5>
                            <p className="text-xs text-choptime-orange font-medium">{item.restaurant.name}</p>
                            <p className="text-sm text-choptime-brown/70">{formatPrice(item.estimatedPrice)} each (Est.)</p>
                            {item.specialInstructions && (
                              <p className="text-xs text-choptime-brown/60 mt-1">📝 {item.specialInstructions}</p>
                            )}
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onQuantityUpdate(index, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onQuantityUpdate(index, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Subtotal:</span>
                <span className="text-choptime-orange font-medium">{formatPrice(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Delivery Fee ({selectedTown}):</span>
                <span className="text-choptime-orange font-medium">{formatPrice(orderDetails.deliveryFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-choptime-orange">{formatPrice(calculateTotal())}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-choptime-brown mb-4">Delivery Details</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={orderDetails.customerName}
                    onChange={(e) => onOrderDetailsChange({...orderDetails, customerName: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="e.g., +237 6XX XXX XXX"
                    value={orderDetails.phone}
                    onChange={(e) => onOrderDetailsChange({...orderDetails, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Delivery Address in {selectedTown} *</Label>
                  <Textarea
                    id="address"
                    placeholder={`Enter your complete delivery address in ${selectedTown} (neighborhood, street, landmarks)`}
                    value={orderDetails.deliveryAddress}
                    onChange={(e) => onOrderDetailsChange({...orderDetails, deliveryAddress: e.target.value})}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="additionalMessage">Additional Message (Optional)</Label>
                  <Textarea
                    id="additionalMessage"
                    placeholder="Any special requests or notes for your order..."
                    value={orderDetails.additionalMessage || ''}
                    onChange={(e) => onOrderDetailsChange({...orderDetails, additionalMessage: e.target.value})}
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="payment">Payment Method *</Label>
                  <Select onValueChange={(value) => onOrderDetailsChange({...orderDetails, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose payment method" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="mtn-money">MTN Mobile Money</SelectItem>
                      <SelectItem value="orange-money">Orange Money</SelectItem>
                      <SelectItem value="pay-on-delivery">Pay on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <PaymentDetails paymentMethod={orderDetails.paymentMethod} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button 
            onClick={onWhatsAppOrder}
            size="lg"
            className="choptime-gradient hover:opacity-90 text-white text-lg px-8 py-3 w-full md:w-auto"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Order via WhatsApp
          </Button>
          <p className="text-sm text-choptime-brown/70 mt-2">
            Your order will be sent to our WhatsApp for confirmation
          </p>
        </div>
      </div>
    </section>
  );
};

export default CartSection;
