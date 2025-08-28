import { useState, useEffect, useCallback } from 'react';
import { Restaurant, Dish, RestaurantMenu, Order, CustomOrder, DeliveryFee, UserTown } from '@/types/restaurant';

// Smart API base URL detection for cross-platform compatibility
const getApiBaseUrl = () => {
  // If explicitly set in environment, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // For web deployment, detect current origin for same-origin API calls
  if (typeof window !== 'undefined') {
    // In browser: use current origin for same-origin API calls
    return window.location.origin;
  }
  
  // Fallback for development/SSR
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

  // Debug logging to see what API base URL is being used
console.log('🔧 API_BASE_URL Debug:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  window_origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
  final_API_BASE_URL: API_BASE_URL,
  timestamp: new Date().toISOString()
});

console.log('🧪 Expected working endpoints:');
console.log('✅ Should work: ' + API_BASE_URL + '/api/hello');
console.log('✅ Should work: ' + API_BASE_URL + '/api/ping');
console.log('🧪 Testing: ' + API_BASE_URL + '/api/dishes');
console.log('🧪 Testing: ' + API_BASE_URL + '/api/restaurants');
console.log('🧪 Testing: ' + API_BASE_URL + '/api/restaurant-menus');

export const useChopTymData = (selectedTown?: string) => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantMenus, setRestaurantMenus] = useState<RestaurantMenu[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced error logging
  const logError = (source: string, err: any) => {
    console.error(`🚨 ERROR in ${source}:`, err);
    console.error('🚨 Error details:', {
      message: err?.message,
      status: err?.status,
      response: err?.response,
      stack: err?.stack
    });
    setError(`Failed to load ${source}`);
  };
  
  // Simple delivery fee lookup function (no API calls needed)
  const getDeliveryFeeForTown = useCallback((town: string): number => {
    const deliveryInfo = deliveryFees.find(
      df => df.town.toLowerCase() === town.toLowerCase()
    );
    return deliveryInfo?.fee || 1000; // Default fee if town not found
  }, [deliveryFees]);

  // Helper function for API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const url = `${API_BASE_URL}/api/${endpoint}`;
      console.log('🔧 Making API call to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log('🔧 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 API Response error:', errorText);
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔧 API Response data type:', typeof data);
      console.log('🔧 API Response sample:', Array.isArray(data) ? `Array(${data.length})` : data);
      
      return data;
    } catch (error) {
      console.error(`🚨 API call error for ${endpoint}:`, error);
      throw error;
    }
  };

  // Fetch dishes
  const fetchDishes = async () => {
    try {
      console.log('🧪 Fetching dishes from:', API_BASE_URL + '/api/dishes');
      const response = await apiCall('dishes');
      console.log('✅ Dishes response:', response);
      
      // Handle both direct data and wrapped response formats
      const data = response?.data || response || [];
      setDishes(data);
    } catch (err) {
      logError('dishes', err);
    }
  };

  // Fetch restaurants by town
  const fetchRestaurants = async (town?: string) => {
    try {
      const endpoint = town ? `restaurants?town=${encodeURIComponent(town)}` : 'restaurants';
      console.log('🧪 Fetching restaurants from:', API_BASE_URL + '/api/' + endpoint);
      const response = await apiCall(endpoint);
      console.log('✅ Restaurants response:', response);
      
      // Handle both direct data and wrapped response formats
      const data = response?.data || response || [];
      setRestaurants(data);
    } catch (err) {
      logError('restaurants', err);
    }
  };

  // Fetch restaurant menus
  const fetchRestaurantMenus = async (town?: string) => {
    try {
      const endpoint = town ? `restaurant-menus?town=${encodeURIComponent(town)}` : 'restaurant-menus';
      console.log('🧪 Fetching restaurant menus from:', API_BASE_URL + '/api/' + endpoint);
      const response = await apiCall(endpoint);
      console.log('✅ Restaurant menus response:', response);
      
      // Handle both direct data and wrapped response formats
      const data = response?.data || response || [];
      setRestaurantMenus(data);
    } catch (err) {
      logError('restaurant menus', err);
    }
  };

  // Fetch delivery zones instead of fees
  const fetchDeliveryFees = async () => {
    try {
      console.log('🧪 Fetching delivery zones from:', API_BASE_URL + '/api/delivery-zones');
      const response = await apiCall('delivery-zones');
      console.log('✅ Delivery zones response:', response);
      
      // Handle both direct data and wrapped response formats
      const data = response?.data || response || [];
      
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
      logError('delivery fees', err);
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

  // Save order with delivery zone info from local data
  const saveOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Get delivery zone info from local delivery fees data
      const town = orderData.user_location.split(',')[0];
      const deliveryInfo = deliveryFees.find(
        df => df.town.toLowerCase() === town.toLowerCase()
      );

      const enhancedOrderData = {
        ...orderData,
        delivery_zone_id: deliveryInfo?.id || null,
        delivery_fee_breakdown: deliveryInfo ? 
          `${deliveryInfo.town}: ${deliveryInfo.fee} FCFA` : null
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
      setError(null); // Reset error state

      try {
        await Promise.all([
          fetchDishes(),
          fetchRestaurants(selectedTown),
          fetchRestaurantMenus(selectedTown),
          fetchDeliveryFees()
        ]);
      } catch (err) {
        console.error('🚨 Failed to load data:', err);
        setError('Failed to load menu data');
      } finally {
        setLoading(false);
      }
    };

    // Only load data once on mount, not on every selectedTown change
    // The data is town-filtered at the API level, so we don't need to refetch everything
    loadData();
  }, []); // Empty dependency array - only run once on mount

  return {
    dishes,
    restaurants,
    restaurantMenus,
    deliveryFees,
    loading,
    error,
    getDeliveryFeeForTown,
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
    },
    // Function to refetch town-specific data when town changes
    refetchForTown: (town?: string) => {
      fetchRestaurants(town);
      fetchRestaurantMenus(town);
    },

    // =============================================================================
    // ADMIN DASHBOARD FUNCTIONS
    // =============================================================================

    // Daily Menus Management
    fetchDailyMenus: async (filters?: { date?: string; restaurant_id?: string }) => {
      try {
        const queryParams = new URLSearchParams();
        if (filters?.date) queryParams.append('date', filters.date);
        if (filters?.restaurant_id) queryParams.append('restaurant_id', filters.restaurant_id);

        const endpoint = `/daily-menus${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await apiCall(endpoint);
        return response || [];
      } catch (err) {
        logError('daily menus', err);
        return [];
      }
    },

    createDailyMenu: async (menuData: { restaurant_id: string; date: string; is_active?: boolean }) => {
      try {
        const data = await apiCall('daily-menus', {
          method: 'POST',
          body: JSON.stringify(menuData)
        });
        return data;
      } catch (err) {
        console.error('Error creating daily menu:', err);
        throw err;
      }
    },

    updateDailyMenu: async (menuId: string, updates: any) => {
      try {
        const data = await apiCall(`daily-menus/${menuId}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        return data;
      } catch (err) {
        console.error('Error updating daily menu:', err);
        throw err;
      }
    },

    deleteDailyMenu: async (menuId: string) => {
      try {
        await apiCall(`daily-menus/${menuId}`, {
          method: 'DELETE'
        });
        return true;
      } catch (err) {
        console.error('Error deleting daily menu:', err);
        throw err;
      }
    },

    addDailyMenuItem: async (menuId: string, itemData: {
      dish_id: string;
      price: number;
      availability?: boolean;
      available_quantity?: number;
      special_notes?: string;
    }) => {
      try {
        const data = await apiCall(`daily-menus/${menuId}/items`, {
          method: 'POST',
          body: JSON.stringify(itemData)
        });
        return data;
      } catch (err) {
        console.error('Error adding daily menu item:', err);
        throw err;
      }
    },

    updateDailyMenuItem: async (itemId: string, updates: any) => {
      try {
        const data = await apiCall(`daily-menus/items/${itemId}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        return data;
      } catch (err) {
        console.error('Error updating daily menu item:', err);
        throw err;
      }
    },

    removeDailyMenuItem: async (itemId: string) => {
      try {
        await apiCall(`daily-menus/items/${itemId}`, {
          method: 'DELETE'
        });
        return true;
      } catch (err) {
        console.error('Error removing daily menu item:', err);
        throw err;
      }
    },

    // Driver Management
    fetchDrivers: async (availableOnly?: boolean) => {
      try {
        const endpoint = availableOnly ? '/drivers?available_only=true' : '/drivers';
        const response = await apiCall(endpoint);
        return response || [];
      } catch (err) {
        logError('drivers', err);
        return [];
      }
    },

    createDriver: async (driverData: {
      name: string;
      phone: string;
      email?: string;
      license_number?: string;
      vehicle_type: string;
      vehicle_registration?: string;
    }) => {
      try {
        const data = await apiCall('drivers', {
          method: 'POST',
          body: JSON.stringify(driverData)
        });
        return data;
      } catch (err) {
        console.error('Error creating driver:', err);
        throw err;
      }
    },

    updateDriver: async (driverId: string, updates: any) => {
      try {
        const data = await apiCall(`drivers/${driverId}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        return data;
      } catch (err) {
        console.error('Error updating driver:', err);
        throw err;
      }
    },

    updateDriverLocation: async (driverId: string, latitude: number, longitude: number) => {
      try {
        const data = await apiCall(`drivers/${driverId}/location`, {
          method: 'PUT',
          body: JSON.stringify({ latitude, longitude })
        });
        return data;
      } catch (err) {
        console.error('Error updating driver location:', err);
        throw err;
      }
    },

    deleteDriver: async (driverId: string) => {
      try {
        await apiCall(`drivers/${driverId}`, {
          method: 'DELETE'
        });
        return true;
      } catch (err) {
        console.error('Error deleting driver:', err);
        throw err;
      }
    },

    // Enhanced Restaurant Management
    updateRestaurant: async (restaurantId: string, updates: any) => {
      try {
        const data = await apiCall(`restaurants/${restaurantId}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        return data;
      } catch (err) {
        console.error('Error updating restaurant:', err);
        throw err;
      }
    },

    // Enhanced Order Management
    updateOrderStatus: async (orderId: string, status: string, driverInfo?: {
      driver_id?: string;
      driver_name?: string;
      driver_phone?: string;
    }) => {
      try {
        const data = await apiCall(`orders/${orderId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status, ...driverInfo })
        });
        return data;
      } catch (err) {
        console.error('Error updating order status:', err);
        throw err;
      }
    },

    assignDriverToOrder: async (orderId: string, driverId: string) => {
      try {
        const data = await apiCall(`orders/${orderId}/assign-driver`, {
          method: 'PUT',
          body: JSON.stringify({ driver_id: driverId })
        });
        return data;
      } catch (err) {
        console.error('Error assigning driver to order:', err);
        throw err;
      }
    },

    // Analytics
    fetchOrderAnalytics: async (filters?: { start_date?: string; end_date?: string }) => {
      try {
        const queryParams = new URLSearchParams();
        if (filters?.start_date) queryParams.append('start_date', filters.start_date);
        if (filters?.end_date) queryParams.append('end_date', filters.end_date);

        const endpoint = `/analytics/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await apiCall(endpoint);
        return response || [];
      } catch (err) {
        logError('order analytics', err);
        return [];
      }
    },

    fetchRestaurantAnalytics: async (filters?: {
      restaurant_id?: string;
      start_date?: string;
      end_date?: string;
    }) => {
      try {
        const queryParams = new URLSearchParams();
        if (filters?.restaurant_id) queryParams.append('restaurant_id', filters.restaurant_id);
        if (filters?.start_date) queryParams.append('start_date', filters.start_date);
        if (filters?.end_date) queryParams.append('end_date', filters.end_date);

        const endpoint = `/analytics/restaurants${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await apiCall(endpoint);
        return response || [];
      } catch (err) {
        logError('restaurant analytics', err);
        return [];
      }
    },

    // System Settings
    fetchSystemSettings: async () => {
      try {
        const response = await apiCall('system-settings');
        return response || [];
      } catch (err) {
        logError('system settings', err);
        return [];
      }
    },

    updateSystemSetting: async (key: string, value: string, type: string) => {
      try {
        const data = await apiCall(`system-settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({
            setting_value: value,
            setting_type: type
          })
        });
        return data;
      } catch (err) {
        console.error('Error updating system setting:', err);
        throw err;
      }
    },

    createSystemSetting: async (settingData: {
      setting_key: string;
      setting_value: string;
      setting_type: string;
      description?: string;
    }) => {
      try {
        const data = await apiCall('system-settings', {
          method: 'POST',
          body: JSON.stringify(settingData)
        });
        return data;
      } catch (err) {
        console.error('Error creating system setting:', err);
        throw err;
      }
    },

    // Admin dashboard utilities
    getFoodImages: async () => {
      try {
        const response = await apiCall('food-images');
        return response || { categories: {}, available: [] };
      } catch (err) {
        logError('food images', err);
        return { categories: {}, available: [] };
      }
    },

    // Supabase Storage Functions
    uploadImage: async (file: File, metadata?: {
      category?: string;
      entity_type?: string;
      entity_id?: string;
    }) => {
      try {
        const formData = new FormData();
        formData.append('image', file);

        if (metadata?.category) formData.append('category', metadata.category);
        if (metadata?.entity_type) formData.append('entity_type', metadata.entity_type);
        if (metadata?.entity_id) formData.append('entity_id', metadata.entity_id);

        const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        return await response.json();
      } catch (err) {
        console.error('Error uploading image:', err);
        throw err;
      }
    },

    getImageUrl: async (filePath: string) => {
      try {
        const response = await apiCall(`image-url/${encodeURIComponent(filePath)}`);
        return response?.image_url || null;
      } catch (err) {
        logError('image url', err);
        return null;
      }
    },

    deleteImage: async (filePath: string) => {
      try {
        await apiCall(`delete-image/${encodeURIComponent(filePath)}`, {
          method: 'DELETE'
        });
        return true;
      } catch (err) {
        console.error('Error deleting image:', err);
        throw err;
      }
    },

    listImages: async (category?: string, entityType?: string, entityId?: string) => {
      try {
        let endpoint = 'list-images';
        if (category) endpoint += `/${category}`;
        if (entityType) endpoint += `/${entityType}`;
        if (entityId) endpoint += `/${entityId}`;

        const response = await apiCall(endpoint);
        return response || { files: [], count: 0 };
      } catch (err) {
        logError('list images', err);
        return { files: [], count: 0 };
      }
    },

    createStorageBucket: async () => {
      try {
        const response = await apiCall('create-storage-bucket', {
          method: 'POST'
        });
        return response;
      } catch (err) {
        console.error('Error creating storage bucket:', err);
        throw err;
      }
    }

    // Note: Admin functions are available individually:
    // fetchDailyMenus, createDailyMenu, updateDailyMenu, deleteDailyMenu,
    // addDailyMenuItem, updateDailyMenuItem, removeDailyMenuItem,
    // fetchDrivers, createDriver, updateDriver, deleteDriver, updateDriverLocation,
    // updateRestaurant, updateOrderStatus, assignDriverToOrder,
    // fetchOrderAnalytics, fetchRestaurantAnalytics,
    // fetchSystemSettings, updateSystemSetting, createSystemSetting
  };
};
