import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Restaurant, Dish, OrderItem, CustomOrderItem, Order, CustomOrder } from '@/types/restaurant';
import { useChopTimeData } from '@/hooks/useChopTimeData';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MenuSection from '@/components/MenuSection';
import CartSection from '@/components/CartSection';

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
  const [selectedTown, setSelectedTown] = useState('Buea');
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
      } else {
        const fee = await getDeliveryFee(selectedTown);
        setOrderDetails(prev => ({ ...prev, deliveryFee: fee }));
      }
    };
    updateDeliveryFee();
  }, [selectedTown, orderDetails.deliveryAddress, getDeliveryFee]);

  const handleTownChange = (town: string) => {
    setSelectedTown(town);
    localStorage.setItem('choptime-town', town);
    setCart([]); // Clear cart when changing towns
  };

  const addToCart = (dish: Dish, restaurant: Restaurant, price: number) => {
    const existingItem = cart.find(item => 'dish' in item && item.dish.id === dish.id && item.restaurant.id === restaurant.id);
  
    if (existingItem && 'dish' in existingItem) {
      // If the item already exists, update the quantity
      const updatedCart = cart.map(item => {
        if ('dish' in item && item.dish.id === dish.id && item.restaurant.id === restaurant.id) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
      setCart(updatedCart);
    } else {
      // If the item doesn't exist, add it to the cart
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
  };

  const addCustomToCart = (customDishName: string, restaurant: Restaurant, estimatedPrice: number, specialInstructions?: string) => {
    const existingItem = cart.find(item => 'customDishName' in item && item.customDishName === customDishName && item.restaurant.id === restaurant.id && item.specialInstructions === specialInstructions);
  
    if (existingItem && 'customDishName' in existingItem) {
      // If the item already exists, update the quantity
      const updatedCart = cart.map(item => {
        if ('customDishName' in item && item.customDishName === customDishName && item.restaurant.id === restaurant.id && item.specialInstructions === specialInstructions) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
      setCart(updatedCart);
    } else {
      // If the item doesn't exist, add it to the cart
      const newItem: CustomOrderItem = {
        customDishName: customDishName,
        restaurant: restaurant,
        quantity: 1,
        estimatedPrice: estimatedPrice,
        specialInstructions: specialInstructions
      };
      setCart([...cart, newItem]);
    }
  
    toast({
      title: "Added to cart",
      description: `${customDishName} from ${restaurant.name} added to your order.`,
    });
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

      // Fixed WhatsApp URL - use API format for better compatibility across devices
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send/?phone=237670416449&text=${encodedMessage}&type=phone_number&app_absent=0`;
      
      // Use window.location.href for better mobile compatibility
      window.location.href = whatsappUrl;
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
        onTownChange={handleTownChange}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
      />
      
      <HeroSection />
      
      <MenuSection 
        dishes={dishes}
        restaurants={restaurants}
        restaurantMenus={restaurantMenus}
        selectedTown={selectedTown}
        onAddToCart={(item) => setCart([...cart, item])}
        onAddCustomToCart={(item) => setCart([...cart, item])}
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
    </div>
  );
};

export default Index;
