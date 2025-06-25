
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Restaurant, Dish, RestaurantMenu, Order, UserTown } from '@/types/restaurant';

export const useChopTimeData = (selectedTown?: string) => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantMenus, setRestaurantMenus] = useState<RestaurantMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dishes
  const fetchDishes = async () => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setDishes(data || []);
    } catch (err) {
      console.error('Error fetching dishes:', err);
      setError('Failed to load dishes');
    }
  };

  // Fetch restaurants by town
  const fetchRestaurants = async (town?: string) => {
    try {
      let query = supabase.from('restaurants').select('*');
      
      if (town) {
        query = query.eq('town', town);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      setRestaurants(data || []);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to load restaurants');
    }
  };

  // Fetch restaurant menus
  const fetchRestaurantMenus = async (town?: string) => {
    try {
      let query = supabase
        .from('restaurant_menus')
        .select(`
          *,
          restaurant:restaurants(*),
          dish:dishes(*)
        `)
        .eq('availability', true);

      if (town) {
        query = query.eq('restaurant.town', town);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setRestaurantMenus(data || []);
    } catch (err) {
      console.error('Error fetching restaurant menus:', err);
      setError('Failed to load menu items');
    }
  };

  // Save user's selected town
  const saveUserTown = async (phone: string, town: string) => {
    try {
      const { error } = await supabase
        .from('user_towns')
        .upsert({ 
          user_phone: phone, 
          town: town,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (err) {
      console.error('Error saving user town:', err);
    }
  };

  // Get user's town
  const getUserTown = async (phone: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('user_towns')
        .select('town')
        .eq('user_phone', phone)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.town || null;
    } catch (err) {
      console.error('Error getting user town:', err);
      return null;
    }
  };

  // Save order
  const saveOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error saving order:', err);
      throw err;
    }
  };

  // Get user's previous orders
  const getUserOrders = async (phone: string): Promise<Order[]> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_phone', phone)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user orders:', err);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDishes(),
        fetchRestaurants(selectedTown),
        fetchRestaurantMenus(selectedTown)
      ]);
      setLoading(false);
    };

    loadData();
  }, [selectedTown]);

  return {
    dishes,
    restaurants,
    restaurantMenus,
    loading,
    error,
    saveUserTown,
    getUserTown,
    saveOrder,
    getUserOrders,
    refetch: () => {
      fetchDishes();
      fetchRestaurants(selectedTown);
      fetchRestaurantMenus(selectedTown);
    }
  };
};
