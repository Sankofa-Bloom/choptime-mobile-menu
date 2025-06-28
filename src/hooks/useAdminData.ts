
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Restaurant, Dish, RestaurantMenu } from '@/types/restaurant';
import { DeliveryZone, AdminStats, RestaurantFormData, DishFormData, MenuItemFormData } from '@/types/admin';

export const useAdminData = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchRestaurants(),
      fetchDishes(),
      fetchDeliveryZones(),
      fetchStats()
    ]);
    setLoading(false);
  };

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('name');
    
    if (!error) setRestaurants(data || []);
  };

  const fetchDishes = async () => {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .order('name');
    
    if (!error) setDishes(data || []);
  };

  const fetchDeliveryZones = async () => {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .order('town', { ascending: true });
    
    if (!error) setDeliveryZones(data || []);
  };

  const fetchStats = async () => {
    const { data, error } = await supabase.rpc('get_order_stats');
    if (!error && data && data.length > 0) {
      setStats(data[0]);
    }
  };

  // Restaurant management
  const createRestaurant = async (restaurantData: RestaurantFormData) => {
    const { data, error } = await supabase
      .from('restaurants')
      .insert([restaurantData])
      .select()
      .single();
    
    if (!error) {
      await fetchRestaurants();
      return { success: true, data };
    }
    return { success: false, error: error.message };
  };

  const updateRestaurant = async (id: string, restaurantData: Partial<RestaurantFormData>) => {
    const { data, error } = await supabase
      .from('restaurants')
      .update(restaurantData)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) {
      await fetchRestaurants();
      return { success: true, data };
    }
    return { success: false, error: error.message };
  };

  const deleteRestaurant = async (id: string) => {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await fetchRestaurants();
      return { success: true };
    }
    return { success: false, error: error.message };
  };

  // Dish management
  const createDish = async (dishData: DishFormData) => {
    const { data, error } = await supabase
      .from('dishes')
      .insert([{ ...dishData, admin_created: true }])
      .select()
      .single();
    
    if (!error) {
      await fetchDishes();
      return { success: true, data };
    }
    return { success: false, error: error.message };
  };

  const updateDish = async (id: string, dishData: Partial<DishFormData>) => {
    const { data, error } = await supabase
      .from('dishes')
      .update(dishData)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) {
      await fetchDishes();
      return { success: true, data };
    }
    return { success: false, error: error.message };
  };

  const deleteDish = async (id: string) => {
    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await fetchDishes();
      return { success: true };
    }
    return { success: false, error: error.message };
  };

  // Menu item management
  const createMenuItem = async (menuData: MenuItemFormData) => {
    const { data, error } = await supabase
      .from('restaurant_menus')
      .insert([menuData])
      .select()
      .single();
    
    if (!error) {
      return { success: true, data };
    }
    return { success: false, error: error.message };
  };

  const updateMenuItem = async (id: string, menuData: Partial<MenuItemFormData>) => {
    const { data, error } = await supabase
      .from('restaurant_menus')
      .update(menuData)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) {
      return { success: true, data };
    }
    return { success: false, error: error.message };
  };

  const deleteMenuItem = async (id: string) => {
    const { error } = await supabase
      .from('restaurant_menus')
      .delete()
      .eq('id', id);
    
    if (!error) {
      return { success: true };
    }
    return { success: false, error: error.message };
  };

  // Delivery zone management
  const createDeliveryZone = async (zoneData: Omit<DeliveryZone, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('delivery_zones')
      .insert([zoneData])
      .select()
      .single();
    
    if (!error) {
      await fetchDeliveryZones();
      return { success: true, data };
    }
    return { success: false, error: error.message };
  };

  const updateDeliveryZone = async (id: string, zoneData: Partial<DeliveryZone>) => {
    const { data, error } = await supabase
      .from('delivery_zones')
      .update(zoneData)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) {
      await fetchDeliveryZones();
      return { success: true, data };
    }
    return { success: false, error: error.message };
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    restaurants,
    dishes,
    deliveryZones,
    stats,
    loading,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    createDish,
    updateDish,
    deleteDish,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    createDeliveryZone,
    updateDeliveryZone,
    refetch: fetchData
  };
};
