
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Store, 
  Utensils, 
  Truck, 
  BarChart3, 
  LogOut, 
  ShoppingBag,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import RestaurantManagement from '@/components/admin/RestaurantManagement';
import DishManagement from '@/components/admin/DishManagement';
import DeliveryManagement from '@/components/admin/DeliveryManagement';
import OrderManagement from '@/components/admin/OrderManagement';

const AdminDashboard = () => {
  const { admin, logoutAdmin, isAdmin, loading: authLoading } = useAdminAuth();
  const { stats, loading, error, refetch } = useAdminData();
  const [activeTab, setActiveTab] = useState('overview');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-choptime-beige">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-choptime-orange mx-auto mb-4"></div>
          <p className="text-choptime-brown">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dash/login" replace />;
  }

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const handleRefreshStats = () => {
    refetch?.();
  };

  return (
    <div className="min-h-screen bg-choptime-beige">
      <header className="bg-white shadow-sm border-b border-choptime-orange/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-choptime-brown">
                ChopTime Admin
              </h1>
              <Badge variant="outline" className="ml-3">
                {admin?.role}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-choptime-brown/70">
                {admin?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={logoutAdmin}
                className="text-choptime-brown hover:bg-choptime-orange/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="dishes" className="flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Dishes
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Delivery
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Error loading dashboard data: {error}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshStats}
                    className="ml-4"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-choptime-brown">Dashboard Overview</h2>
              <Button
                variant="outline"
                onClick={handleRefreshStats}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-choptime-orange" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-choptime-brown">
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats?.total_orders || 0
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-choptime-brown">
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats?.pending_orders || 0
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-choptime-brown">
                    {loading ? (
                      <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      formatPrice(Number(stats?.total_revenue) || 0)
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  <Users className="h-4 w-4 text-choptime-orange" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-choptime-brown">
                    {loading ? (
                      <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      formatPrice(Number(stats?.avg_order_value) || 0)
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => setActiveTab('restaurants')}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-choptime-orange/10"
                >
                  <Store className="w-6 h-6 text-choptime-orange" />
                  <span>Manage Restaurants</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('dishes')}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-choptime-orange/10"
                >
                  <Utensils className="w-6 h-6 text-choptime-orange" />
                  <span>Manage Dishes</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('delivery')}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-choptime-orange/10"
                >
                  <Truck className="w-6 h-6 text-choptime-orange" />
                  <span>Delivery Zones</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('orders')}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-choptime-orange/10"
                >
                  <ShoppingBag className="w-6 h-6 text-choptime-orange" />
                  <span>View Orders</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restaurants">
            <RestaurantManagement />
          </TabsContent>

          <TabsContent value="dishes">
            <DishManagement />
          </TabsContent>

          <TabsContent value="delivery">
            <DeliveryManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
