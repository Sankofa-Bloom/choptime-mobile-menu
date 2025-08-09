import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, ShoppingCart, MessageCircle } from 'lucide-react';
import { OrderItem, CustomOrderItem } from '@/types/restaurant';

interface OrderDetails {
  customerName: string;
  phone: string;
  deliveryAddress: string;
  additionalMessage: string;
  paymentMethod: string;
  total: number;
  deliveryFee: number;
}

interface CartSectionProps {
  cart: (OrderItem | CustomOrderItem)[];
  orderDetails: OrderDetails;
  selectedTown: string;
  onOrderDetailsChange: (details: OrderDetails) => void;
  onQuantityUpdate: (index: number, newQuantity: number) => void;
  onPlaceOrder: () => void;
  calculateSubtotal: () => number;
  calculateTotal: () => number;
}

const CartSection: React.FC<CartSectionProps> = ({
  cart,
  orderDetails,
  selectedTown,
  onOrderDetailsChange,
  onQuantityUpdate,
  onPlaceOrder,
  calculateSubtotal,
  calculateTotal
}) => {
  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const handleInputChange = (field: keyof OrderDetails, value: string | number) => {
    onOrderDetailsChange({
      ...orderDetails,
      [field]: value
    });
  };

  return (
    <section id="cart-section" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
                    <ShoppingCart className="h-8 w-8 text-choptym-orange" />
        <h2 className="text-3xl font-bold text-choptym-brown">Your Order</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Cart Items */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-choptym-brown">Cart Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-choptym-brown">
                          {'dish' in item ? item.dish.name : item.customDishName}
                          {!('dish' in item) && <span className="text-sm text-orange-600"> (Custom)</span>}
                        </h4>
                        <p className="text-sm text-gray-600">From: {item.restaurant.name}</p>
                        {'specialInstructions' in item && item.specialInstructions && (
                          <p className="text-xs text-gray-500 mt-1">Note: {item.specialInstructions}</p>
                        )}
                        <p className="text-sm font-medium text-choptym-orange">
                          {formatPrice(('dish' in item ? item.price : item.estimatedPrice) * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onQuantityUpdate(index, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="mx-2 font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onQuantityUpdate(index, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Order Summary */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatPrice(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery ({selectedTown}):</span>
                      <span>{formatPrice(orderDetails.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-choptym-orange">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Details Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-choptym-brown">Delivery Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={orderDetails.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-gray-50 text-gray-700 text-base select-none">237</span>
                      <Input
                        id="phone"
                        value={orderDetails.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="6XX XXX XXX"
                        required
                        className="flex-1 rounded-l-none"
                        type="tel"
                        pattern="[6][0-9]{8}"
                        maxLength={9}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                    <Textarea
                      id="deliveryAddress"
                      value={orderDetails.deliveryAddress}
                      onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                      placeholder="Enter your complete delivery address"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">Secure Online Payment</span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-600 font-medium">Available Payment Options:</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          MTN Mobile Money
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                          Orange Money
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Moov Money
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                          Card Payment
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Secure online payment through our payment gateway
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="additionalMessage">Additional Message</Label>
                    <Textarea
                      id="additionalMessage"
                      value={orderDetails.additionalMessage}
                      onChange={(e) => handleInputChange('additionalMessage', e.target.value)}
                      placeholder="Any special instructions or notes..."
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={onPlaceOrder}
                    className="w-full choptym-gradient hover:opacity-90 text-white"
                    size="lg"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Complete Order & Pay &rarr;
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    You'll be redirected to our secure payment gateway to complete your payment.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartSection;
