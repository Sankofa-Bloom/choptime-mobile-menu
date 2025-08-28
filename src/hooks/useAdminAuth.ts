
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminUser } from '@/types/admin';

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        verifyAdminStatus(session.user.email);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        await verifyAdminStatus(session.user.email);
      } else {
        setAdmin(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifyAdminStatus = async (email: string) => {
    try {
      setLoading(true);

      if (!email) {
        setAdmin(null);
        setLoading(false);
        return;
      }

      // Use RPC function to verify admin status (bypasses RLS issues)
      const { data: adminResult, error: rpcError } = await supabase.rpc('verify_admin_status', {
        check_email: email
      });

      if (rpcError) {
        console.error('Admin verification RPC error:', rpcError);

        // Fallback: Try direct query if RPC fails
        try {
          const { data: adminData, error: directError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .eq('active', true)
            .single();

          if (directError) {
            console.error('Direct admin verification error:', directError);
            setAdmin(null);
            // Don't auto-signout on verification errors to avoid loops
          } else if (adminData) {
            console.log('Admin verified successfully (fallback):', adminData);
            setAdmin(adminData);
          } else {
            console.log('No admin record found for:', email);
            setAdmin(null);
          }
        } catch (fallbackError) {
          console.error('Fallback admin verification failed:', fallbackError);
          setAdmin(null);
        }
      } else if (adminResult && adminResult.is_admin) {
        // Create admin object from RPC result
        const adminData = {
          id: adminResult.admin_id,
          email: email,
          role: adminResult.role || 'admin',
          active: true,
          created_at: adminResult.created_at
        };
        console.log('Admin verified successfully (RPC):', adminData);
        setAdmin(adminData);
      } else {
        console.log('User is not an admin:', email);
        setAdmin(null);
        // Only sign out if we got a definitive "not admin" response
        if (adminResult && !adminResult.is_admin) {
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Error verifying admin status:', error);
      setAdmin(null);
      // Don't auto-signout on errors to avoid auth loops
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setAdmin(null);

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      }, {
        redirectTo: `${window.location.origin}/dash/chp-ctrl`
      });

      if (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }

      if (data.user) {
        // Verify admin status after successful auth
        await verifyAdminStatus(data.user.email);
        
        if (admin) {
          return { success: true };
        } else {
          // Sign out if not an admin
          await supabase.auth.signOut();
          return { 
            success: false, 
            error: 'Access denied. This account is not authorized as an admin.' 
          };
        }
      }

      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
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
        // Create admin record using the database function
        const { data: adminResult, error: adminError } = await supabase.rpc('create_admin_user', {
          user_email: email,
          user_role: 'admin',
          is_active: true
        });

        if (adminError) {
          console.error('Admin creation RPC error:', adminError);
          return {
            success: false,
            error: `Failed to set up admin privileges: ${adminError.message}`
          };
        }

        // Check if the RPC returned success
        if (adminResult && adminResult.success) {
          return {
            success: true,
            message: 'Admin account created successfully! Please check your email to confirm your account, then sign in to access the admin dashboard.'
          };
        } else {
          console.error('Admin creation failed:', adminResult);
          return {
            success: false,
            error: adminResult?.message || 'Failed to create admin record'
          };
        }
      }

      return { success: false, error: 'Failed to create user account' };
    } catch (error: any) {
      console.error('Create admin error:', error);
      return { success: false, error: error.message || 'Failed to create admin account' };
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

  const logoutAdmin = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setAdmin(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
        await logoutAdmin();
      } else if (data.session) {
        setSession(data.session);
        await verifyAdminStatus(data.session.user.email);
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      await logoutAdmin();
    }
  };

  return {
    admin,
    session,
    loading,
    loginWithEmail,
    logoutAdmin,
    createAdmin,
    resetPassword,
    refreshSession,
    isAdmin: !!admin,
    isAuthenticated: !!session
  };
};
