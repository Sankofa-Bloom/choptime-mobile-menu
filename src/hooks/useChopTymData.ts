import { useState, useEffect } from 'react';
import { Restaurant, Dish, RestaurantMenu, Order, CustomOrder, DeliveryFee, UserTown } from '@/types/restaurant';

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const useChopTymData = (selectedTown?: string) => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantMenus, setRestaurantMenus] = useState<RestaurantMenu[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function for API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call error for ${endpoint}:`, error);
      throw error;
    }
  };

  // Fetch dishes
  const fetchDishes = async () => {
    try {
      const data = await apiCall('dishes');
      setDishes(data || []);
    } catch (err) {
      console.error('Error fetching dishes:', err);
      setError('Failed to load dishes');
    }
  };

  // Fetch restaurants by town
  const fetchRestaurants = async (town?: string) => {
    try {
      const endpoint = town ? `restaurants?town=${encodeURIComponent(town)}` : 'restaurants';
      const data = await apiCall(endpoint);
      setRestaurants(data || []);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to load restaurants');
    }
  };

  // Fetch restaurant menus
  const fetchRestaurantMenus = async (town?: string) => {
    try {
      const endpoint = town ? `restaurant-menus?town=${encodeURIComponent(town)}` : 'restaurant-menus';
      const data = await apiCall(endpoint);
      setRestaurantMenus(data || []);
    } catch (err) {
      console.error('Error fetching restaurant menus:', err);
      setError('Failed to load menu items');
    }
  };

  // Fetch delivery zones instead of fees
  const fetchDeliveryFees = async () => {
    try {
      const data = await apiCall('delivery-zones');
      
      // Convert zones to delivery fees format for backward compatibility
      const fees = data?.reduce((acc: DeliveryFee[], zone: any) => {
        const existingFee = acc.find(f => f.town === zone.town);
        if (!existingFee) {
          acc.push({
            id: zone.id,
            town: zone.town,
            fee: zone.fee, // Use minimum fee as default
            created_at: zone.created_at,
            updated_at: zone.updated_at
          });
        }
        return acc;
      }, []) || [];
      
      setDeliveryFees(fees);
    } catch (err) {
      console.error('Error fetching delivery fees:', err);
      setError('Failed to load delivery information');
    }
  };

  // Enhanced delivery fee calculation using zones
  const getDeliveryFee = async (town: string, locationDescription?: string): Promise<number> => {
    try {
      const data = await apiCall('calculate-delivery-fee', {
        method: 'POST',
        body: JSON.stringify({ town_name: town, location_description: locationDescription || '' })
      });
      return data && data.length > 0 ? data[0].fee : 500;
    } catch (err) {
      console.error('Error calculating delivery fee:', err);
      return 500; // Default fee
    }
  };

  // Generate order reference
  const generateOrderReference = async (town: string): Promise<string> => {
    try {
      const data = await apiCall('generate-order-reference', {
        method: 'POST',
        body: JSON.stringify({ town_name: town })
      });
      return data || `CHP-${Date.now()}`;
    } catch (err) {
      console.error('Error generating order reference:', err);
      return `CHP-${Date.now()}`;
    }
  };

  // Save user's selected town
  const saveUserTown = async (phone: string, town: string) => {
    try {
      await apiCall('save-user-town', {
        method: 'POST',
        body: JSON.stringify({ user_phone: phone, town: town })
      });
    } catch (err) {
      console.error('Error saving user town:', err);
    }
  };

  // Get user's town
  const getUserTown = async (phone: string): Promise<string | null> => {
    try {
      const data = await apiCall('get-user-town', {
        method: 'POST',
        body: JSON.stringify({ user_phone: phone })
      });
      return data?.town || null;
    } catch (err) {
      console.error('Error getting user town:', err);
      return null;
    }
  };

  // Enhanced save order with delivery zone info
  const saveOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Calculate delivery zone info
      const { data: zoneData } = await apiCall('calculate-delivery-fee', {
        method: 'POST',
        body: JSON.stringify({ town_name: orderData.user_location.split(',')[0], location_description: orderData.user_location })
      });

      const enhancedOrderData = {
        ...orderData,
        delivery_zone_id: zoneData && zoneData.length > 0 ? zoneData[0].zone_id : null,
        delivery_fee_breakdown: zoneData && zoneData.length > 0 ? 
          `${zoneData[0].zone_name}: ${zoneData[0].fee} FCFA` : null
      };

      const data = await apiCall('save-order', {
        method: 'POST',
        body: JSON.stringify(enhancedOrderData)
      });
      return data;
    } catch (err) {
      console.error('Error saving order:', err);
      throw err;
    }
  };

  // Save custom order
  const saveCustomOrder = async (orderData: Omit<CustomOrder, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const data = await apiCall('save-custom-order', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      return data;
    } catch (err) {
      console.error('Error saving custom order:', err);
      throw err;
    }
  };

  // Get user's previous orders
  const getUserOrders = async (phone: string): Promise<Order[]> => {
    try {
      const data = await apiCall('get-user-orders', {
        method: 'POST',
        body: JSON.stringify({ user_phone: phone })
      });
      return data || [];
    } catch (err) {
      console.error('Error fetching user orders:', err);
      return [];
    }
  };

  // Get user's previous custom orders
  const getUserCustomOrders = async (phone: string): Promise<CustomOrder[]> => {
    try {
      const data = await apiCall('get-user-custom-orders', {
        method: 'POST',
        body: JSON.stringify({ user_phone: phone })
      });
      return data || [];
    } catch (err) {
      console.error('Error fetching user custom orders:', err);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDishes(),
        fetchRestaurants(selectedTown),
        fetchRestaurantMenus(selectedTown),
        fetchDeliveryFees()
      ]);
      setLoading(false);
    };

    loadData();
  }, [selectedTown]);

  return {
    dishes,
    restaurants,
    restaurantMenus,
    deliveryFees,
    loading,
    error,
    getDeliveryFee,
    generateOrderReference,
    saveUserTown,
    getUserTown,
    saveOrder,
    saveCustomOrder,
    getUserOrders,
    getUserCustomOrders,
    refetch: () => {
      fetchDishes();
      fetchRestaurants(selectedTown);
      fetchRestaurantMenus(selectedTown);
      fetchDeliveryFees();
    }
  };
};
