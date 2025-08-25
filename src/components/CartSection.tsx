import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, ShoppingCart, MessageCircle, CreditCard, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { OrderItem, CustomOrderItem } from '@/types/restaurant';
import { useToast } from '@/hooks/use-toast';
import SwychrService from '@/utils/swychrService';

interface OrderDetails {
  customerName: string;
  phone: string;
  deliveryAddress: string;
  additionalMessage: string;
  paymentMethod: string;
  total: number;
  deliveryFee: number;
}

type PaymentStatus = 'idle' | 'creating_link' | 'redirecting' | 'pending' | 'checking' | 'success' | 'failed';

interface CartSectionProps {
  cart: (OrderItem | CustomOrderItem)[];
  orderDetails: OrderDetails;
  selectedTown: string;
  onOrderDetailsChange: (details: OrderDetails) => void;
  onQuantityUpdate: (index: number, newQuantity: number) => void;
  calculateSubtotal: () => number;
  calculateTotal: () => number;
  onOrderComplete?: () => void;
}

const CartSection: React.FC<CartSectionProps> = ({
  cart,
  orderDetails,
  selectedTown,
  onOrderDetailsChange,
  onQuantityUpdate,
  calculateSubtotal,
  calculateTotal,
  onOrderComplete
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [customerEmail, setCustomerEmail] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const { toast } = useToast();

  const swychrService = new SwychrService();

  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Countdown timer for payment timeout
  useEffect(() => {
    if (paymentStatus === 'pending' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && paymentStatus === 'pending') {
      handlePaymentTimeout();
    }
  }, [timeRemaining, paymentStatus]);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (field: keyof OrderDetails, value: string | number) => {
    onOrderDetailsChange({
      ...orderDetails,
      [field]: value
    });
  };

  const handlePaymentTimeout = () => {
    setPaymentStatus('failed');
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    toast({
      title: "Payment Timeout",
      description: "Payment took too long to complete. Please try again.",
      variant: "destructive"
    });
  };

  const validateOrderDetails = (): boolean => {
    if (!orderDetails.customerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your full name.",
        variant: "destructive"
      });
      return false;
    }

    if (!orderDetails.phone.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please enter your phone number.",
        variant: "destructive"
      });
      return false;
    }

    if (!orderDetails.deliveryAddress.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your delivery address.",
        variant: "destructive"
      });
      return false;
    }

    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const generateOrderReference = () => {
    const timestamp = Date.now();
    const townCode = selectedTown.slice(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${townCode}-${timestamp}-${random}`;
  };

  const handleInitiatePayment = async () => {
    if (!validateOrderDetails()) return;

    try {
      setPaymentStatus('creating_link');
      
      const orderReference = generateOrderReference();
      const txId = swychrService.generateTransactionId(orderReference);
      setTransactionId(txId);

      const formattedPhone = swychrService.formatPhoneNumber(`237${orderDetails.phone}`);
      
      const orderData = {
        cart: cart,
        subtotal: calculateSubtotal(),
        total: calculateTotal(),
        customerName: orderDetails.customerName,
        customerPhone: orderDetails.phone,
        customerEmail: customerEmail,
        location: `${selectedTown}, ${orderDetails.deliveryAddress}`,
        deliveryFee: orderDetails.deliveryFee,
        additionalMessage: orderDetails.additionalMessage,
        orderReference: orderReference
      };

      const paymentData = {
        country_code: 'CM',
        name: orderDetails.customerName,
        email: customerEmail,
        mobile: formattedPhone,
        amount: calculateTotal(),
        transaction_id: txId,
        description: `ChopTym Order - ${orderReference}`,
        pass_digital_charge: true
      };

      // Store payment record (non-blocking)
      swychrService.storePaymentRecord(orderData, txId).catch(error => {
        console.warn('Payment record storage failed (non-critical):', error);
      });

      const response = await swychrService.createPaymentLink(paymentData);

      if (response.success && response.data?.payment_link) {
        setPaymentLink(response.data.payment_link);
        
        toast({
          title: "🚀 Instant Payment Ready!",
          description: "Opening secure payment window...",
        });

        // Immediate redirect for faster experience
        setTimeout(() => {
          window.open(response.data.payment_link, '_blank');
          setPaymentStatus('pending');
          setTimeRemaining(600);
          startStatusPolling(txId);
        }, 500); // Reduced delay from 2000ms to 500ms
        
      } else {
        throw new Error(response.error || 'Failed to create payment link');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      setPaymentStatus('failed');
      
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Please check your details and try again.",
        variant: "destructive"
      });
    }
  };

  const startStatusPolling = (txId: string) => {
    const interval = setInterval(async () => {
      try {
        setPaymentStatus('checking');
        const statusResponse = await swychrService.checkPaymentStatus(txId);
        
        if (statusResponse.success && statusResponse.data) {
          const status = statusResponse.data.status?.toLowerCase();
          
          if (status === 'completed' || status === 'successful' || status === 'success') {
            setPaymentStatus('success');
            clearInterval(interval);
            setStatusCheckInterval(null);
            
            toast({
              title: "Payment Successful! 🎉",
              description: "Your order has been confirmed and will be processed shortly.",
            });

            // Call onOrderComplete after a short delay to show success message
            setTimeout(() => {
              onOrderComplete?.();
            }, 3000);
            
          } else if (status === 'failed' || status === 'cancelled' || status === 'error') {
            setPaymentStatus('failed');
            clearInterval(interval);
            setStatusCheckInterval(null);
            
            toast({
              title: "Payment Failed",
              description: `Payment ${status}. Please try again.`,
              variant: "destructive"
            });
          } else {
            setPaymentStatus('pending');
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 5000);
    
    setStatusCheckInterval(interval);
  };

  const openPaymentLink = () => {
    if (paymentLink) {
      window.open(paymentLink, '_blank');
    }
  };

  const resetPayment = () => {
    setPaymentStatus('idle');
    setTransactionId('');
    setPaymentLink('');
    setTimeRemaining(600);
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
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

            {/* Single Unified Form - Order Details & Payment */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-choptym-brown">Complete Your Order</CardTitle>
                  <p className="text-sm text-gray-600">Fill in your details and pay instantly</p>
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

                  {/* Simplified Payment Info */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">Instant Secure Payment</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      🔒 Pay with Mobile Money, Card, or Bank Transfer • Powered by Swychr
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for payment notifications and order updates
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

                  {/* Payment Status Display */}
                  {paymentStatus !== 'idle' && (
                    <div className="space-y-4">
                      {paymentStatus === 'creating_link' && (
                        <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <Clock className="w-5 h-5 text-blue-500 mr-2 animate-spin" />
                          <span className="text-blue-700">Creating payment link...</span>
                        </div>
                      )}

                      {paymentStatus === 'redirecting' && (
                        <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <ExternalLink className="w-5 h-5 text-green-500 mr-2" />
                          <span className="text-green-700">Redirecting to payment...</span>
                        </div>
                      )}

                      {(paymentStatus === 'pending' || paymentStatus === 'checking') && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                              <span className="text-yellow-700 font-medium">Waiting for payment...</span>
                            </div>
                            <span className="text-yellow-600 font-mono text-sm">
                              {formatTime(timeRemaining)}
                            </span>
                          </div>
                          <p className="text-yellow-600 text-sm mb-3">
                            Complete your payment in the opened window
                          </p>
                          {paymentLink && (
                            <Button 
                              onClick={openPaymentLink}
                              variant="outline"
                              size="sm"
                              className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open Payment Link Again
                            </Button>
                          )}
                        </div>
                      )}

                      {paymentStatus === 'success' && (
                        <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          <span className="text-green-700 font-medium">Payment Successful! 🎉</span>
                        </div>
                      )}

                      {paymentStatus === 'failed' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center mb-2">
                            <XCircle className="w-5 h-5 text-red-500 mr-2" />
                            <span className="text-red-700 font-medium">Payment Failed</span>
                          </div>
                          <p className="text-red-600 text-sm mb-3">
                            There was an issue processing your payment. Please try again.
                          </p>
                          <Button 
                            onClick={resetPayment}
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-700 hover:bg-red-100"
                          >
                            Try Again
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Single-Click Payment Button */}
                  {paymentStatus === 'idle' && (
                    <div className="space-y-3">
                      <Button
                        onClick={handleInitiatePayment}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg"
                        size="lg"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        💰 Pay Now {formatPrice(calculateTotal())} - Instant!
                      </Button>

                      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>One-click secure payment • No redirects • Instant confirmation</span>
                      </div>
                    </div>
                  )}

                  {paymentStatus === 'failed' && (
                    <Button
                      onClick={handleInitiatePayment}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold"
                      size="lg"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      🔄 Try Again {formatPrice(calculateTotal())}
                    </Button>
                  )}
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
