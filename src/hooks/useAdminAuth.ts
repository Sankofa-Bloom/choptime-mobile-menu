
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminUser } from '@/types/admin';

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await verifyAdminStatus(session.user.email!);
        } else if (event === 'SIGNED_OUT') {
          setAdmin(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session?.user?.email);
      
      if (session?.user?.email) {
        await verifyAdminStatus(session.user.email);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyAdminStatus = async (email: string) => {
    try {
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('active', true)
        .single();

      console.log('Admin verification result:', { adminData, error });

      if (!error && adminData) {
        setAdmin(adminData);
      } else {
        setAdmin(null);
        // Don't sign out automatically - let user handle it
        if (error?.code !== 'PGRST116') {
          console.error('Admin verification error:', error);
        }
      }
    } catch (error) {
      console.error('Error verifying admin status:', error);
      setAdmin(null);
    }
  };

  const createAdmin = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Creating admin account for:', email);
      
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dash/chp-ctrl`
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        return { 
          success: false, 
          error: authError.message
        };
      }

      if (authData.user) {
        // Insert into admin_users table
        const { error: adminError } = await supabase
          .from('admin_users')
          .insert({
            email,
            password_hash: 'managed_by_auth', // Auth handles password
            role: 'admin',
            active: true
          });

        if (adminError) {
          console.error('Admin insert error:', adminError);
          return { 
            success: false, 
            error: 'Failed to create admin record' 
          };
        }

        return { 
          success: true, 
          message: 'Admin account created successfully. Please check your email to confirm.' 
        };
      }

      return { success: false, error: 'Failed to create user' };
    } catch (error: any) {
      console.error('Create admin error:', error);
      return { success: false, error: error.message || 'Failed to create admin' };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      console.log('Resetting password for:', email);
      
      // Check if email exists in admin_users
      const { data: adminExists, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', email)
        .eq('active', true)
        .single();

      if (adminCheckError || !adminExists) {
        return { 
          success: false, 
          error: 'Email not found in admin records' 
        };
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dash/login`
      });

      if (error) {
        console.error('Password reset error:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      return { 
        success: true, 
        message: 'Password reset email sent. Please check your inbox.' 
      };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message || 'Password reset failed' };
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting admin login for:', email);
      
      // First check if user exists in admin_users table
      const { data: adminExists, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('email, active')
        .eq('email', email)
        .eq('active', true)
        .single();

      if (adminCheckError || !adminExists) {
        console.error('Admin check failed:', adminCheckError);
        return { 
          success: false, 
          error: 'Invalid admin credentials. Access denied.' 
        };
      }

      // Attempt authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Auth result:', { user: data.user?.email, error });

      if (error) {
        console.error('Auth error:', error);
        return { 
          success: false, 
          error: error.message.includes('Invalid login credentials') 
            ? 'Incorrect email or password'
            : error.message 
        };
      }

      if (data.user) {
        // Admin status will be verified by the auth state change listener
        return { success: true };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logoutAdmin = async () => {
    try {
      await supabase.auth.signOut();
      setAdmin(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    admin,
    loading,
    loginAdmin,
    logoutAdmin,
    createAdmin,
    resetPassword,
    isAdmin: !!admin
  };
};
