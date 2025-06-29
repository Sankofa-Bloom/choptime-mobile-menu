
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminUser } from '@/types/admin';

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      if (session?.user) {
        // Check if this user is an admin
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email)
          .eq('active', true)
          .single();

        console.log('Admin data query result:', { adminData, error });

        if (!error && adminData) {
          setAdmin(adminData);
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      console.log('Attempting admin login for:', email);
      
      // First, authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Auth result:', { data, error });

      if (error) {
        console.error('Auth error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Check if authenticated user is an admin
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .eq('active', true)
          .single();

        console.log('Admin check result:', { adminData, adminError });

        if (adminError || !adminData) {
          // Sign out if not an admin
          await supabase.auth.signOut();
          return { success: false, error: 'Access denied. Admin privileges required.' };
        }

        setAdmin(adminData);
        return { success: true };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logoutAdmin = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
  };

  return {
    admin,
    loading,
    loginAdmin,
    logoutAdmin,
    isAdmin: !!admin
  };
};
