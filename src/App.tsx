import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from '@/pages/Index';

import NotFound from '@/pages/NotFound';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import ThankYou from '@/pages/ThankYou';
import PaymentSuccess from '@/pages/PaymentSuccess';
import WhatsAppButton from '@/components/WhatsAppButton';
import { SplashScreen } from '@/components/SplashScreen';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import SimpleAdminDashboard from '@/components/admin/SimpleAdminDashboardClean';
import SimpleProtectedRoute from '@/components/admin/SimpleProtectedRoute';
import AdminSetup from '@/components/admin/AdminSetup';
import notificationService from '@/utils/notificationService';

// App component debug logging
console.log('🚀 APP COMPONENT: Loading App.tsx');
import { Toaster } from '@/components/ui/toaster';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          fontFamily: 'Arial, sans-serif',
          maxWidth: '600px',
          margin: '50px auto'
        }}>
          <h1>Something went wrong</h1>
          <p>We're sorry, but something unexpected happened. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create QueryClient with optimized settings for API caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Add error handling to prevent crashes
      onError: (error) => {
        console.error('🚨 React Query error:', error);
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('🚨 React Query mutation error:', error);
      },
    },
  },
});

function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [notificationError, setNotificationError] = useState(false);

  useEffect(() => {
    // Check if this is the first time visiting the app
    const hasVisited = localStorage.getItem('choptym_visited');

    if (!hasVisited) {
      setShowSplash(true);
      // Mark as visited after showing splash
      localStorage.setItem('choptym_visited', 'true');
    }

    // DISABLED: Initialize notification service to prevent crashes
    // Temporarily disabled until crash issues are resolved
    console.log('🔧 Notification service initialization disabled for stability');
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={3000} />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Admin Routes */}
            <Route path="/dash/login" element={<AdminLogin />} />
            <Route path="/dash/setup" element={<AdminSetup />} />
            <Route
              path="/dash/chp-ctrl"
              element={
                <SimpleProtectedRoute>
                  <SimpleAdminDashboard />
                </SimpleProtectedRoute>
              }
            />

            {/* Public Routes */}
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />

            {/* Redirect /login to /dash/login for better UX */}
            <Route path="/login" element={<Navigate to="/dash/login" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Floating WhatsApp Button - appears on all pages */}
          <WhatsAppButton />

          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
