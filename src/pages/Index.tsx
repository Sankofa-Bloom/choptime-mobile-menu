
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Restaurant, Dish, OrderItem, CustomOrderItem, Order, CustomOrder } from '@/types/restaurant';
import { useChopTimeData } from '@/hooks/useChopTimeData';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MenuSection from '@/components/MenuSection';
import CartSection from '@/components/CartSection';
import Footer from '@/components/Footer';
import TownSelector from '@/components/TownSelector';
import RestaurantSelectionModal from '@/components/RestaurantSelectionModal';
import CustomOrderModal from '@/components/CustomOrderModal';

interface OrderDetails {
  customerName: string;
  phone: string;
  deliveryAddress: string;
  additionalMessage: string;
  paymentMethod: string;
  total: number;
  deliveryFee: number;
}

const Index = () => {
  const [selectedTown, setSelectedTown] = useState('');
  const [cart, setCart] = useState<(OrderItem | CustomOrderItem)[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    customerName: '',
    phone: '',
    deliveryAddress: '',
    additionalMessage: '',
    paymentMethod: '',
    total: 0,
    deliveryFee: 0
  });

  // Modal states
  const [showTownSelector, setShowTownSelector] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showCart, setShowCart] = useState(false);

  const { 
    dishes, 
    restaurants, 
    restaurantMenus, 
    loading, 
    error,
    getDeliveryFee,
    generateOrderReference, 
    saveOrder, 
    saveCustomOrder,
    saveUserTown,
    getUserTown
  } = useChopTimeData(selectedTown);

  const { toast } = useToast();

  // Load user's town preference on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      const savedTown = localStorage.getItem('choptime-town');
      if (savedTown && (savedTown === 'Buea' || savedTown === 'Limbe')) {
        setSelectedTown(savedTown);
      } else {
        setShowTownSelector(true);
      }
    };
    loadUserPreferences();
  }, []);

  // Update delivery fee when town or address changes
  useEffect(() => {
    const updateDeliveryFee = async () => {
      if (selectedTown && orderDetails.deliveryAddress) {
        const fee = await getDeliveryFee(selectedTown, orderDetails.deliveryAddress);
        setOrderDetails(prev => ({ ...prev, deliveryFee: fee }));
      } else if (selectedTown) {
        const fee = await getDeliveryFee(selectedTown);
        setOrderDetails(prev => ({ ...prev, deliveryFee: fee }));
      }
    };
    updateDeliveryFee();
  }, [selectedTown, orderDetails.deliveryAddress, getDeliveryFee]);

  const scrollToCart = () => {
    const cartSection = document.getElementById('cart-section');
    if (cartSection) {
      cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTownChange = (town: string) => {
    setSelectedTown(town);
    localStorage.setItem('choptime-town', town);
    setCart([]); // Clear cart when changing towns
    setShowTownSelector(false);
  };

  const handleDishSelect = (dish: Dish) => {
    setSelectedDish(dish);
    setShowRestaurantModal(true);
  };

  const handleRestaurantSelect = (restaurant: Restaurant, price: number) => {
    if (selectedDish) {
      addToCart(selectedDish, restaurant, price);
    }
    setShowRestaurantModal(false);
    setSelectedDish(null);
  };

  const addToCart = (dish: Dish, restaurant: Restaurant, price: number) => {
    const existingItem = cart.find(item => 'dish' in item && item.dish.id === dish.id && item.restaurant.id === restaurant.id);
  
    if (existingItem && 'dish' in existingItem) {
      const updatedCart = cart.map(item => {
        if ('dish' in item && item.dish.id === dish.id && item.restaurant.id === restaurant.id) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
      setCart(updatedCart);
    } else {
      const newItem: OrderItem = {
        dish: dish,
        restaurant: restaurant,
        quantity: 1,
        price: price
      };
      setCart([...cart, newItem]);
    }
  
    toast({
      title: "Added to cart",
      description: `${dish.name} from ${restaurant.name} added to your order.`,
    });

    // Scroll to cart section after adding item
    setTimeout(() => {
      scrollToCart();
    }, 100);
  };

  const addCustomToCart = (customOrderItem: CustomOrderItem) => {
    const existingItem = cart.find(item => 
      'customDishName' in item && 
      item.customDishName === customOrderItem.customDishName && 
      item.restaurant.id === customOrderItem.restaurant.id && 
      item.specialInstructions === customOrderItem.specialInstructions
    );
  
    if (existingItem && 'customDishName' in existingItem) {
      const updatedCart = cart.map(item => {
        if ('customDishName' in item && 
            item.customDishName === customOrderItem.customDishName && 
            item.restaurant.id === customOrderItem.restaurant.id && 
            item.specialInstructions === customOrderItem.specialInstructions) {
          return { ...item, quantity: item.quantity + customOrderItem.quantity };
        }
        return item;
      });
      setCart(updatedCart);
    } else {
      setCart([...cart, customOrderItem]);
    }
  
    toast({
      title: "Added to cart",
      description: `${customOrderItem.customDishName} from ${customOrderItem.restaurant.name} added to your order.`,
    });
    
    setShowCustomOrderModal(false);

    // Scroll to cart section after adding custom item
    setTimeout(() => {
      scrollToCart();
    }, 100);
  };

  const handleQuantityUpdate = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      const updatedCart = [...cart];
      updatedCart[index].quantity = newQuantity;
      setCart(updatedCart);
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      return sum + (('dish' in item ? item.price : item.estimatedPrice) * item.quantity);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + orderDetails.deliveryFee;
  };

  const getAvailableRestaurantsForDish = (dishId: string): Restaurant[] => {
    return restaurants.filter(restaurant => 
      restaurantMenus.some(menu => menu.dish_id === dishId && menu.restaurant_id === restaurant.id)
    );
  };

  const getDishPrice = (dishId: string, restaurantId: string): number => {
    const menu = restaurantMenus.find(m => m.dish_id === dishId && m.restaurant_id === restaurantId);
    return menu?.price || 0;
  };

  const generateWhatsAppMessage = async () => {
    const orderRef = await generateOrderReference(selectedTown);
    
    let message = `🍽️ *ChopTime Order*\n\n`;
    message += `📋 *Order Reference:* ${orderRef}\n`;
    message += `👤 *Customer:* ${orderDetails.customerName}\n`;
    message += `📱 *Phone:* ${orderDetails.phone}\n`;
    message += `📍 *Address:* ${orderDetails.deliveryAddress}\n`;
    message += `🏙️ *Town:* ${selectedTown}\n`;
    message += `💳 *Payment:* ${orderDetails.paymentMethod}\n`;
    
    if (orderDetails.additionalMessage) {
      message += `💬 *Message:* ${orderDetails.additionalMessage}\n`;
    }
    
    message += `\n🛒 *Order Details:*\n`;
    cart.forEach(item => {
      if ('dish' in item) {
        message += `• ${item.dish.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}\n`;
        message += `  📍 From: ${item.restaurant.name}\n`;
      } else {
        message += `• ${item.customDishName} (Custom) x${item.quantity} - ${formatPrice(item.estimatedPrice * item.quantity)}\n`;
        message += `  📍 From: ${item.restaurant.name}\n`;
        if (item.specialInstructions) {
          message += `  📝 Special: ${item.specialInstructions}\n`;
        }
      }
    });
    
    message += `\n💰 *Order Summary:*\n`;
    message += `Subtotal: ${formatPrice(calculateSubtotal())}\n`;
    message += `Delivery (${selectedTown}): ${formatPrice(orderDetails.deliveryFee)}\n`;
    message += `*Total: ${formatPrice(calculateTotal())}*\n\n`;
    
    message += `⏰ Estimated delivery: 15-45 minutes\n`;
    message += `🚚 We'll contact you to confirm delivery details.\n\n`;
    
    message += `Thank you for choosing ChopTime! 🇨🇲`;
    
    return { message, orderRef };
  };

  const handleWhatsAppOrder = async () => {
    // Validation
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before ordering.",
        variant: "destructive"
      });
      return;
    }

    if (!orderDetails.customerName || !orderDetails.phone || !orderDetails.deliveryAddress || !orderDetails.paymentMethod) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { message, orderRef } = await generateWhatsAppMessage();

      // Save user's town preference
      if (orderDetails.phone) {
        await saveUserTown(orderDetails.phone, selectedTown);
      }

      // Save orders to database
      for (const item of cart) {
        if ('dish' in item) {
          // Regular order
          const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
            user_name: orderDetails.customerName,
            user_phone: orderDetails.phone,
            user_location: `${selectedTown}, ${orderDetails.deliveryAddress}`,
            dish_name: item.dish.name,
            restaurant_name: item.restaurant.name,
            restaurant_id: item.restaurant.id,
            dish_id: item.dish.id,
            quantity: item.quantity,
            price: item.price,
            total_amount: calculateTotal(),
            order_reference: orderRef,
            status: 'pending'
          };
          await saveOrder(orderData);
        } else {
          // Custom order
          const customOrderData: Omit<CustomOrder, 'id' | 'created_at' | 'updated_at'> = {
            user_name: orderDetails.customerName,
            user_phone: orderDetails.phone,
            user_location: `${selectedTown}, ${orderDetails.deliveryAddress}`,
            custom_dish_name: item.customDishName,
            restaurant_name: item.restaurant.name,
            restaurant_id: item.restaurant.id,
            quantity: item.quantity,
            special_instructions: item.specialInstructions,
            estimated_price: item.estimatedPrice,
            total_amount: calculateTotal(),
            order_reference: orderRef,
            status: 'pending'
          };
          await saveCustomOrder(customOrderData);
        }
      }

      toast({
        title: "Order saved!",
        description: `Your order ${orderRef} has been saved successfully.`,
      });

      // Fixed WhatsApp URL handling with proper encoding and device detection
      const encodedMessage = encodeURIComponent(message);
      const whatsappNumber = "237670416449";
      
      console.log('Opening WhatsApp with message:', message);
      console.log('WhatsApp number:', whatsappNumber);
      
      // Try multiple WhatsApp URLs in sequence
      const tryWhatsAppUrls = [
        `https://wa.me/${whatsappNumber}?text=${encodedMessage}`,
        `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`,
        `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`
      ];

      let urlOpened = false;
      
      for (const url of tryWhatsAppUrls) {
        try {
          console.log('Trying WhatsApp URL:', url);
          const newWindow = window.open(url, '_blank');
          
          if (newWindow) {
            urlOpened = true;
            break;
          }
        } catch (error) {
          console.error('Error opening WhatsApp URL:', url, error);
        }
      }

      if (!urlOpened) {
        // Fallback: show the message and number to user
        toast({
          title: "WhatsApp not available",
          description: `Please send this message to +${whatsappNumber} on WhatsApp manually.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: "Error",
        description: "Failed to process your order. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-choptime-beige">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-choptime-orange mx-auto mb-4"></div>
          <p className="text-choptime-brown">Loading delicious options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-choptime-beige">
        <div className="text-center text-red-600">
          <p>Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-choptime-beige">
      <Header 
        selectedTown={selectedTown}
        cart={cart}
        onTownChange={() => setShowTownSelector(true)}
        onCartClick={() => setShowCart(!showCart)}
        showPWAPrompt={false}
        onInstallPWA={() => {}}
        onDismissPWA={() => {}}
      />
      
      <HeroSection selectedTown={selectedTown} deliveryFee={orderDetails.deliveryFee} />
      
      <MenuSection 
        dishes={dishes}
        restaurants={restaurants}
        selectedTown={selectedTown}
        getAvailableRestaurantsForDish={getAvailableRestaurantsForDish}
        getDishPrice={getDishPrice}
        onAddToCart={handleDishSelect}
        onCustomOrder={() => setShowCustomOrderModal(true)}
      />
      
      {cart.length > 0 && (
        <CartSection 
          cart={cart}
          orderDetails={orderDetails}
          selectedTown={selectedTown}
          onOrderDetailsChange={setOrderDetails}
          onQuantityUpdate={handleQuantityUpdate}
          onWhatsAppOrder={handleWhatsAppOrder}
          calculateSubtotal={calculateSubtotal}
          calculateTotal={calculateTotal}
        />
      )}
      
      <Footer />

      {/* Modals */}
      <TownSelector 
        selectedTown={selectedTown}
        onTownSelect={handleTownChange}
      />

      <RestaurantSelectionModal
        isOpen={showRestaurantModal}
        onClose={() => {
          setShowRestaurantModal(false);
          setSelectedDish(null);
        }}
        dish={selectedDish}
        restaurants={selectedDish ? getAvailableRestaurantsForDish(selectedDish.id) : []}
        getDishPrice={(restaurantId: string) => selectedDish ? getDishPrice(selectedDish.id, restaurantId) : 0}
        onSelectRestaurant={handleRestaurantSelect}
      />

      <CustomOrderModal
        isOpen={showCustomOrderModal}
        onClose={() => setShowCustomOrderModal(false)}
        restaurants={restaurants}
        onAddToCart={addCustomToCart}
      />
    </div>
  );
};

export default Index;
