
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Restaurant, Dish, OrderItem, CustomOrderItem, Order, CustomOrder } from '@/types/restaurant';
import RestaurantSelectionModal from '@/components/RestaurantSelectionModal';
import CustomOrderModal from '@/components/CustomOrderModal';
import TownSelector from '@/components/TownSelector';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MenuSection from '@/components/MenuSection';
import CartSection from '@/components/CartSection';
import Footer from '@/components/Footer';
import { useChopTimeData } from '@/hooks/useChopTimeData';

interface OrderDetails {
  items: (OrderItem | CustomOrderItem)[];
  customerName: string;
  phone: string;
  deliveryAddress: string;
  paymentMethod: string;
  total: number;
  deliveryFee: number;
}

const Index = () => {
  const [selectedTown, setSelectedTown] = useState<string>('');
  const [cart, setCart] = useState<(OrderItem | CustomOrderItem)[]>([]);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    items: [],
    customerName: '',
    phone: '',
    deliveryAddress: '',
    paymentMethod: '',
    total: 0,
    deliveryFee: 0
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
    getDeliveryFee,
    generateOrderReference,
    saveUserTown, 
    getUserTown, 
    saveOrder,
    saveCustomOrder
  } = useChopTimeData(selectedTown);

  // Load user's town on component mount
  useEffect(() => {
    const loadUserTown = async () => {
      const savedPhone = localStorage.getItem('choptime_phone');
      if (savedPhone) {
        const userTown = await getUserTown(savedPhone);
        if (userTown && (userTown === 'Buea' || userTown === 'Limbe')) {
          setSelectedTown(userTown);
          setOrderDetails(prev => ({ 
            ...prev, 
            phone: savedPhone,
            deliveryFee: getDeliveryFee(userTown)
          }));
        }
      }
    };
    loadUserTown();
  }, [getUserTown, getDeliveryFee]);

  // Update delivery fee when town changes
  useEffect(() => {
    if (selectedTown) {
      const fee = getDeliveryFee(selectedTown);
      setOrderDetails(prev => ({ ...prev, deliveryFee: fee }));
    }
  }, [selectedTown, getDeliveryFee]);

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
    const fee = getDeliveryFee(town);
    setOrderDetails(prev => ({ ...prev, deliveryFee: fee }));
    if (orderDetails.phone) {
      await saveUserTown(orderDetails.phone, town);
      localStorage.setItem('choptime_phone', orderDetails.phone);
    }
  };

  const handleAddToCart = (dish: Dish) => {
    setSelectedDish(dish);
    setShowRestaurantModal(true);
  };

  const handleCustomOrder = () => {
    setShowCustomOrderModal(true);
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
      item => 'dish' in item && item.dish.id === selectedDish.id && item.restaurant.id === restaurant.id
    ) as OrderItem | undefined;
    
    if (existingItem) {
      setCart(cart.map(item => 
        'dish' in item && item.dish.id === selectedDish.id && item.restaurant.id === restaurant.id
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

  const handleCustomOrderAdd = (customOrderItem: CustomOrderItem) => {
    setCart([...cart, customOrderItem]);
    toast({
      title: "Custom Order Added",
      description: `${customOrderItem.customDishName} from ${customOrderItem.restaurant.name} has been added to your cart.`,
    });
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      setCart(cart.map((item, i) => 
        i === index ? { ...item, quantity } : item
      ));
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      if ('dish' in item) {
        return total + (item.price * item.quantity);
      } else {
        return total + (item.estimatedPrice * item.quantity);
      }
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + orderDetails.deliveryFee;
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const generateWhatsAppMessage = async () => {
    const subtotal = calculateSubtotal();
    const total = calculateTotal();
    const orderRef = await generateOrderReference(selectedTown);
    
    let message = `🍽️ *ChopTime Order*\n\n`;
    message += `📋 *Order ID:* ${orderRef}\n`;
    message += `👤 *Customer:* ${orderDetails.customerName}\n`;
    message += `📱 *Phone:* ${orderDetails.phone}\n`;
    message += `📍 *Address:* ${orderDetails.deliveryAddress}\n`;
    message += `🏙️ *Town:* ${selectedTown}\n`;
    message += `💳 *Payment:* ${orderDetails.paymentMethod}\n\n`;
    
    message += `🛒 *Order Details:*\n`;
    cart.forEach(item => {
      if ('dish' in item) {
        message += `• ${item.dish.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}\n`;
        message += `  📍 ${item.restaurant.name}\n`;
      } else {
        message += `• ${item.customDishName} x${item.quantity} - ${formatPrice(item.estimatedPrice * item.quantity)} (Custom)\n`;
        message += `  📍 ${item.restaurant.name}\n`;
        if (item.specialInstructions) {
          message += `  📝 ${item.specialInstructions}\n`;
        }
      }
    });
    
    message += `\n💰 *Subtotal:* ${formatPrice(subtotal)}\n`;
    message += `🚚 *Delivery Fee:* ${formatPrice(orderDetails.deliveryFee)}\n`;
    message += `💯 *Total:* ${formatPrice(total)}\n\n`;
    
    if (orderDetails.paymentMethod !== 'pay-on-delivery') {
      message += `💳 *Payment Details:*\n`;
      message += `📞 Number: +237 6 70 41 64 49\n`;
      message += `👤 Name: Ngwese Mpah\n`;
      message += `📋 Reference: ${orderRef}\n\n`;
    }
    
    message += `Thank you for choosing ChopTime! 🇨🇲`;
    
    return { message: encodeURIComponent(message), orderRef };
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

    try {
      const { message, orderRef } = await generateWhatsAppMessage();

      // Save orders to database
      for (const item of cart) {
        if ('dish' in item) {
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
            order_reference: orderRef,
            status: 'pending'
          };
          await saveOrder(orderData);
        } else {
          const customOrderData: Omit<CustomOrder, 'id' | 'created_at' | 'updated_at'> = {
            user_name: orderDetails.customerName,
            user_phone: orderDetails.phone,
            user_location: orderDetails.deliveryAddress,
            custom_dish_name: item.customDishName,
            quantity: item.quantity,
            special_instructions: item.specialInstructions,
            restaurant_id: item.restaurant.id,
            restaurant_name: item.restaurant.name,
            estimated_price: item.estimatedPrice,
            total_amount: item.estimatedPrice * item.quantity,
            order_reference: orderRef,
            status: 'pending'
          };
          await saveCustomOrder(customOrderData);
        }
      }

      // Save user's town and phone
      await saveUserTown(orderDetails.phone, selectedTown);
      localStorage.setItem('choptime_phone', orderDetails.phone);

      toast({
        title: "Order Saved!",
        description: `Your order ${orderRef} has been saved successfully.`,
      });

      // Open WhatsApp
      const whatsappUrl = `https://wa.me/237670416449?text=${message}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: "Order Error",
        description: "Failed to process order. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCartClick = () => {
    if (cart.length > 0) {
      document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrderDetailsChange = (details: any) => {
    setOrderDetails(details);
    if (details.phone && selectedTown) {
      saveUserTown(details.phone, selectedTown);
      localStorage.setItem('choptime_phone', details.phone);
    }
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
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-choptime-orange text-white rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-choptime-beige">
      <TownSelector onTownSelect={handleTownSelect} selectedTown={selectedTown} />

      <Header
        selectedTown={selectedTown}
        cart={cart}
        onTownChange={() => setSelectedTown('')}
        onCartClick={handleCartClick}
        showPWAPrompt={showPWAPrompt}
        onInstallPWA={handleInstallPWA}
        onDismissPWA={() => setShowPWAPrompt(false)}
      />

      <HeroSection selectedTown={selectedTown} deliveryFee={orderDetails.deliveryFee} />

      <MenuSection
        dishes={dishes}
        restaurants={restaurants}
        selectedTown={selectedTown}
        getAvailableRestaurantsForDish={getAvailableRestaurantsForDish}
        getDishPrice={getDishPrice}
        onAddToCart={handleAddToCart}
        onCustomOrder={handleCustomOrder}
      />

      {cart.length > 0 && (
        <CartSection
          cart={cart}
          orderDetails={orderDetails}
          selectedTown={selectedTown}
          onOrderDetailsChange={handleOrderDetailsChange}
          onQuantityUpdate={updateQuantity}
          onWhatsAppOrder={handleWhatsAppOrder}
          calculateSubtotal={calculateSubtotal}
          calculateTotal={calculateTotal}
        />
      )}

      <RestaurantSelectionModal
        isOpen={showRestaurantModal}
        onClose={() => setShowRestaurantModal(false)}
        dish={selectedDish}
        restaurants={selectedDish ? getAvailableRestaurantsForDish(selectedDish.id) : []}
        getDishPrice={(restaurantId) => selectedDish ? getDishPrice(selectedDish.id, restaurantId) : 0}
        onSelectRestaurant={handleRestaurantSelection}
      />

      <CustomOrderModal
        isOpen={showCustomOrderModal}
        onClose={() => setShowCustomOrderModal(false)}
        restaurants={restaurants}
        onAddToCart={handleCustomOrderAdd}
      />

      <Footer />
    </div>
  );
};

export default Index;
