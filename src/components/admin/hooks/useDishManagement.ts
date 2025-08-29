// Dish Management Hook
// Handles complex dish and menu item operations

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DishFormData, RestaurantMenuItem, Restaurant, Dish } from '../types';

export const useDishManagement = (restaurants: Restaurant[]) => {
  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>([]);
  const [loadingMenuData, setLoadingMenuData] = useState(false);

  // Add restaurant to dish
  const addRestaurantToDish = (restaurantId: string) => {
    // Check if restaurant is already added
    const exists = menuItems.some(item => item.restaurant_id === restaurantId);
    if (exists) return false;

    // Find restaurant details
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) return false;

    const newMenuItem: RestaurantMenuItem = {
      restaurant_id: restaurantId,
      price: 0,
      availability: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        town: restaurant.town
      }
    };

    setMenuItems(prev => [...prev, newMenuItem]);
    return true;
  };

  // Remove restaurant from dish
  const removeRestaurantFromDish = (restaurantId: string) => {
    setMenuItems(prev => prev.filter(item => item.restaurant_id !== restaurantId));
  };

  // Update menu item price
  const updateMenuItemPrice = (restaurantId: string, price: number) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.restaurant_id === restaurantId
          ? { ...item, price }
          : item
      )
    );
  };

  // Update menu item availability
  const updateMenuItemAvailability = (restaurantId: string, availability: boolean) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.restaurant_id === restaurantId
          ? { ...item, availability }
          : item
      )
    );
  };

  // Load menu items for editing a dish
  const loadMenuItemsForDish = async (dishId: string) => {
    setLoadingMenuData(true);
    try {
      const { data: menuData, error } = await supabase
        .from('restaurant_menus')
        .select(`
          id,
          restaurant_id,
          price,
          availability,
          restaurants (
            id,
            name,
            town
          )
        `)
        .eq('dish_id', dishId);

      if (error) {
        console.error('Error fetching menu items:', error);
        setMenuItems([]);
        return false;
      }

      if (menuData && menuData.length > 0) {
        const formattedMenuItems: RestaurantMenuItem[] = menuData.map(item => ({
          restaurant_id: item.restaurant_id,
          price: item.price || 0,
          availability: item.availability ?? true,
          restaurant: item.restaurants ? {
            id: item.restaurants.id,
            name: item.restaurants.name,
            town: item.restaurants.town
          } : undefined
        }));
        setMenuItems(formattedMenuItems);
      } else {
        setMenuItems([]);
      }

      return true;
    } catch (error) {
      console.error('Error in loadMenuItemsForDish:', error);
      setMenuItems([]);
      return false;
    } finally {
      setLoadingMenuData(false);
    }
  };

  // Reset menu items
  const resetMenuItems = () => {
    setMenuItems([]);
  };

  // Get available restaurants (not already added to this dish)
  const getAvailableRestaurants = () => {
    return restaurants.filter(restaurant =>
      !menuItems.some(item => item.restaurant_id === restaurant.id)
    );
  };

  // Validate menu items
  const validateMenuItems = () => {
    if (menuItems.length === 0) {
      return { valid: false, message: 'Please add at least one restaurant that serves this dish' };
    }

    const invalidItems = menuItems.filter(item => item.price <= 0);
    if (invalidItems.length > 0) {
      return { valid: false, message: 'All restaurants must have a valid price (greater than 0)' };
    }

    return { valid: true };
  };

  return {
    menuItems,
    loadingMenuData,
    addRestaurantToDish,
    removeRestaurantFromDish,
    updateMenuItemPrice,
    updateMenuItemAvailability,
    loadMenuItemsForDish,
    resetMenuItems,
    getAvailableRestaurants,
    validateMenuItems,
    setMenuItems
  };
};