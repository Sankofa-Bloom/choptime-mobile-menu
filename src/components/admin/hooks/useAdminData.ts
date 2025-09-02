// Admin Data Management Hook
// Centralized data management for admin operations

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Restaurant,
  Dish,
  RestaurantFormData,
  DishFormData,
  RestaurantMenuItem
} from '../types';

interface UseAdminDataProps {
  onDataChange?: () => void; // Callback to notify when data changes
}

export const useAdminData = (props?: UseAdminDataProps) => {
  const { onDataChange } = props || {};
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);

  // Discover existing columns for a table by sampling one row
  const getExistingColumns = async (table: string): Promise<Set<string>> => {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.warn('Column discovery failed for', table, error);
        return new Set();
      }
      if (Array.isArray(data) && data.length > 0) {
        return new Set(Object.keys(data[0] as Record<string, unknown>));
      }
      return new Set();
    } catch (e) {
      console.warn('Column discovery exception for', table, e);
      return new Set();
    }
  };

  const filterPayloadToColumns = (payload: Record<string, unknown>, existing: Set<string>): Record<string, unknown> => {
    if (existing.size === 0) return payload; // nothing known, keep as-is
    const filtered: Record<string, unknown> = {};
    Object.keys(payload).forEach((k) => {
      if (existing.has(k)) filtered[k] = payload[k];
    });
    return filtered;
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      // Load restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (restaurantsError) {
        console.error('Error loading restaurants:', restaurantsError);
        toast({
          title: 'Error',
          description: 'Failed to load restaurants',
          variant: 'destructive'
        });
      } else {
        setRestaurants(restaurantsData || []);
      }

      // Load dishes
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select('*')
        .order('created_at', { ascending: false });

      if (dishesError) {
        console.error('Error loading dishes:', dishesError);
        toast({
          title: 'Error',
          description: 'Failed to load dishes',
          variant: 'destructive'
        });
      } else {
        setDishes(dishesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Restaurant operations
  const createRestaurant = async (data: RestaurantFormData) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .insert([data]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Restaurant created successfully'
      });

      loadData();
      onDataChange?.(); // Notify parent component of data changes
      return true;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      toast({
        title: 'Error',
        description: 'Failed to create restaurant',
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateRestaurant = async (id: string, data: RestaurantFormData) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Restaurant updated successfully'
      });

      loadData();
      onDataChange?.(); // Notify parent component of data changes
      return true;
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast({
        title: 'Error',
        description: 'Failed to update restaurant',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteRestaurant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return false;

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Restaurant deleted successfully'
      });

      loadData();
      onDataChange?.(); // Notify parent component of data changes
      return true;
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete restaurant',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Dish operations
  const createDish = async (data: DishFormData, menuItems: RestaurantMenuItem[]) => {
    if (menuItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one restaurant that serves this dish',
        variant: 'destructive'
      });
      return false;
    }

    // Validate prices
    const invalidItems = menuItems.filter(item => item.price <= 0);
    if (invalidItems.length > 0) {
      toast({
        title: 'Error',
        description: 'All restaurants must have a valid price (greater than 0)',
        variant: 'destructive'
      });
      return false;
    }

    try {
      // Filter payload to existing columns to avoid schema mismatches
      const cols = await getExistingColumns('dishes');
      const filtered = filterPayloadToColumns(data as unknown as Record<string, unknown>, cols);

      // Create dish
      const { data: newDish, error: dishError } = await supabase
        .from('dishes')
        .insert([filtered])
        .select()
        .single();

      if (dishError) throw dishError;

      // Create menu items
      const menuData = menuItems.map(item => ({
        restaurant_id: item.restaurant_id,
        dish_id: newDish.id,
        price: item.price,
        availability: item.availability
      }));

      const { error: menuError } = await supabase
        .from('restaurant_menus')
        .insert(menuData);

      if (menuError) throw menuError;

      toast({
        title: 'Success',
        description: 'Dish created successfully'
      });

      loadData();
      onDataChange?.(); // Notify parent component of data changes
      return true;
    } catch (error) {
      console.error('Error creating dish:', error);
      toast({
        title: 'Error',
        description: 'Failed to create dish',
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateDish = async (id: string, data: DishFormData, menuItems: RestaurantMenuItem[]) => {
    if (menuItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one restaurant that serves this dish',
        variant: 'destructive'
      });
      return false;
    }

    // Validate prices
    const invalidItems = menuItems.filter(item => item.price <= 0);
    if (invalidItems.length > 0) {
      toast({
        title: 'Error',
        description: 'All restaurants must have a valid price (greater than 0)',
        variant: 'destructive'
      });
      return false;
    }

    try {
      // Update dish using only known columns
      const cols = await getExistingColumns('dishes');
      const filtered = filterPayloadToColumns(data as unknown as Record<string, unknown>, cols);

      const { error: dishError } = await supabase
        .from('dishes')
        .update(filtered)
        .eq('id', id);

      if (dishError) throw dishError;

      // Get existing menu items
      const { data: existingMenuItems, error: fetchError } = await supabase
        .from('restaurant_menus')
        .select('id, restaurant_id')
        .eq('dish_id', id);

      if (fetchError) throw fetchError;

      const existingRestaurantIds = new Set(existingMenuItems?.map(item => item.restaurant_id) || []);
      const newRestaurantIds = new Set(menuItems.map(item => item.restaurant_id));

      // Delete removed menu items
      const toDelete = existingMenuItems?.filter(item => !newRestaurantIds.has(item.restaurant_id)) || [];
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('restaurant_menus')
          .delete()
          .in('id', toDelete.map(item => item.id));

        if (deleteError) throw deleteError;
      }

      // Update existing and create new menu items
      for (const menuItem of menuItems) {
        const existingItem = existingMenuItems?.find(item => item.restaurant_id === menuItem.restaurant_id);

        const menuData = {
          restaurant_id: menuItem.restaurant_id,
          dish_id: id,
          price: menuItem.price,
          availability: menuItem.availability
        };

        if (existingItem) {
          const { error: updateError } = await supabase
            .from('restaurant_menus')
            .update(menuData)
            .eq('id', existingItem.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('restaurant_menus')
            .insert([menuData]);

          if (insertError) throw insertError;
        }
      }

      toast({
        title: 'Success',
        description: 'Dish updated successfully'
      });

      loadData();
      onDataChange?.(); // Notify parent component of data changes
      return true;
    } catch (error) {
      console.error('Error updating dish:', error);
      toast({
        title: 'Error',
        description: 'Failed to update dish',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteDish = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dish?')) return false;

    try {
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Dish deleted successfully'
      });

      loadData();
      onDataChange?.(); // Notify parent component of data changes
      return true;
    } catch (error) {
      console.error('Error deleting dish:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dish',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    restaurants,
    dishes,
    loading,
    loadData,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    createDish,
    updateDish,
    deleteDish
  };
};