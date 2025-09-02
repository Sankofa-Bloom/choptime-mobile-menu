
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

  // Debug helper
  const debugLog = (...args: unknown[]) => {
    if (import.meta.env?.DEV) {
      console.log('[useAdminData]', ...args);
    }
  };

  // Discover existing columns specifically for dishes (avoids string overload issues)
  const getExistingDishColumns = useCallback(async (): Promise<Set<string>> => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .limit(1);

      if (error) {
        console.warn('Column discovery failed for dishes', error);
        return new Set();
      }
      if (Array.isArray(data) && data.length > 0) {
        return new Set(Object.keys(data[0] as Record<string, unknown>));
      }
      return new Set();
    } catch (e) {
      console.warn('Column discovery exception for dishes', e);
      return new Set();
    }
  }, []);

  const filterPayloadToColumns = (payload: Record<string, unknown>, existing: Set<string>): Record<string, unknown> => {
    if (existing.size === 0) return payload; // nothing known, keep as-is
    const filtered: Record<string, unknown> = {};
    Object.keys(payload).forEach((k) => {
      if (existing.has(k)) filtered[k] = payload[k];
    });
    return filtered;
  };

  // -----------------------------------------------------------------------------
  // Helpers: Build payloads compatible with both current and legacy schemas
  // -----------------------------------------------------------------------------
  const buildRestaurantPayloads = (data: Partial<RestaurantFormData>) => {
    // New schema (preferred)
    const newPayload: Record<string, unknown> = {};
    if (data.name !== undefined) newPayload.name = data.name;
    if (data.town !== undefined) newPayload.town = data.town;
    if (data.contact_number !== undefined) newPayload.contact_number = data.contact_number;
    if (data.image_url !== undefined) newPayload.image_url = data.image_url;
    if (data.logo_url !== undefined) newPayload.logo_url = data.logo_url;
    if (data.active !== undefined) newPayload.active = data.active;
    if (data.delivery_time_min !== undefined) newPayload.delivery_time_min = data.delivery_time_min;
    if (data.delivery_time_max !== undefined) newPayload.delivery_time_max = data.delivery_time_max;
    if (data.address !== undefined) newPayload.address = data.address;
    if (data.description !== undefined) newPayload.description = data.description;
    if (data.cuisine_type !== undefined) newPayload.cuisine_type = data.cuisine_type;
    if (data.gps_latitude !== undefined) newPayload.gps_latitude = data.gps_latitude;
    if (data.gps_longitude !== undefined) newPayload.gps_longitude = data.gps_longitude;
    if (data.has_dynamic_menu !== undefined) newPayload.has_dynamic_menu = data.has_dynamic_menu;
    if (data.mtn_number !== undefined) newPayload.mtn_number = data.mtn_number;
    if (data.orange_number !== undefined) newPayload.orange_number = data.orange_number;

    // Legacy schema fallback
    const legacyPayload: Record<string, unknown> = {};
    if (data.name !== undefined) legacyPayload.name = data.name;
    if (data.town !== undefined) legacyPayload.town = data.town;
    if (data.contact_number !== undefined) legacyPayload.phone = data.contact_number;
    if (data.image_url !== undefined) legacyPayload.image_url = data.image_url;
    if (data.logo_url !== undefined) legacyPayload.logo_url = data.logo_url;
    if (data.active !== undefined) legacyPayload.active = data.active;
    if (data.address !== undefined) legacyPayload.address = data.address;
    if (data.description !== undefined) legacyPayload.description = data.description;

    return { newPayload, legacyPayload };
  };

  // =============================================================================
  // DATA FETCHING FUNCTIONS
  // =============================================================================

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
        const base = data[0] as Partial<AdminStats>;
        // Map to full AdminStats with safe defaults
        const mapped: AdminStats = {
          total_orders: Number((base as any).total_orders ?? 0),
          pending_orders: Number((base as any).pending_orders ?? 0),
          completed_orders: Number((base as any).completed_orders ?? 0),
          total_revenue: Number((base as any).total_revenue ?? 0),
          avg_order_value: Number((base as any).avg_order_value ?? 0),
          total_restaurants: Number((base as any).total_restaurants ?? 0),
          active_restaurants: Number((base as any).active_restaurants ?? 0),
          total_dishes: Number((base as any).total_dishes ?? 0),
          active_dishes: Number((base as any).active_dishes ?? 0),
          total_drivers: Number((base as any).total_drivers ?? 0),
          active_drivers: Number((base as any).active_drivers ?? 0),
          completed_payments: Number((base as any).completed_payments ?? 0),
          failed_payments: Number((base as any).failed_payments ?? 0),
          pending_payments: Number((base as any).pending_payments ?? 0),
          total_payment_volume: Number((base as any).total_payment_volume ?? 0),
          orders_today: Number((base as any).orders_today ?? 0),
          orders_this_week: Number((base as any).orders_this_week ?? 0),
          orders_this_month: Number((base as any).orders_this_month ?? 0),
          revenue_today: Number((base as any).revenue_today ?? 0),
          revenue_this_week: Number((base as any).revenue_this_week ?? 0),
          revenue_this_month: Number((base as any).revenue_this_month ?? 0)
        };
        setStats(mapped);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
      throw err;
    }
  }, []);

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
  }, [fetchRestaurants, fetchDishes, fetchDeliveryZones, fetchStats]);

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

      const { newPayload, legacyPayload } = buildRestaurantPayloads(restaurantData);

      // Try new schema first
      let insertResult = await supabase
        .from('restaurants')
        .insert([newPayload as any])
        .select()
        .single();

      if (insertResult.error && insertResult.error.code === 'PGRST204') {
        // Fallback to legacy schema payload
        insertResult = await supabase
          .from('restaurants')
          .insert([legacyPayload as any])
          .select()
          .single();
      }

      const { data, error } = insertResult;
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

      const { newPayload, legacyPayload } = buildRestaurantPayloads(restaurantData);

      // Try new schema first
      let updateResult = await supabase
        .from('restaurants')
        .update(newPayload)
        .eq('id', id)
        .select()
        .single();

      if (updateResult.error && updateResult.error.code === 'PGRST204') {
        // Fallback to legacy schema (e.g., phone instead of contact_number)
        updateResult = await supabase
          .from('restaurants')
          .update(legacyPayload)
          .eq('id', id)
          .select()
          .single();
      }

      const { data, error } = updateResult;
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
      // Prefer new schema (with admin_created), but filter to existing cols
      const newPayload = { ...dishData, admin_created: true } as Record<string, unknown>;
      const legacyPayload = { ...dishData } as Record<string, unknown>;
      delete legacyPayload["admin_created"]; // ensure it's removed

      // Discover existing columns and filter payloads accordingly
      const cols = await getExistingDishColumns();
      const filteredNew = filterPayloadToColumns(newPayload, cols);
      const filteredLegacy = filterPayloadToColumns(legacyPayload, cols);

      // Try filtered new first
      let insertResult = await supabase
        .from('dishes')
        .insert([filteredNew as any])
        .select()
        .single();

      if (insertResult.error) {
        // If schema cache complains about unknown column or any error, try legacy filtered
        insertResult = await supabase
          .from('dishes')
          .insert([filteredLegacy as any])
          .select()
          .single();
      }

      const { data, error } = insertResult;
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
      // Try update with provided data; if admin_created is unknown in schema, retry without it
      const newPayload = { ...dishData } as Record<string, unknown>;
      const legacyPayload = { ...dishData } as Record<string, unknown>;
      delete legacyPayload["admin_created"]; // ensure removed for legacy

      // First attempt
      let updateResult = await supabase
        .from('dishes')
        .update(newPayload as any)
        .eq('id', id)
        .select()
        .single();

      if (updateResult.error && updateResult.error.code === 'PGRST204') {
        // Discover existing columns and filter payload accordingly
        const cols = await getExistingDishColumns();
        const filteredLegacy = filterPayloadToColumns(legacyPayload, cols);
        const filteredNew = filterPayloadToColumns(newPayload, cols);

        // Prefer filteredNew first (minus unknowns). If it still fails, fallback to filteredLegacy
        let secondTry = await supabase
          .from('dishes')
          .update(filteredNew as any)
          .eq('id', id)
          .select()
          .single();

        if (secondTry.error && secondTry.error.code === 'PGRST204') {
          secondTry = await supabase
            .from('dishes')
            .update(filteredLegacy as any)
            .eq('id', id)
            .select()
            .single();
        }

        updateResult = secondTry;
      }

      const { data, error } = updateResult;
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
  }, [fetchDishes, getExistingDishColumns]);

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
  const exportToCSV = useCallback((data: Record<string, unknown>[], filename: string) => {
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
  const exportToJSON = useCallback((data: Record<string, unknown>[], filename: string) => {
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
