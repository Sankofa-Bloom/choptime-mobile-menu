
import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Users, 
  ChefHat, 
  MapPin, 
  TrendingUp, 
  LogOut, 
  ShoppingBag,
  FileText,
  Settings,
  BarChart3,
  Calendar,
  DollarSign,
  Clock,
  Star
} from 'lucide-react';
import ChopTymLoader from '@/components/ui/ChopTymLoader';
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
      <ChopTymLoader 
        size="lg"
        message="Loading dashboard..."
        subMessage="Setting up your admin panel"
        fullScreen={true}
      />
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-choptym-beige to-orange-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-choptym-brown mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in as an admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-choptym-beige via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-orange-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-choptym-orange to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-choptym-brown to-orange-700 bg-clip-text text-transparent">
                  ChopTym Admin
                </h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Welcome back, {admin.email}
                </p>
              </div>
            </div>
            <Button
              onClick={logoutAdmin}
              variant="outline"
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Total Orders</CardTitle>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-800">{stats.total_orders}</div>
                <p className="text-xs text-blue-600 mt-1">All time orders</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Restaurants</CardTitle>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-800">{restaurants.length}</div>
                <p className="text-xs text-green-600 mt-1">Active partners</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Menu Items</CardTitle>
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-800">{dishes.length}</div>
                <p className="text-xs text-purple-600 mt-1">Available dishes</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Delivery Zones</CardTitle>
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-800">{deliveryZones.length}</div>
                <p className="text-xs text-orange-600 mt-1">Coverage areas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-choptym-brown mb-6 flex items-center gap-3">
            <Settings className="h-6 w-6 text-choptym-orange" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 bg-white/60 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-200 border-orange-200 hover:border-orange-300"
              onClick={() => document.getElementById('csv-uploader')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <div className="text-center">
                <FileText className="h-8 w-8 text-choptym-orange mx-auto mb-2" />
                <span className="text-choptym-brown font-medium">Import Data</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 bg-white/60 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-200 border-green-200 hover:border-green-300"
              onClick={() => document.getElementById('order-management')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <div className="text-center">
                <ShoppingBag className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <span className="text-green-700 font-medium">View Orders</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 bg-white/60 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-200 border-purple-200 hover:border-purple-300"
              onClick={() => document.getElementById('restaurant-management')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <div className="text-center">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <span className="text-purple-700 font-medium">Manage Restaurants</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Management Sections */}
        <div className="space-y-12">
          {/* Orders Section */}
          <div id="order-management">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-choptym-brown">Order Management</h2>
                <p className="text-gray-600">Track and manage customer orders</p>
              </div>
            </div>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <OrderManagement />
              </CardContent>
            </Card>
          </div>

          {/* Restaurants Section */}
          <div id="restaurant-management">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-choptym-brown">Restaurant Management</h2>
                <p className="text-gray-600">Manage restaurant partners and settings</p>
              </div>
            </div>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <RestaurantManagement />
              </CardContent>
            </Card>
          </div>

          {/* Dishes Section */}
          <div id="dish-management">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-choptym-brown">Dish Management</h2>
                <p className="text-gray-600">Manage menu items and categories</p>
              </div>
            </div>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <DishManagement />
              </CardContent>
            </Card>
          </div>

          {/* Delivery Zones Section */}
          <div id="delivery-management">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-choptym-brown">Delivery Zones</h2>
                <p className="text-gray-600">Configure delivery areas and pricing</p>
              </div>
            </div>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <DeliveryManagement />
              </CardContent>
            </Card>
          </div>

          {/* CSV Import Section */}
          <div id="csv-uploader">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-choptym-brown">Data Import</h2>
                <p className="text-gray-600">Bulk import restaurant and menu data</p>
              </div>
            </div>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <CSVUploader />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
