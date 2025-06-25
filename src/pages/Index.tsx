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
import { ShoppingCart, Phone, MapPin, MessageCircle, Download, Star, Clock, Users } from 'lucide-react';
import { Restaurant, MenuItem, RestaurantMenuItem, OrderItem } from '@/types/restaurant';
import RestaurantSelectionModal from '@/components/RestaurantSelectionModal';
import PaymentDetails from '@/components/PaymentDetails';

interface OrderDetails {
  items: OrderItem[];
  customerName: string;
  phone: string;
  deliveryAddress: string;
  paymentMethod: string;
  total: number;
}

const Index = () => {
  // Sample data - in a real app, this would come from an API
  const [restaurants] = useState<Restaurant[]>([
    {
      id: '1',
      name: 'Mama Africa Kitchen',
      rating: 4.8,
      deliveryTime: '30-45 min',
      location: 'Douala, Akwa',
      mtnNumber: '+237 6 70 41 64 49',
      orangeNumber: '+237 6 90 12 34 56',
      contactNumber: '+237 6 70 41 64 49',
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400'
    },
    {
      id: '2',
      name: 'Authentic Bamileke Cuisine',
      rating: 4.7,
      deliveryTime: '35-50 min',
      location: 'Yaoundé, Bastos',
      mtnNumber: '+237 6 80 22 33 44',
      orangeNumber: '+237 6 95 44 55 66',
      contactNumber: '+237 6 80 22 33 44',
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400'
    },
    {
      id: '3',
      name: 'ChopTime Express',
      rating: 4.9,
      deliveryTime: '25-40 min',
      location: 'Douala, Bonanjo',
      mtnNumber: '+237 6 70 41 64 49',
      orangeNumber: '+237 6 92 77 88 99',
      contactNumber: '+237 6 70 41 64 49',
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400'
    }
  ]);

  const [menuItems] = useState<MenuItem[]>([
    {
      id: '1',
      name: 'Eru with Fufu',
      description: 'Traditional Cameroonian eru leaves cooked with dried fish, crayfish, and palm oil. Served with soft fufu.',
      basePrice: 2500,
      image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400',
      category: 'Traditional',
      rating: 4.8,
      cookTime: '45 min',
      serves: '2-3 people'
    },
    {
      id: '2',
      name: 'Achu Yellow Soup',
      description: 'Delicious yellow soup made with palm nuts, vegetables, and assorted meat. Served with pounded cocoyam.',
      basePrice: 3000,
      image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400',
      category: 'Traditional',
      rating: 4.9,
      cookTime: '60 min',
      serves: '3-4 people'
    },
    {
      id: '3',
      name: 'Ndolé',
      description: 'Cameroon\'s national dish made with ndolé leaves, groundnuts, fish, and meat in rich sauce.',
      basePrice: 2800,
      image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400',
      category: 'Traditional',
      rating: 4.7,
      cookTime: '50 min',
      serves: '2-3 people'
    },
    {
      id: '4',
      name: 'Pepper Soup',
      description: 'Spicy and aromatic pepper soup with fresh fish or meat, perfect for any weather.',
      basePrice: 2000,
      image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400',
      category: 'Soup',
      rating: 4.6,
      cookTime: '30 min',
      serves: '1-2 people'
    },
    {
      id: '5',
      name: 'Jollof Rice',
      description: 'Perfectly seasoned jollof rice cooked with tomatoes, spices, and your choice of chicken or beef.',
      basePrice: 2200,
      image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400',
      category: 'Rice',
      rating: 4.5,
      cookTime: '40 min',
      serves: '2 people'
    },
    {
      id: '6',
      name: 'Banga Soup',
      description: 'Rich palm fruit soup with assorted meat and fish, seasoned with traditional spices.',
      basePrice: 2700,
      image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400',
      category: 'Soup',
      rating: 4.4,
      cookTime: '55 min',
      serves: '3 people'
    }
  ]);

  const [restaurantMenuItems] = useState<RestaurantMenuItem[]>([
    // Restaurant 1 - Mama Africa Kitchen
    { menuItemId: '1', restaurantId: '1', price: 2500, availability: true },
    { menuItemId: '2', restaurantId: '1', price: 3200, availability: true },
    { menuItemId: '3', restaurantId: '1', price: 2800, availability: true },
    { menuItemId: '4', restaurantId: '1', price: 2100, availability: true },
    { menuItemId: '5', restaurantId: '1', price: 2200, availability: false },
    
    // Restaurant 2 - Authentic Bamileke Cuisine
    { menuItemId: '1', restaurantId: '2', price: 2400, availability: true },
    { menuItemId: '2', restaurantId: '2', price: 3000, availability: true },
    { menuItemId: '3', restaurantId: '2', price: 2900, availability: true },
    { menuItemId: '6', restaurantId: '2', price: 2700, availability: true },
    
    // Restaurant 3 - ChopTime Express
    { menuItemId: '1', restaurantId: '3', price: 2600, availability: true },
    { menuItemId: '3', restaurantId: '3', price: 2750, availability: true },
    { menuItemId: '4', restaurantId: '3', price: 2000, availability: true },
    { menuItemId: '5', restaurantId: '3', price: 2300, availability: true },
    { menuItemId: '6', restaurantId: '3', price: 2800, availability: true },
  ]);

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
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

  // PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPWAPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
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

  const handleAddToCart = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setShowRestaurantModal(true);
  };

  const handleRestaurantSelection = (restaurant: Restaurant, price: number) => {
    if (!selectedMenuItem) return;

    const existingItem = cart.find(
      cartItem => cartItem.id === selectedMenuItem.id && cartItem.restaurant.id === restaurant.id
    );
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === selectedMenuItem.id && cartItem.restaurant.id === restaurant.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      const orderItem: OrderItem = {
        ...selectedMenuItem,
        quantity: 1,
        restaurant,
        finalPrice: price
      };
      setCart([...cart, orderItem]);
    }

    setShowRestaurantModal(false);
    setSelectedMenuItem(null);

    toast({
      title: "Added to Cart",
      description: `${selectedMenuItem.name} from ${restaurant.name} has been added to your cart.`,
    });
  };

  const updateQuantity = (id: string, restaurantId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter(item => !(item.id === id && item.restaurant.id === restaurantId)));
    } else {
      setCart(cart.map(item => 
        item.id === id && item.restaurant.id === restaurantId 
          ? { ...item, quantity } 
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.finalPrice * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const getUniqueRestaurants = () => {
    const restaurantIds = new Set(cart.map(item => item.restaurant.id));
    return Array.from(restaurantIds).map(id => 
      restaurants.find(r => r.id === id)!
    );
  };

  const generateWhatsAppMessage = () => {
    const total = calculateTotal();
    let message = `🍽️ *ChopTime Order*\n\n`;
    message += `👤 *Customer:* ${orderDetails.customerName}\n`;
    message += `📱 *Phone:* ${orderDetails.phone}\n`;
    message += `📍 *Delivery Address:* ${orderDetails.deliveryAddress}\n`;
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
      message += `📞 Contact: ${group.restaurant.contactNumber}\n`;
      if (orderDetails.paymentMethod === 'mtn-money' && group.restaurant.mtnNumber) {
        message += `💳 MTN Money: ${group.restaurant.mtnNumber}\n`;
      }
      if (orderDetails.paymentMethod === 'orange-money' && group.restaurant.orangeNumber) {
        message += `🧡 Orange Money: ${group.restaurant.orangeNumber}\n`;
      }
      
      group.items.forEach(item => {
        message += `• ${item.name} x${item.quantity} - ${formatPrice(item.finalPrice * item.quantity)}\n`;
      });
      message += `\n`;
    });
    
    message += `💰 *Total: ${formatPrice(total)}*\n\n`;
    message += `Thank you for choosing ChopTime! 🇨🇲`;
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppOrder = () => {
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

    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/237670416449?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-choptime-beige">
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
                <p className="text-sm text-choptime-brown/70">Authentic Cameroonian Cuisine</p>
              </div>
            </div>
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
      </header>

      {/* Hero Section */}
      <section className="african-pattern py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-choptime-brown mb-4 animate-fade-in">
            Taste of Cameroon 🇨🇲
          </h2>
          <p className="text-lg text-choptime-brown/80 mb-6 animate-fade-in">
            Choose your favorite dish, then select your preferred restaurant
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
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-choptime-brown mb-6">Our Menu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <Card key={item.id} className="overflow-hidden choptime-shadow hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="relative">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-2 left-2 bg-choptime-orange text-white">
                    {item.category}
                  </Badge>
                  <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-1 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-choptime-orange text-choptime-orange" />
                    <span className="text-xs font-semibold">{item.rating}</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-bold text-lg text-choptime-brown mb-2">{item.name}</h4>
                  <p className="text-sm text-choptime-brown/70 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-4 text-xs text-choptime-brown/60 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.cookTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{item.serves}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-choptime-orange">From {formatPrice(item.basePrice)}</span>
                    <Button 
                      onClick={() => handleAddToCart(item)}
                      className="choptime-gradient hover:opacity-90 text-white"
                    >
                      Choose Restaurant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                    <Card key={`${item.id}-${item.restaurant.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h5 className="font-semibold text-choptime-brown">{item.name}</h5>
                            <p className="text-xs text-choptime-orange font-medium">{item.restaurant.name}</p>
                            <p className="text-sm text-choptime-brown/70">{formatPrice(item.finalPrice)} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.restaurant.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.restaurant.id, item.quantity + 1)}
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
                        onChange={(e) => setOrderDetails({...orderDetails, phone: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Delivery Address *</Label>
                      <Textarea
                        id="address"
                        placeholder="Enter your complete delivery address (neighborhood, street, landmarks)"
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
        menuItem={selectedMenuItem}
        restaurants={restaurants}
        restaurantMenuItems={restaurantMenuItems}
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
