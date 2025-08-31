import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// Query keys for React Query
export const QUERY_KEYS = {
  dishes: ['dishes'] as const,
  restaurants: (town?: string) => ['restaurants', town] as const,
  restaurantMenus: (town?: string) => ['restaurant-menus', town] as const,
  deliveryZones: ['delivery-zones'] as const,
} as const;

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

// Helper function for API calls (defined at module level)
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const url = `${API_BASE_URL}/api/${endpoint}`;
    console.log('🔧 Making API call to:', url);
    console.log('🔧 Request options:', { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log('🔧 API Response status:', response.status);
    console.log('🔧 API Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 API Response error:', errorText);
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🔧 API Response data type:', typeof data);
    console.log('🔧 API Response sample:', Array.isArray(data) ? `Array(${data.length}) items` : JSON.stringify(data).substring(0, 200) + '...');

    return data;
  } catch (error) {
    console.error(`🚨 API call error for ${endpoint}:`, error);
    console.error('🚨 Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    throw error;
  }
};

// Test connectivity on mount
if (typeof window !== 'undefined') {
  fetch(`${API_BASE_URL}/api/ping`)
    .then(response => response.json())
    .then(data => console.log('🔧 Connectivity test successful:', data))
    .catch(error => console.error('🔧 Connectivity test failed:', error));
}

// API fetch functions for React Query
const fetchDishesApi = async (): Promise<Dish[]> => {
  const response = await apiCall('dishes');
  return response?.data || response || [];
};

const fetchRestaurantsApi = async (town?: string): Promise<Restaurant[]> => {
  const endpoint = town ? `restaurants?town=${encodeURIComponent(town)}` : 'restaurants';
  const response = await apiCall(endpoint);
  return response?.data || response || [];
};

const fetchRestaurantMenusApi = async (town?: string): Promise<RestaurantMenu[]> => {
  const endpoint = town ? `restaurant-menus?town=${encodeURIComponent(town)}` : 'restaurant-menus';
  const response = await apiCall(endpoint);
  return response?.data || response || [];
};

const fetchDeliveryZonesApi = async (): Promise<DeliveryFee[]> => {
  const response = await apiCall('delivery-zones');
  const data = response?.data || response || [];

  // Convert zones to delivery fees format for backward compatibility
  return data?.reduce((acc: DeliveryFee[], zone: { id: string; town: string; fee: number; created_at?: string; updated_at?: string }) => {
    const existingFee = acc.find(f => f.town === zone.town);
    if (!existingFee) {
      acc.push({
        id: zone.id,
        town: zone.town,
        fee: zone.fee,
        created_at: zone.created_at,
        updated_at: zone.updated_at
      });
    }
    return acc;
  }, []) || [];
};

export const useChopTymData = (selectedTown?: string) => {
  const queryClient = useQueryClient();

  // React Query hooks with automatic caching and deduping
  console.log('🔧 Setting up dishes query for town:', selectedTown);
  const dishesQuery = useQuery({
    queryKey: QUERY_KEYS.dishes,
    queryFn: () => {
      console.log('🔧 Dishes query function called');
      return fetchDishesApi();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const restaurantsQuery = useQuery({
    queryKey: QUERY_KEYS.restaurants(selectedTown),
    queryFn: () => fetchRestaurantsApi(selectedTown),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!selectedTown, // Only fetch when town is selected
  });

  const restaurantMenusQuery = useQuery({
    queryKey: QUERY_KEYS.restaurantMenus(selectedTown),
    queryFn: () => fetchRestaurantMenusApi(selectedTown),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!selectedTown,
  });

  const deliveryZonesQuery = useQuery({
    queryKey: QUERY_KEYS.deliveryZones,
    queryFn: fetchDeliveryZonesApi,
    staleTime: 10 * 60 * 1000, // 10 minutes (zones don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
  
  // Enhanced error logging
  const logError = (source: string, err: unknown) => {
    console.error(`🚨 ERROR in ${source}:`, err);
    if (err && typeof err === 'object' && 'message' in err) {
      console.error('🚨 Error details:', {
        message: (err as any).message,
        status: (err as any).status,
        response: (err as any).response,
        stack: (err as any).stack
      });
    }
  };
  
  // Simple delivery fee lookup function (no API calls needed)
  const getDeliveryFeeForTown = useCallback((town: string): number => {
    const deliveryFees = deliveryZonesQuery.data || [];
    const deliveryInfo = deliveryFees.find(
      df => df.town.toLowerCase() === town.toLowerCase()
    );
    return deliveryInfo?.fee || 1000; // Default fee if town not found
  }, [deliveryZonesQuery.data]);



  // Fetch dishes

  // Fetch restaurant menus

  // Fetch delivery zones instead of fees



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
      const deliveryFees = deliveryZonesQuery.data || [];
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

  // Real-time refresh function
  const refreshAllData = useCallback(async (forceRefresh = false) => {
    console.log('🔄 Refreshing all data...', { forceRefresh, selectedTown });
    try {
      if (forceRefresh) {
        // Force refresh by invalidating all queries
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurants(selectedTown) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurantMenus(selectedTown) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.deliveryZones });
      }
      
      // Refetch all queries
      await Promise.all([
        dishesQuery.refetch(),
        restaurantsQuery.refetch(),
        restaurantMenusQuery.refetch(),
        deliveryZonesQuery.refetch()
      ]);
      
      console.log('✅ Data refresh completed');
    } catch (err) {
      console.error('❌ Error during data refresh:', err);
    }
  }, [selectedTown, queryClient, dishesQuery, restaurantsQuery, restaurantMenusQuery, deliveryZonesQuery]);

  return {
    // React Query data
    dishes: dishesQuery.data || [],
    restaurants: restaurantsQuery.data || [],
    restaurantMenus: restaurantMenusQuery.data || [],
    deliveryFees: deliveryZonesQuery.data || [],

    // Loading states
    loading: dishesQuery.isLoading || restaurantsQuery.isLoading || restaurantMenusQuery.isLoading || deliveryZonesQuery.isLoading,
    loadingDishes: dishesQuery.isLoading,
    loadingRestaurants: restaurantsQuery.isLoading,
    loadingMenus: restaurantMenusQuery.isLoading,
    loadingFees: deliveryZonesQuery.isLoading,

    // Error states with detailed logging
    error: (() => {
      const errors = [
        dishesQuery.error,
        restaurantsQuery.error,
        restaurantMenusQuery.error,
        deliveryZonesQuery.error
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('🚨 API Query Errors:', errors);
        return errors.map(err => err?.message || 'Unknown error').join('; ');
      }
      return null;
    })(),

    // Utility functions
    getDeliveryFeeForTown,
    generateOrderReference,
    saveUserTown,
    getUserTown,
    saveOrder,
    saveCustomOrder,
    getUserOrders,
    getUserCustomOrders,

    // React Query actions
    refetch: useCallback(() => {
      dishesQuery.refetch();
      restaurantsQuery.refetch();
      restaurantMenusQuery.refetch();
      deliveryZonesQuery.refetch();
    }, [dishesQuery, restaurantsQuery, restaurantMenusQuery, deliveryZonesQuery]),

    refetchForTown: useCallback((town?: string) => {
      // Invalidate and refetch town-specific queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurants(town) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurantMenus(town) });
    }, [queryClient]),

    // Real-time refresh capabilities
    refreshAllData,
    isRefreshing: dishesQuery.isFetching || restaurantsQuery.isFetching || restaurantMenusQuery.isFetching || deliveryZonesQuery.isFetching,
  };
};
