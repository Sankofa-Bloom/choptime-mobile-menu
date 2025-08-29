import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  DollarSign,
  Clock,
  BarChart3,
  ShoppingBag,
  Users,
  Calendar,
  Settings,
  Zap,
  AlertCircle,
  Star
} from 'lucide-react';

interface AdminDashboardOverviewProps {
  stats?: {
    total_orders?: number;
    total_revenue?: number;
    pending_orders?: number;
    avg_order_value?: number;
    total_restaurants?: number;
    active_menus?: number;
  };
  onNavigateToSection: (sectionId: string) => void;
  error?: string | null;
}

const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  stats,
  onNavigateToSection,
  error
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Star className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to ChopTym Admin</h1>
            <p className="text-gray-600 mt-1">Manage your restaurant platform efficiently</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-blue-700">Total Orders</CardTitle>
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-blue-800">{stats.total_orders || 0}</div>
              <p className="text-xs text-blue-600 mt-1">All time orders</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-green-800">{formatCurrency(stats.total_revenue || 0)}</div>
              <p className="text-xs text-green-600 mt-1">All time revenue</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-purple-700">Pending Orders</CardTitle>
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-purple-800">{stats.pending_orders || 0}</div>
              <p className="text-xs text-purple-600 mt-1">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-orange-700">Avg Order Value</CardTitle>
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-orange-800">{formatCurrency(stats.avg_order_value || 0)}</div>
              <p className="text-xs text-orange-600 mt-1">Per order average</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            onClick={() => onNavigateToSection('orders')}
            className="h-24 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all duration-200 group hover:scale-105"
          >
            <div className="flex flex-col items-center gap-3">
              <ShoppingBag className="h-8 w-8 group-hover:scale-110 transition-transform duration-200" />
              <div className="text-center">
                <div className="font-semibold">Order Management</div>
                <div className="text-sm opacity-90">View and manage orders</div>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => onNavigateToSection('restaurants')}
            className="h-24 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200 group hover:scale-105"
          >
            <div className="flex flex-col items-center gap-3">
              <Users className="h-8 w-8 group-hover:scale-110 transition-transform duration-200" />
              <div className="text-center">
                <div className="font-semibold">Restaurant Partners</div>
                <div className="text-sm opacity-90">Manage restaurants</div>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => onNavigateToSection('menus')}
            className="h-24 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium transition-all duration-200 group hover:scale-105"
          >
            <div className="flex flex-col items-center gap-3">
              <Calendar className="h-8 w-8 group-hover:scale-110 transition-transform duration-200" />
              <div className="text-center">
                <div className="font-semibold">Daily Menus</div>
                <div className="text-sm opacity-90">Manage daily menus</div>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Recent Activity / Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-indigo-700 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Active Restaurants</span>
              <span className="font-semibold text-indigo-800">{stats?.total_restaurants || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Active Menus</span>
              <span className="font-semibold text-indigo-800">{stats?.active_menus || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Orders This Week</span>
              <span className="font-semibold text-indigo-800">--</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-700 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-600">Payment Gateway</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-emerald-800">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-600">Email Service</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-emerald-800">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-600">Database</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-emerald-800">Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;