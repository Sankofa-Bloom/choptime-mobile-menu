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
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Check if this is the first time visiting the app
    const hasVisited = localStorage.getItem('choptym_visited');

    if (!hasVisited) {
      setShowSplash(true);
      // Mark as visited after showing splash
              localStorage.setItem('choptym_visited', 'true');
    }

    // Initialize notification service
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        console.log('✅ Notification service initialized');

        // Small delay to ensure service worker is fully ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Debug service worker status
        console.log('🔧 Service worker status:', notificationService.getServiceWorkerStatus());

        // Check if notifications are supported and request permission if needed
        if (notificationService.isSupported()) {
          const permission = notificationService.getPermissionStatus();
          console.log('📱 Notification permission status:', permission);

          if (permission === 'default') {
            // Don't auto-request permission, let user do it manually
            console.log('📱 Notifications supported, permission not requested yet');
          } else if (permission === 'granted') {
            // Try to subscribe to push notifications
            console.log('🔄 Attempting to subscribe to push notifications...');
            const subscriptionResult = await notificationService.subscribeToPush();
            if (subscriptionResult) {
              console.log('✅ Push notification subscription successful');
            } else {
              console.log('❌ Push notification subscription failed');
            }
          } else {
            console.log('🚫 Notification permission denied');
          }
        } else {
          console.log('🚫 Notifications not supported in this browser');
        }
      } catch (error) {
        console.error('❌ Failed to initialize notification service:', error);
      }
    };

    initializeNotifications();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={3000} />;
  }

  return (
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
  );
}

export default App;
