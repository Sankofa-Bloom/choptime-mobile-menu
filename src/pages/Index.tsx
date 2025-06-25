
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Phone, MapPin, MessageCircle, Download, Star, Clock, Users, Flame, Leaf } from 'lucide-react';
import { Restaurant, Dish, OrderItem, Order } from '@/types/restaurant';
import RestaurantSelectionModal from '@/components/RestaurantSelectionModal';
import PaymentDetails from '@/components/PaymentDetails';
import TownSelector from '@/components/TownSelector';
import { useChopTimeData } from '@/hooks/useChopTimeData';

interface OrderDetails {
  items: OrderItem[];
  customerName: string;
  phone: string;
  deliveryAddress: string;
  paymentMethod: string;
  total: number;
}

const Index = () => {
  const [selectedTown, setSelectedTown] = useState<string>('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    items: [],
    customerName: '',
    phone: '',
    deliveryAddress: '',
    paymentMethod: '',
    total: 0
  });
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const { toast } = useToast();
  const { 
    dishes, 
    restaurants, 
    restaurantMenus, 
    loading, 
    error, 
    saveUserTown, 
    getUserTown, 
    saveOrder,
    getUserOrders 
  } = useChopTimeData(selectedTown);

  // Load user's town on component mount
  useEffect(() => {
    const loadUserTown = async () => {
      const savedPhone = localStorage.getItem('choptime_phone');
      if (savedPhone) {
        const userTown = await getUserTown(savedPhone);
        if (userTown) {
          setSelectedTown(userTown);
          setOrderDetails(prev => ({ ...prev, phone: savedPhone }));
        }
      }
    };
    loadUserTown();
  }, [getUserTown]);

  // PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPWAPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPWAPrompt(false);
        toast({
          title: "ChopTime Installed!",
          description: "You can now access ChopTime from your home screen.",
        });
      }
      setDeferredPrompt(null);
    }
  };

  const handleTownSelect = async (town: string) => {
    setSelectedTown(town);
    if (orderDetails.phone) {
      await saveUserTown(orderDetails.phone, town);
      localStorage.setItem('choptime_phone', orderDetails.phone);
    }
  };

  const handleAddToCart = (dish: Dish) => {
    setSelectedDish(dish);
    setShowRestaurantModal(true);
  };

  const getAvailableRestaurantsForDish = (dishId: string): Restaurant[] => {
    const availableMenus = restaurantMenus.filter(
      menu => menu.dish_id === dishId && menu.availability && menu.restaurant
    );
    return availableMenus.map(menu => menu.restaurant!);
  };

  const getDishPrice = (dishId: string, restaurantId: string): number => {
    const menu = restaurantMenus.find(
      m => m.dish_id === dishId && m.restaurant_id === restaurantId
    );
    return menu?.price || 0;
  };

  const handleRestaurantSelection = (restaurant: Restaurant, price: number) => {
    if (!selectedDish) return;

    const existingItem = cart.find(
      item => item.dish.id === selectedDish.id && item.restaurant.id === restaurant.id
    );
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.dish.id === selectedDish.id && item.restaurant.id === restaurant.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const orderItem: OrderItem = {
        dish: selectedDish,
        restaurant,
        quantity: 1,
        price
      };
      setCart([...cart, orderItem]);
    }

    setShowRestaurantModal(false);
    setSelectedDish(null);

    toast({
      title: "Added to Cart",
      description: `${selectedDish.name} from ${restaurant.name} has been added to your cart.`,
    });
  };

  const updateQuantity = (dishId: string, restaurantId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter(item => !(item.dish.id === dishId && item.restaurant.id === restaurantId)));
    } else {
      setCart(cart.map(item => 
        item.dish.id === dishId && item.restaurant.id === restaurantId 
          ? { ...item, quantity } 
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const getUniqueRestaurants = () => {
    const restaurantIds = new Set(cart.map(item => item.restaurant.id));
    return Array.from(restaurantIds).map(id => 
      restaurants.find(r => r.id === id)!
    ).filter(Boolean);
  };

  const generateWhatsAppMessage = () => {
    const total = calculateTotal();
    let message = `🍽️ *ChopTime Order*\n\n`;
    message += `👤 *Customer:* ${orderDetails.customerName}\n`;
    message += `📱 *Phone:* ${orderDetails.phone}\n`;
    message += `📍 *Delivery Address:* ${orderDetails.deliveryAddress}\n`;
    message += `🏙️ *Town:* ${selectedTown}\n`;
    message += `💳 *Payment:* ${orderDetails.paymentMethod}\n\n`;
    
    // Group items by restaurant
    const restaurantGroups = cart.reduce((groups, item) => {
      const restaurantId = item.restaurant.id;
      if (!groups[restaurantId]) {
        groups[restaurantId] = {
          restaurant: item.restaurant,
          items: []
        };
      }
      groups[restaurantId].items.push(item);
      return groups;
    }, {} as Record<string, { restaurant: Restaurant; items: OrderItem[] }>);

    Object.values(restaurantGroups).forEach(group => {
      message += `🏪 *${group.restaurant.name}*\n`;
      message += `📞 Contact: ${group.restaurant.contact_number}\n`;
      if (orderDetails.paymentMethod === 'mtn-money' && group.restaurant.mtn_number) {
        message += `💳 MTN Money: ${group.restaurant.mtn_number}\n`;
      }
      if (orderDetails.paymentMethod === 'orange-money' && group.restaurant.orange_number) {
        message += `🧡 Orange Money: ${group.restaurant.orange_number}\n`;
      }
      
      group.items.forEach(item => {
        message += `• ${item.dish.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}\n`;
      });
      message += `\n`;
    });
    
    message += `💰 *Total: ${formatPrice(total)}*\n\n`;
    message += `Thank you for choosing ChopTime! 🇨🇲`;
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppOrder = async () => {
    if (!orderDetails.customerName || !orderDetails.phone || !orderDetails.deliveryAddress || !orderDetails.paymentMethod) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before placing your order.",
        variant: "destructive"
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order.",
        variant: "destructive"
      });
      return;
    }

    // Save orders to database
    try {
      for (const item of cart) {
        const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
          user_name: orderDetails.customerName,
          user_phone: orderDetails.phone,
          user_location: orderDetails.deliveryAddress,
          dish_name: item.dish.name,
          restaurant_name: item.restaurant.name,
          restaurant_id: item.restaurant.id,
          dish_id: item.dish.id,
          quantity: item.quantity,
          price: item.price,
          total_amount: item.price * item.quantity,
          status: 'pending'
        };
        await saveOrder(orderData);
      }

      // Save user's town and phone
      await saveUserTown(orderDetails.phone, selectedTown);
      localStorage.setItem('choptime_phone', orderDetails.phone);

      toast({
        title: "Order Saved!",
        description: "Your order has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: "Save Error",
        description: "Failed to save order, but WhatsApp will still work.",
        variant: "destructive"
      });
    }

    // Open WhatsApp
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/237670416449?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-choptime-beige flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-choptime-orange rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-choptime-brown">Loading ChopTime...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-choptime-beige flex items-center justify-center">
        <div className="text-center">
          <p className="text-choptime-brown">Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-choptime-beige">
      <TownSelector onTownSelect={handleTownSelect} selectedTown={selectedTown} />

      {/* PWA Install Banner */}
      {showPWAPrompt && (
        <div className="bg-choptime-orange text-white p-4 text-center relative animate-slide-up">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Download className="w-5 h-5" />
            <span className="font-semibold">Install ChopTime App</span>
          </div>
          <p className="text-sm mb-3">Add ChopTime to your home screen for quick access!</p>
          <div className="flex gap-2 justify-center">
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleInstallPWA}
              className="bg-white text-choptime-orange hover:bg-gray-100"
            >
              Install Now
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setShowPWAPrompt(false)}
              className="text-white hover:bg-white/20"
            >
              Later
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white choptime-shadow sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-choptime-orange rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-choptime-brown">ChopTime</h1>
                <p className="text-sm text-choptime-brown/70">
                  {selectedTown ? `Delivering in ${selectedTown}` : 'Authentic Cameroonian Cuisine'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedTown && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTown('')}
                  className="text-choptime-orange hover:bg-choptime-orange/10"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Change Town
                </Button>
              )}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="relative border-choptime-orange text-choptime-orange hover:bg-choptime-orange hover:text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {cart.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-choptime-orange text-white text-xs">
                      {cart.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="african-pattern py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-choptime-brown mb-4 animate-fade-in">
            Taste of Cameroon 🇨🇲
          </h2>
          <p className="text-lg text-choptime-brown/80 mb-6 animate-fade-in">
            {selectedTown 
              ? `Fresh dishes from restaurants in ${selectedTown}` 
              : 'Choose your favorite dish, then select your preferred restaurant'
            }
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-choptime-brown/70">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>25-60 min delivery</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-choptime-orange text-choptime-orange" />
              <span>4.8 rating</span>
            </div>
            {selectedTown && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{selectedTown}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-choptime-brown mb-6">Our Menu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dishes.map((dish, index) => {
              const availableRestaurants = getAvailableRestaurantsForDish(dish.id);
              const minPrice = Math.min(...availableRestaurants.map(r => getDishPrice(dish.id, r.id)));
              
              return (
                <Card key={dish.id} className="overflow-hidden choptime-shadow hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="relative">
                    <img 
                      src={dish.image_url || 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400'} 
                      alt={dish.name}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-2 left-2 bg-choptime-orange text-white">
                      {dish.category}
                    </Badge>
                    <div className="absolute top-2 right-2 flex gap-1">
                      {dish.is_popular && (
                        <Badge variant="secondary" className="bg-white/90 text-choptime-orange">
                          Popular
                        </Badge>
                      )}
                      {dish.is_spicy && (
                        <Badge variant="secondary" className="bg-red-100 text-red-600">
                          <Flame className="w-3 h-3" />
                        </Badge>
                      )}
                      {dish.is_vegetarian && (
                        <Badge variant="secondary" className="bg-green-100 text-green-600">
                          <Leaf className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-bold text-lg text-choptime-brown mb-2">{dish.name}</h4>
                    <p className="text-sm text-choptime-brown/70 mb-3 line-clamp-2">{dish.description}</p>
                    <div className="flex items-center gap-4 text-xs text-choptime-brown/60 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{dish.cook_time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{dish.serves}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-choptime-orange">
                        {availableRestaurants.length > 0 ? `From ${formatPrice(minPrice)}` : 'Not Available'}
                      </span>
                      <Button 
                        onClick={() => handleAddToCart(dish)}
                        disabled={availableRestaurants.length === 0}
                        className="choptime-gradient hover:opacity-90 text-white disabled:opacity-50"
                      >
                        {availableRestaurants.length > 0 ? 'Choose Restaurant' : 'Not Available'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cart & Order Section */}
      {cart.length > 0 && (
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl font-bold text-choptime-brown mb-6">Your Order</h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-choptime-brown mb-4">Cart Items</h4>
                <div className="space-y-4">
                  {cart.map(item => (
                    <Card key={`${item.dish.id}-${item.restaurant.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
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
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.dish.id, item.restaurant.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.dish.id, item.restaurant.id, item.quantity + 1)}
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
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-choptime-orange">{formatPrice(calculateTotal())}</span>
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
                        onChange={(e) => setOrderDetails({...orderDetails, customerName: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="e.g., +237 6XX XXX XXX"
                        value={orderDetails.phone}
                        onChange={(e) => {
                          setOrderDetails({...orderDetails, phone: e.target.value});
                          if (e.target.value && selectedTown) {
                            saveUserTown(e.target.value, selectedTown);
                            localStorage.setItem('choptime_phone', e.target.value);
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Delivery Address in {selectedTown} *</Label>
                      <Textarea
                        id="address"
                        placeholder={`Enter your complete delivery address in ${selectedTown} (neighborhood, street, landmarks)`}
                        value={orderDetails.deliveryAddress}
                        onChange={(e) => setOrderDetails({...orderDetails, deliveryAddress: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="payment">Payment Method *</Label>
                      <Select onValueChange={(value) => setOrderDetails({...orderDetails, paymentMethod: value})}>
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

                <PaymentDetails 
                  paymentMethod={orderDetails.paymentMethod}
                  restaurants={getUniqueRestaurants()}
                />
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button 
                onClick={handleWhatsAppOrder}
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
      )}

      <RestaurantSelectionModal
        isOpen={showRestaurantModal}
        onClose={() => setShowRestaurantModal(false)}
        dish={selectedDish}
        restaurants={selectedDish ? getAvailableRestaurantsForDish(selectedDish.id) : []}
        getDishPrice={(restaurantId) => selectedDish ? getDishPrice(selectedDish.id, restaurantId) : 0}
        onSelectRestaurant={handleRestaurantSelection}
      />

      {/* Footer */}
      <footer className="bg-choptime-brown text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h5 className="font-bold text-lg mb-4">ChopTime</h5>
              <p className="text-white/80 text-sm">
                Bringing authentic Cameroonian flavors to your doorstep. 
                Experience the taste of home with every bite.
              </p>
            </div>
            
            <div>
              <h5 className="font-bold text-lg mb-4">Contact Us</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+237 6 70 41 64 49</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>choptime237@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Cameroon</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-bold text-lg mb-4">Delivery Info</h5>
              <div className="text-sm text-white/80 space-y-1">
                <p>🕐 Delivery: 30-60 minutes</p>
                <p>💳 Payment: MTN/Orange Money, Cash</p>
                <p>🚚 Free delivery on orders above 5,000 FCFA</p>
              </div>
            </div>
          </div>
          
          <Separator className="my-6 bg-white/20" />
          
          <div className="text-center text-sm text-white/60">
            <p>&copy; 2024 ChopTime. Made with ❤️ for Cameroon.</p>
            <p className="mt-1">Support: choptime237@gmail.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
