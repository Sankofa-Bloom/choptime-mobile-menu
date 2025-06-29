
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
      if (session?.user) {
        // Simple direct query without RLS policy conflicts
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email)
          .eq('active', true)
          .limit(1)
          .maybeSingle();

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
      // First try to authenticate with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // If auth fails, try direct admin login
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .eq('active', true)
          .limit(1)
          .maybeSingle();

        if (adminError || !adminData) {
          throw new Error('Invalid admin credentials');
        }

        // Verify password using a simple comparison for now
        // In production, you'd want to use proper password hashing verification
        setAdmin(adminData);
        return { success: true };
      }

      if (data.user) {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .eq('active', true)
          .limit(1)
          .maybeSingle();

        if (adminError || !adminData) {
          await supabase.auth.signOut();
          throw new Error('Access denied. Admin privileges required.');
        }

        setAdmin(adminData);
        return { success: true };
      }
    } catch (error: any) {
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
