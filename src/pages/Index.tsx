import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Restaurant, Dish, OrderItem, CustomOrderItem, Order, CustomOrder } from '@/types/restaurant';
import { useKwataLinkData } from '@/hooks/useChopTimeData';
import PaymentDetails from '@/components/PaymentDetails';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MenuSection from '@/components/MenuSection';
import CartSection from '@/components/CartSection';
import Footer from '@/components/Footer';
import TownSelector from '@/components/TownSelector';
import RestaurantSelectionModal from '@/components/RestaurantSelectionModal';
import CustomOrderModal from '@/components/CustomOrderModal';
import { useNavigate, useLocation } from 'react-router-dom';



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
    paymentMethod: 'campay',
    total: 0,
    deliveryFee: 0
  });

  // Modal states
  const [showTownSelector, setShowTownSelector] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [paymentOrderDetails, setPaymentOrderDetails] = useState<any>(null);
  const [customOrder, setCustomOrder] = useState<CustomOrder | null>(null);

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
  } = useKwataLinkData(selectedTown);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Memoized calculations for better performance
  const subtotal = useMemo(() => calculateSubtotal(), [cart]);
  const total = useMemo(() => subtotal + orderDetails.deliveryFee, [subtotal, orderDetails.deliveryFee]);
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  // Load user's town preference on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      const savedTown = localStorage.getItem('kwatalink-town');
      if (savedTown && (savedTown === 'Buea' || savedTown === 'Limbe')) {
        setSelectedTown(savedTown);
      } else {
        setShowTownSelector(true);
      }
    };
    loadUserPreferences();
  }, []);

  // Handle payment success state
  useEffect(() => {
    if (location.state?.paymentSuccess) {
      const { orderReference, paymentReference } = location.state;
      
      // Show success toast
      toast({
        title: "Payment Successful! 🎉",
        description: `Your order (${orderReference}) has been confirmed. We'll notify you when it's ready for delivery.`,
        variant: "default",
      });
      
      // Clear cart
      setCart([]);
      setOrderDetails({
        customerName: '',
        phone: '',
        deliveryAddress: '',
        additionalMessage: '',
        paymentMethod: 'campay',
        total: 0,
        deliveryFee: 0
      });
      
      // Clear location state to prevent showing again on refresh
      navigate('/', { replace: true });
    }
  }, [location.state, toast, navigate]);

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

  const handleTownChange = useCallback((town: string) => {
    setSelectedTown(town);
    localStorage.setItem('kwatalink-town', town);
    setCart([]); // Clear cart when changing towns
    setShowTownSelector(false);
  }, []);

  const handleDishSelect = useCallback((dish: Dish) => {
    setSelectedDish(dish);
    setShowRestaurantModal(true);
  }, []);

  const handleRestaurantSelect = useCallback((restaurant: Restaurant, price: number) => {
    if (selectedDish) {
      addToCart(selectedDish, restaurant, price);
    }
    setShowRestaurantModal(false);
    setSelectedDish(null);
  }, [selectedDish]);

  const addToCart = useCallback((dish: Dish, restaurant: Restaurant, price: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        'dish' in item && 
        item.dish.id === dish.id && 
        item.restaurant.id === restaurant.id
      );
    
      if (existingItem && 'dish' in existingItem) {
        return prevCart.map(item => {
          if ('dish' in item && item.dish.id === dish.id && item.restaurant.id === restaurant.id) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        });
      } else {
        const newItem: OrderItem = {
          dish: dish,
          restaurant: restaurant,
          quantity: 1,
          price: price
        };
        return [...prevCart, newItem];
      }
    });
  
    toast({
      title: "Added to cart",
      description: `${dish.name} from ${restaurant.name} added to your order.`,
    });

    // Scroll to cart section after adding item
    setTimeout(() => {
      scrollToCart();
    }, 100);
  }, [toast]);

  const addCustomToCart = useCallback((customOrderItem: CustomOrderItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        'customDishName' in item && 
        item.customDishName === customOrderItem.customDishName && 
        item.restaurant.id === customOrderItem.restaurant.id && 
        item.specialInstructions === customOrderItem.specialInstructions
      );
    
      if (existingItem && 'customDishName' in existingItem) {
        return prevCart.map(item => {
          if ('customDishName' in item && 
              item.customDishName === customOrderItem.customDishName && 
              item.restaurant.id === customOrderItem.restaurant.id && 
              item.specialInstructions === customOrderItem.specialInstructions) {
            return { ...item, quantity: item.quantity + customOrderItem.quantity };
          }
          return item;
        });
      } else {
        return [...prevCart, customOrderItem];
      }
    });
  
    toast({
      title: "Added to cart",
      description: `${customOrderItem.customDishName} from ${customOrderItem.restaurant.name} added to your order.`,
    });
    
    setShowCustomOrderModal(false);

    // Scroll to cart section after adding custom item
    setTimeout(() => {
      scrollToCart();
    }, 100);
  }, [toast]);

  const handleQuantityUpdate = useCallback((index: number, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter((_, i) => i !== index);
      } else {
        const updatedCart = [...prevCart];
        updatedCart[index].quantity = newQuantity;
        return updatedCart;
      }
    });
  }, []);

  const calculateSubtotal = useCallback(() => {
    return cart.reduce((sum, item) => {
      return sum + (('dish' in item ? item.price : item.estimatedPrice) * item.quantity);
    }, 0);
  }, [cart]);

  const calculateTotal = useCallback(() => {
    return calculateSubtotal() + orderDetails.deliveryFee;
  }, [calculateSubtotal, orderDetails.deliveryFee]);

  const getAvailableRestaurantsForDish = useCallback((dishId: string): Restaurant[] => {
    return restaurants.filter(restaurant => 
      restaurantMenus.some(menu => menu.dish_id === dishId && menu.restaurant_id === restaurant.id)
    );
  }, [restaurants, restaurantMenus]);

  const getDishPrice = useCallback((dishId: string, restaurantId: string): number => {
    const menu = restaurantMenus.find(m => m.dish_id === dishId && m.restaurant_id === restaurantId);
    return menu?.price || 0;
  };



  const handlePlaceOrder = async () => {
    // Validation
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before ordering.",
        variant: "destructive"
      });
      return;
    }

    if (!orderDetails.customerName || !orderDetails.phone || !orderDetails.deliveryAddress) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Get the first restaurant from cart for order details
    const firstCartItem = cart[0];
    const restaurant = restaurants.find(r => r.id === firstCartItem.restaurant.id) || null;

    // Create order details for PaymentDetails component
    const orderData = {
      dishName: firstCartItem.dish?.name || firstCartItem.customDishName || 'Mixed Order',
      quantity: cart.reduce((total, item) => total + item.quantity, 0),
      price: calculateSubtotal(),
      total: calculateTotal(),
      customerName: orderDetails.customerName,
      customerPhone: orderDetails.phone,
      location: `${selectedTown}, ${orderDetails.deliveryAddress}`
    };

    console.log('Creating order data:', {
      orderData,
      restaurant,
      firstCartItem,
      orderDetails,
      selectedTown
    });

    setSelectedRestaurant(restaurant);
    setPaymentOrderDetails(orderData);
    setShowPaymentDetails(true);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-choptime-beige">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-choptime-orange mx-auto mb-4"></div>
          <p className="text-choptime-brown font-medium">Loading delicious options...</p>
          <p className="text-choptime-brown/60 text-sm mt-2">Please wait while we prepare your menu</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-choptime-beige">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-choptime-brown mb-2">Oops! Something went wrong</h2>
          <p className="text-choptime-brown/70 mb-4">We're having trouble loading the menu. Please try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-choptime-orange text-white px-6 py-2 rounded-lg hover:bg-choptime-orange/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-choptime-beige relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 african-pattern"></div>
      </div>
      
      <Header 
        selectedTown={selectedTown}
        cart={cart}
        cartItemCount={cartItemCount}
        onTownChange={() => setShowTownSelector(true)}
        onCartClick={() => setShowCart(!showCart)}
        showPWAPrompt={false}
        onInstallPWA={() => {}}
        onDismissPWA={() => {}}
      />
      
      <main className="relative z-10">
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
          <div id="cart-section">
            <CartSection 
              cart={cart}
              orderDetails={orderDetails}
              selectedTown={selectedTown}
              onOrderDetailsChange={setOrderDetails}
              onQuantityUpdate={handleQuantityUpdate}
              onPlaceOrder={handlePlaceOrder}
              calculateSubtotal={calculateSubtotal}
              calculateTotal={calculateTotal}
            />
          </div>
        )}
      </main>
      
      <Footer />

      {/* Payment Details Modal */}
      {showPaymentDetails && paymentOrderDetails && selectedRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl">
            <PaymentDetails
              selectedRestaurant={selectedRestaurant}
              orderDetails={paymentOrderDetails}
              customOrder={customOrder}
              onBack={() => setShowPaymentDetails(false)}
              onOrderComplete={() => {
                setShowPaymentDetails(false);
                setCart([]);
                setOrderDetails({
                  customerName: '',
                  phone: '',
                  deliveryAddress: '',
                  additionalMessage: '',
                  paymentMethod: 'campay',
                  total: 0,
                  deliveryFee: 0
                });
                toast({
                  title: "Order Submitted!",
                  description: "Your order has been submitted successfully.",
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <TownSelector 
        selectedTown={selectedTown}
        onTownSelect={handleTownChange}
        show={showTownSelector}
        onClose={() => setShowTownSelector(false)}
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
