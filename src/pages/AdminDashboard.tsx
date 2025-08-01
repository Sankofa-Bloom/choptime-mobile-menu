
import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, ChefHat, MapPin, TrendingUp, LogOut } from 'lucide-react';
import RestaurantManagement from '@/components/admin/RestaurantManagement';
import DishManagement from '@/components/admin/DishManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import DeliveryManagement from '@/components/admin/DeliveryManagement';
import CSVUploader from '@/components/admin/CSVUploader';

const AdminDashboard = () => {
  const { admin, logoutAdmin, loading: authLoading } = useAdminAuth();
  const { 
    restaurants, 
    dishes, 
    deliveryZones, 
    stats, 
    loading: dataLoading 
  } = useAdminData();

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-choptime-beige">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-choptime-orange" />
          <span className="text-choptime-brown">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-choptime-beige">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-choptime-brown mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in as an admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-choptime-beige">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-choptime-brown">KwataLink Admin</h1>
              <p className="text-gray-600">Welcome back, {admin.email}</p>
            </div>
            <Button
              onClick={logoutAdmin}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_orders}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restaurants.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
                <ChefHat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dishes.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery Zones</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveryZones.length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Management Sections */}
        <div className="space-y-8">
          <CSVUploader />
          <OrderManagement />
          <RestaurantManagement />
          <DishManagement />
          <DeliveryManagement />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
