// Main Admin Dashboard Layout
// Clean, organized dashboard with separated concerns

import React, { useState } from 'react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import RestaurantManagement from './sections/RestaurantManagement';
import DishManagement from './sections/DishManagement';
import OrdersManagement from './sections/OrdersManagement';
import DeliveryFeeSettings from './sections/DeliveryFeeSettings';
import { useDashboardStats } from './hooks/useDashboardStats';

const SimpleAdminDashboard: React.FC = () => {
  const { admin, isAuthenticated, logout } = useSimpleAuth();
  const [activeTab, setActiveTab] = useState('restaurants');
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useDashboardStats();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Admin Access Required</h2>
            <p className="text-center text-gray-600">
              Please log in to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ChopTym Admin Dashboard</h1>
            <p className="text-gray-600">Manage restaurants, dishes, and orders</p>
            {statsError && (
              <p className="text-sm text-red-600 mt-1">⚠️ Error loading stats: {statsError}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={refreshStats}
              variant="outline"
              size="sm"
              disabled={statsLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
              {statsLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">🏪</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Restaurants</p>
                  {statsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold">{stats.restaurants.total}</p>
                      <p className="text-xs text-green-600">{stats.restaurants.active} active</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">🍽️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Dishes</p>
                  {statsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold">{stats.dishes.total}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Orders</p>
                  {statsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold">{stats.orders.total}</p>
                      <p className="text-xs text-yellow-600">{stats.orders.pending} pending</p>
                      <p className="text-xs text-blue-600">{stats.orders.today} today</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="dishes">Dishes</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants" className="mt-6">
            <RestaurantManagement onDataChange={refreshStats} />
          </TabsContent>

          <TabsContent value="dishes" className="mt-6">
            <DishManagement onDataChange={refreshStats} />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <OrdersManagement />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <DeliveryFeeSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SimpleAdminDashboard;