// Dashboard Stats Hook
// Fetches real-time statistics for the admin dashboard

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  restaurants: {
    total: number;
    active: number;
  };
  dishes: {
    total: number;
  };
  orders: {
    total: number;
    pending: number;
    today: number;
  };
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    restaurants: { total: 0, active: 0 },
    dishes: { total: 0 },
    orders: { total: 0, pending: 0, today: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch restaurants stats
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('active');

      if (restaurantsError) {
        throw new Error(`Restaurants fetch failed: ${restaurantsError.message}`);
      }

      // Fetch dishes count
      const { count: dishesCount, error: dishesError } = await supabase
        .from('dishes')
        .select('*', { count: 'exact', head: true });

      if (dishesError) {
        throw new Error(`Dishes fetch failed: ${dishesError.message}`);
      }

      // Fetch orders stats
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('status, created_at');

      if (ordersError) {
        throw new Error(`Orders fetch failed: ${ordersError.message}`);
      }

      // Calculate stats
      const restaurantsData = restaurants || [];
      const ordersData = orders || [];

      // Restaurants stats
      const totalRestaurants = restaurantsData.length;
      const activeRestaurants = restaurantsData.filter(r => r.active).length;

      // Orders stats
      const totalOrders = ordersData.length;
      const pendingOrders = ordersData.filter(o => o.status === 'pending').length;

      // Today's orders (last 24 hours)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = ordersData.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= today;
      }).length;

      setStats({
        restaurants: {
          total: totalRestaurants,
          active: activeRestaurants
        },
        dishes: {
          total: dishesCount || 0
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          today: todayOrders
        }
      });

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const refreshStats = () => {
    fetchStats();
  };

  return {
    stats,
    loading,
    error,
    refreshStats
  };
};