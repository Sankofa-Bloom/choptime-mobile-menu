import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import ChopTymLoader from '@/components/ui/ChopTymLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/dash/login'
}) => {
  const { admin, loading, isInitializing, isAuthenticated } = useAdminAuth();
  const location = useLocation();

  // Show loading spinner only during initial authentication check
  if (isInitializing) {
    return (
      <ChopTymLoader
        size="lg"
        message="Verifying access..."
        subMessage="Checking admin permissions"
        fullScreen={true}
      />
    );
  }

  // If still loading but not initializing, show a minimal loading state
  if (loading && !isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-choptym-beige via-orange-50 to-yellow-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authentication is required and user is not an admin, redirect to login
  if (requireAuth && !admin) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If user is authenticated and admin, render the protected content
  if (requireAuth && admin && isAuthenticated) {
    return <>{children}</>;
  }

  // If no authentication is required, render the content
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Fallback redirect
  return <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute; 