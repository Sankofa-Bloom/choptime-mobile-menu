import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SimpleAdminUser {
  id: string;
  email: string;
  role: string;
  active: boolean;
}

export const useSimpleAuth = () => {
  const [admin, setAdmin] = useState<SimpleAdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simple PIN-based authentication for development
  const ADMIN_PIN = '1035'; // Same as in server config

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if user is logged in via Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Try to get admin data using email instead of auth_id
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email)
          .eq('active', true)
          .single();

        if (!error && adminData) {
          setAdmin(adminData);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginWithPin = async (pin: string): Promise<{ success: boolean; message: string }> => {
    if (pin === ADMIN_PIN) {
      // Create a simple admin session
      const simpleAdmin: SimpleAdminUser = {
        id: 'simple-admin',
        email: 'admin@choptym.com',
        role: 'admin',
        active: true
      };

      setAdmin(simpleAdmin);
      setIsAuthenticated(true);

      // Store in localStorage for persistence
      localStorage.setItem('choptym_simple_admin', JSON.stringify(simpleAdmin));

      return { success: true, message: 'Login successful' };
    }

    return { success: false, message: 'Invalid PIN' };
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.session) {
        // Check if user is admin using email instead of auth_id
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', data.session.user.email)
          .eq('active', true)
          .single();

        if (adminError || !adminData) {
          await supabase.auth.signOut();
          return { success: false, message: 'Not an admin user' };
        }

        setAdmin(adminData);
        setIsAuthenticated(true);
        return { success: true, message: 'Login successful' };
      }

      return { success: false, message: 'Login failed' };
    } catch (error) {
      return { success: false, message: 'An error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('choptym_simple_admin');
      setAdmin(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const initializeFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('choptym_simple_admin');
      if (stored) {
        const adminData = JSON.parse(stored);
        setAdmin(adminData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading stored admin data:', error);
      localStorage.removeItem('choptym_simple_admin');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    admin,
    loading,
    isAuthenticated,
    loginWithPin,
    loginWithEmail,
    logout,
    initializeFromStorage
  };
};