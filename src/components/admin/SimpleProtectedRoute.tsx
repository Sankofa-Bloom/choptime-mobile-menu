import React from 'react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import SimpleAdminLogin from './SimpleAdminLogin';
import ChopTymLoader from '@/components/ui/ChopTymLoader';

interface SimpleProtectedRouteProps {
  children: React.ReactNode;
}

const SimpleProtectedRoute: React.FC<SimpleProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, initializeFromStorage } = useSimpleAuth();

  // Initialize from localStorage on mount
  React.useEffect(() => {
    initializeFromStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <ChopTymLoader
        size="lg"
        message="Verifying access..."
        subMessage="Checking admin permissions"
        fullScreen={true}
      />
    );
  }

  if (!isAuthenticated) {
    return <SimpleAdminLogin />;
  }

  return <>{children}</>;
};

export default SimpleProtectedRoute;