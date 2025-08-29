
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { AdminUser } from '@/types/admin';

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Session persistence keys
  const SESSION_STORAGE_KEY = 'choptym_admin_session';
  const ADMIN_STORAGE_KEY = 'choptym_admin_data';

  // Load persisted session data
  const loadPersistedData = () => {
    try {
      const persistedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      const persistedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);

      if (persistedSession) {
        const sessionData = JSON.parse(persistedSession);
        // Check if session is still valid (not expired)
        if (sessionData.expires_at && new Date(sessionData.expires_at) > new Date()) {
          setSession(sessionData);
        }
      }

      if (persistedAdmin) {
        const adminData = JSON.parse(persistedAdmin);
        setAdmin(adminData);
      }
    } catch (error) {
      console.error('Error loading persisted auth data:', error);
      // Clear corrupted data
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  };

  // Persist session data
  const persistSessionData = (session: Session | null, admin: AdminUser | null) => {
    try {
      if (session) {
        const sessionData = {
          ...session,
          expires_at: session.expires_at
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }

      if (admin) {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
      } else {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error persisting auth data:', error);
    }
  };

  // Session recovery mechanism
  const recoverSession = async (): Promise<boolean> => {
    try {
      console.log('Attempting session recovery...');

      // Try to refresh the current session
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Session recovery failed:', error);
        return false;
      }

      if (data.session) {
        console.log('Session recovered successfully');
        setSession(data.session);
        await verifyAdminStatus(data.session.user.email);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Session recovery error:', error);
      return false;
    }
  };

  // Periodic session health check
  const startSessionHealthCheck = () => {
    const healthCheckInterval = setInterval(async () => {
      // Get current session state to avoid stale closure
      const currentSession = session;
      const currentAdmin = admin;

      if (!currentSession || !currentAdmin) return;

      try {
        // Check if session is close to expiration (within 5 minutes)
        const now = new Date();
        const expiresAt = new Date(currentSession.expires_at);
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const fiveMinutes = 5 * 60 * 1000;

        if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
          console.log('Session expiring soon, attempting refresh...');
          await refreshSession();
        } else if (timeUntilExpiry <= 0) {
          console.log('Session expired, attempting recovery...');
          const recovered = await recoverSession();
          if (!recovered) {
            console.log('Session recovery failed, logging out...');
            await logoutAdmin();
          }
        }
      } catch (error) {
        console.error('Session health check error:', error);
      }
    }, 60000); // Check every minute

    return healthCheckInterval;
  };

  useEffect(() => {
    let mounted = true;
    let healthCheckInterval: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      try {
        // Load persisted data first to avoid loading screen
        loadPersistedData();

        // Get fresh session from Supabase
        const { data: { session: freshSession }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Session retrieval error:', error);
          setSession(null);
          setAdmin(null);
          setLoading(false);
          setIsInitializing(false);
          persistSessionData(null, null);
          return;
        }

        // Update session state
        setSession(freshSession);

        if (freshSession?.user?.email) {
          // Check if we already have admin data and it's for the same user
          const currentAdmin = admin;
          if (currentAdmin && currentAdmin.email === freshSession.user.email) {
            // We already have the admin data, no need to verify again
            setLoading(false);
            setIsInitializing(false);
            persistSessionData(freshSession, currentAdmin);

            // Start session health check if we have a valid session
            healthCheckInterval = startSessionHealthCheck();
          } else {
            // Need to verify admin status
            await verifyAdminStatus(freshSession.user.email);

            // Start session health check after successful verification
            if (admin) {
              healthCheckInterval = startSessionHealthCheck();
            }
          }
        } else {
          setAdmin(null);
          setLoading(false);
          setIsInitializing(false);
          persistSessionData(freshSession, null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setAdmin(null);
          setLoading(false);
          setIsInitializing(false);
          persistSessionData(null, null);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.email);

      setSession(session);

      if (session?.user?.email) {
        await verifyAdminStatus(session.user.email);

        // Start session health check for new sessions
        if (healthCheckInterval) {
          clearInterval(healthCheckInterval);
        }
        healthCheckInterval = startSessionHealthCheck();
      } else {
        setAdmin(null);
        setLoading(false);
        persistSessionData(session, null);

        // Clear health check interval when logged out
        if (healthCheckInterval) {
          clearInterval(healthCheckInterval);
          healthCheckInterval = null;
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
    };
  }, []);

  const verifyAdminStatus = async (email: string): Promise<boolean> => {
    try {
      // Don't set loading if we're just refreshing or if we already have admin data
      if (!loading) setLoading(true);

      if (!email) {
        setAdmin(null);
        setLoading(false);
        setIsInitializing(false);
        persistSessionData(session, null);
        return false;
      }

      // Check if we already have admin data for this user
      if (admin && admin.email === email) {
        console.log('Admin data already exists for:', email);
        setLoading(false);
        setIsInitializing(false);
        persistSessionData(session, admin);
        return true;
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
            setLoading(false);
            setIsInitializing(false);
            persistSessionData(session, null);
            return false;
          } else if (adminData) {
            console.log('Admin verified successfully (fallback):', adminData);
            setAdmin(adminData);
            setLoading(false);
            setIsInitializing(false);
            persistSessionData(session, adminData);
            return true;
          } else {
            console.log('No admin record found for:', email);
            setAdmin(null);
            setLoading(false);
            setIsInitializing(false);
            persistSessionData(session, null);
            return false;
          }
        } catch (fallbackError) {
          console.error('Fallback admin verification failed:', fallbackError);
          setAdmin(null);
          setLoading(false);
          setIsInitializing(false);
          persistSessionData(session, null);
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
        setLoading(false);
        setIsInitializing(false);
        persistSessionData(session, adminData);
        return true;
      } else {
        console.log('User is not an admin:', email);
        setAdmin(null);
        setLoading(false);
        setIsInitializing(false);
        persistSessionData(session, null);
        // Only sign out if we got a definitive "not admin" response
        if (adminResult && !adminResult.is_admin) {
          await supabase.auth.signOut();
        }
        return false;
      }
    } catch (error) {
      console.error('Error verifying admin status:', error);
      setAdmin(null);
      setLoading(false);
      setIsInitializing(false);
      persistSessionData(session, null);
      // Don't auto-signout on errors to avoid auth loops
      return false;
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
        // Verify admin status after successful auth and wait for result
        const isAdminVerified = await verifyAdminStatus(data.user.email);

        if (isAdminVerified) {
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
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: errorMessage };
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
    } catch (error: unknown) {
      console.error('Create admin error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create admin account';
      return { success: false, error: errorMessage };
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
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      return { success: false, error: errorMessage };
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
      persistSessionData(null, null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  const refreshSession = async () => {
    try {
      console.log('Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Session refresh error:', error);
        await logoutAdmin();
        return false;
      }

      if (data.session) {
        console.log('Session refreshed successfully');
        setSession(data.session);
        await verifyAdminStatus(data.session.user.email);
        return true;
      } else {
        console.log('No session returned from refresh');
        await logoutAdmin();
        return false;
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      await logoutAdmin();
      return false;
    }
  };

  // Clear persisted data (useful for debugging or manual cleanup)
  const clearPersistedData = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      console.log('Persisted auth data cleared');
    } catch (error) {
      console.error('Error clearing persisted data:', error);
    }
  };

  return {
    admin,
    session,
    loading,
    isInitializing,
    loginWithEmail,
    logoutAdmin,
    createAdmin,
    resetPassword,
    refreshSession,
    recoverSession,
    clearPersistedData,
    isAdmin: !!admin,
    isAuthenticated: !!session
  };
};
