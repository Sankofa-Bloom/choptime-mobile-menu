
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Restaurant, Dish, RestaurantMenu } from '@/types/restaurant';
import { DeliveryZone, AdminStats, RestaurantFormData, DishFormData, MenuItemFormData } from '@/types/admin';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface DataFilters {
  search: string;
  category?: string;
  town?: string;
  status?: 'active' | 'inactive' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BulkOperationResult {
  success: boolean;
  message: string;
  affectedCount: number;
  errors?: string[];
}

export interface DataExportOptions {
  format: 'csv' | 'json';
  includeInactive?: boolean;
  fields?: string[];
}

// =============================================================================
// ENHANCED ADMIN DATA HOOK
// =============================================================================

export const useAdminData = () => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  // Core data state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering and search state
  const [filters, setFilters] = useState<DataFilters>({
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // =============================================================================
  // DATA FETCHING FUNCTIONS
  // =============================================================================

  /**
   * Fetch all data with error handling and loading states
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchRestaurants(),
        fetchDishes(),
        fetchDeliveryZones(),
        fetchStats()
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch restaurants with error handling
   */
  const fetchRestaurants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setRestaurants(data || []);
    } catch (err) {
      console.error('Restaurant fetch error:', err);
      throw err;
    }
  }, []);

  /**
   * Fetch dishes with error handling
   */
  const fetchDishes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setDishes(data || []);
    } catch (err) {
      console.error('Dish fetch error:', err);
      throw err;
    }
  }, []);

  /**
   * Fetch delivery zones with error handling
   */
  const fetchDeliveryZones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('town', { ascending: true });
      
      if (error) throw error;
      setDeliveryZones(data || []);
    } catch (err) {
      console.error('Delivery zone fetch error:', err);
      throw err;
    }
  }, []);

  /**
   * Fetch admin statistics with error handling
   */
  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_order_stats');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
      throw err;
    }
  }, []);

  // =============================================================================
  // FILTERED AND SEARCHED DATA
  // =============================================================================

  /**
   * Get filtered and searched restaurants
   */
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => {
      const matchesSearch = restaurant.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                           restaurant.town.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || 
                           (filters.status === 'active' && restaurant.active) ||
                           (filters.status === 'inactive' && !restaurant.active);
      
      const matchesTown = !filters.town || restaurant.town === filters.town;
      
      return matchesSearch && matchesStatus && matchesTown;
    }).sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Restaurant] || '';
      const bValue = b[filters.sortBy as keyof Restaurant] || '';
      
      if (filters.sortOrder === 'desc') {
        return String(bValue).localeCompare(String(aValue));
      }
      return String(aValue).localeCompare(String(bValue));
    });
  }, [restaurants, filters]);

  /**
   * Get filtered and searched dishes
   */
  const filteredDishes = useMemo(() => {
    return dishes.filter(dish => {
      const matchesSearch = dish.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                           dish.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
                           dish.category.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || 
                           (filters.status === 'active' && dish.active) ||
                           (filters.status === 'inactive' && !dish.active);
      
      const matchesCategory = !filters.category || dish.category === filters.category;
      
      return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Dish] || '';
      const bValue = b[filters.sortBy as keyof Dish] || '';
      
      if (filters.sortOrder === 'desc') {
        return String(bValue).localeCompare(String(aValue));
      }
      return String(aValue).localeCompare(String(bValue));
    });
  }, [dishes, filters]);

  /**
   * Get filtered and searched delivery zones
   */
  const filteredDeliveryZones = useMemo(() => {
    return deliveryZones.filter(zone => {
      const matchesSearch = zone.town.toLowerCase().includes(filters.search.toLowerCase()) ||
                           zone.zone_name.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || 
                           (filters.status === 'active' && zone.active) ||
                           (filters.status === 'inactive' && !zone.active);
      
      const matchesTown = !filters.town || zone.town === filters.town;
      
      return matchesSearch && matchesStatus && matchesTown;
    }).sort((a, b) => {
      const aValue = a[filters.sortBy as keyof DeliveryZone] || '';
      const bValue = b[filters.sortBy as keyof DeliveryZone] || '';
      
      if (filters.sortOrder === 'desc') {
        return String(bValue).localeCompare(String(aValue));
      }
      return String(aValue).localeCompare(String(bValue));
    });
  }, [deliveryZones, filters]);

  // =============================================================================
  // CRUD OPERATIONS
  // =============================================================================

  /**
   * Create a new restaurant
   */
  const createRestaurant = useCallback(async (restaurantData: RestaurantFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('restaurants')
        .insert([restaurantData])
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchRestaurants();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create restaurant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchRestaurants]);

  /**
   * Update an existing restaurant
   */
  const updateRestaurant = useCallback(async (id: string, restaurantData: Partial<RestaurantFormData>) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('restaurants')
        .update(restaurantData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchRestaurants();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update restaurant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchRestaurants]);

  /**
   * Delete a restaurant
   */
  const deleteRestaurant = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchRestaurants();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete restaurant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchRestaurants]);

  /**
   * Create a new dish
   */
  const createDish = useCallback(async (dishData: DishFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('dishes')
        .insert([{ ...dishData, admin_created: true }])
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchDishes();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create dish';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchDishes]);

  /**
   * Update an existing dish
   */
  const updateDish = useCallback(async (id: string, dishData: Partial<DishFormData>) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('dishes')
        .update(dishData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchDishes();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update dish';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchDishes]);

  /**
   * Delete a dish
   */
  const deleteDish = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchDishes();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete dish';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchDishes]);

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  /**
   * Bulk update restaurant status
   */
  const bulkUpdateRestaurantStatus = useCallback(async (ids: string[], active: boolean): Promise<BulkOperationResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('restaurants')
        .update({ active })
        .in('id', ids);
      
      if (error) throw error;
      
      await fetchRestaurants();
      return {
        success: true,
        message: `Successfully ${active ? 'activated' : 'deactivated'} ${ids.length} restaurants`,
        affectedCount: ids.length
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk update failed';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        affectedCount: 0
      };
    } finally {
      setLoading(false);
    }
  }, [fetchRestaurants]);

  /**
   * Bulk delete restaurants
   */
  const bulkDeleteRestaurants = useCallback(async (ids: string[]): Promise<BulkOperationResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      
      await fetchRestaurants();
      return {
        success: true,
        message: `Successfully deleted ${ids.length} restaurants`,
        affectedCount: ids.length
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk delete failed';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        affectedCount: 0
      };
    } finally {
      setLoading(false);
    }
  }, [fetchRestaurants]);

  // =============================================================================
  // DATA EXPORT
  // =============================================================================

  /**
   * Export data to CSV format
   */
  const exportToCSV = useCallback((data: any[], filename: string) => {
    try {
      if (data.length === 0) {
        throw new Error('No data to export');
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, message: 'Data exported successfully' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Export data to JSON format
   */
  const exportToJSON = useCallback((data: any[], filename: string) => {
    try {
      if (data.length === 0) {
        throw new Error('No data to export');
      }

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, message: 'Data exported successfully' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // =============================================================================
  // FILTER MANAGEMENT
  // =============================================================================

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<DataFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =============================================================================
  // RETURN VALUES
  // =============================================================================

  return {
    // Core data
    restaurants,
    dishes,
    deliveryZones,
    stats,
    
    // Filtered data
    filteredRestaurants,
    filteredDishes,
    filteredDeliveryZones,
    
    // UI state
    loading,
    error,
    filters,
    
    // CRUD operations
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    createDish,
    updateDish,
    deleteDish,
    
    // Bulk operations
    bulkUpdateRestaurantStatus,
    bulkDeleteRestaurants,
    
    // Data export
    exportToCSV,
    exportToJSON,
    
    // Filter management
    updateFilters,
    clearFilters,
    
    // Utility functions
    refetch: fetchData,
    setError: (message: string | null) => setError(message)
  };
};
