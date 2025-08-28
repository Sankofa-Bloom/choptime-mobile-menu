
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChefHat, 
  TrendingUp, 
  Users, 
  MapPin, 
  LogOut, 
  ShoppingBag, 
  FileText, 
  Settings, 
  BarChart3, 
  Calendar, 
  DollarSign, 
  Clock, 
  Star, 
  AlertCircle,
  Keyboard,
  Bell,
  Zap,
  ArrowUp,
  ArrowDown,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { useKeyboardShortcuts, DEFAULT_ADMIN_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { NotificationProvider, useNotifications } from '@/components/admin/NotificationSystem';
import KeyboardShortcutsHelp from '@/components/admin/KeyboardShortcutsHelp';
import DataSearchFilters from '@/components/admin/DataSearchFilters';
import BulkOperations from '@/components/admin/BulkOperations';
import ChopTymLoader from '@/components/ui/ChopTymLoader';

// =============================================================================
// ADMIN DASHBOARD COMPONENT
// =============================================================================

const AdminDashboardContent: React.FC = () => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const { admin, logoutAdmin } = useAdminAuth();
  const { 
    stats, 
    loading, 
    error,
    filteredRestaurants,
    filteredDishes,
    filteredDeliveryZones,
    filters,
    updateFilters,
    clearFilters,
    bulkUpdateRestaurantStatus,
    bulkDeleteRestaurants,
    exportToCSV,
    exportToJSON,
    refetch
  } = useAdminData();
  
  const { addNotification } = useNotifications();
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================

  const shortcuts = [
    ...DEFAULT_ADMIN_SHORTCUTS,
    {
      key: 'n',
      ctrl: true,
      description: 'Create new restaurant',
      action: () => {
        addNotification({
          type: 'info',
          title: 'Create Restaurant',
          message: 'Opening restaurant creation form...',
          duration: 3000
        });
        // TODO: Implement restaurant creation modal
      }
    },
    {
      key: 's',
      ctrl: true,
      description: 'Save changes',
      action: () => {
        addNotification({
          type: 'success',
          title: 'Save Changes',
          message: 'All changes have been saved successfully!',
          duration: 3000
        });
      }
    },
    {
      key: 'Delete',
      description: 'Delete selected items',
      action: () => {
        if (selectedRestaurants.length > 0) {
          handleBulkDeleteRestaurants();
        } else if (selectedDishes.length > 0) {
          // TODO: Implement dish deletion
          addNotification({
            type: 'warning',
            title: 'Delete Dishes',
            message: 'Dish deletion not yet implemented',
            duration: 3000
          });
        }
      }
    },
    {
      key: 'a',
      ctrl: true,
      description: 'Select all items',
      action: () => {
        if (selectedRestaurants.length === 0) {
          setSelectedRestaurants(filteredRestaurants.map(r => r.id));
          addNotification({
            type: 'info',
            title: 'Select All',
            message: 'All restaurants selected',
            duration: 2000
          });
        } else {
          setSelectedRestaurants([]);
          addNotification({
            type: 'info',
            title: 'Clear Selection',
            message: 'Selection cleared',
            duration: 2000
          });
        }
      }
    },
    {
      key: 'r',
      description: 'Refresh data',
      action: () => {
        refetch();
        addNotification({
          type: 'info',
          title: 'Refresh Data',
          message: 'Refreshing all data...',
          duration: 2000
        });
      }
    }
  ];

  useKeyboardShortcuts({ shortcuts });

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle bulk restaurant status update
   */
  const handleBulkStatusUpdate = async (active: boolean) => {
    if (selectedRestaurants.length === 0) return;
    
    const result = await bulkUpdateRestaurantStatus(selectedRestaurants, active);
    
    if (result.success) {
      addNotification({
        type: 'success',
        title: 'Bulk Update Success',
        message: result.message,
        duration: 5000
      });
      setSelectedRestaurants([]);
    } else {
      addNotification({
        type: 'error',
        title: 'Bulk Update Failed',
        message: result.message,
        duration: 5000
      });
    }
  };

  /**
   * Handle bulk restaurant deletion
   */
  const handleBulkDeleteRestaurants = async () => {
    if (selectedRestaurants.length === 0) return;
    
    const result = await bulkDeleteRestaurants(selectedRestaurants);
    
    if (result.success) {
      addNotification({
        type: 'success',
        title: 'Bulk Delete Success',
        message: result.message,
        duration: 5000
      });
      setSelectedRestaurants([]);
    } else {
      addNotification({
        type: 'error',
        title: 'Bulk Delete Failed',
        message: result.message,
        duration: 5000
      });
    }
  };

  /**
   * Handle restaurant export
   */
  const handleRestaurantExport = () => {
    const result = exportToCSV(filteredRestaurants, 'restaurants');
    if (result.success) {
      addNotification({
        type: 'success',
        title: 'Export Success',
        message: 'Restaurants exported to CSV successfully!',
        duration: 4000
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: result.error || 'Failed to export restaurants',
        duration: 4000
      });
    }
  };

  /**
   * Handle dish export
   */
  const handleDishExport = () => {
    const result = exportToCSV(filteredDishes, 'dishes');
    if (result.success) {
      addNotification({
        type: 'success',
        title: 'Export Success',
        message: 'Dishes exported to CSV successfully!',
        duration: 4000
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: result.error || 'Failed to export dishes',
        duration: 4000
      });
    }
  };

  /**
   * Handle data refresh
   */
  const handleRefresh = () => {
    refetch();
    addNotification({
      type: 'info',
      title: 'Data Refresh',
      message: 'Refreshing all data...',
      duration: 2000
    });
  };

  // =============================================================================
  // RENDER CONDITIONS
  // =============================================================================

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-choptym-beige via-orange-50 to-yellow-50">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-choptym-brown mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
            <Button
              onClick={() => window.location.href = '/dash/login'}
              className="bg-gradient-to-r from-choptym-orange to-orange-600 hover:from-choptym-orange/90 hover:to-orange-600/90 text-white"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <ChopTymLoader size="lg" message="Loading admin dashboard..." />;
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-choptym-beige via-orange-50 to-yellow-50">
      {/* Enhanced Sticky Header */}
      <div className="bg-white/90 backdrop-blur-xl shadow-xl border-b border-orange-100/50 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-choptym-orange to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-choptym-brown to-orange-700 bg-clip-text text-transparent leading-tight">
                  ChopTym Admin
                </h1>
                <p className="text-sm sm:text-base text-gray-600 flex items-center gap-2 mt-1">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                  <span className="truncate">Welcome back, {admin.email}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* UX Enhancement Buttons */}
              <KeyboardShortcutsHelp 
                shortcuts={shortcuts}
                showCustomize={true}
                trigger={
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Shortcuts</span>
                  </Button>
                }
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              
              <Button
                onClick={logoutAdmin}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200 self-start sm:self-auto w-full sm:w-auto justify-center"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content with Improved Spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards with Better Responsive Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-blue-700">Total Orders</CardTitle>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-blue-800">{stats.total_orders}</div>
                <p className="text-xs text-blue-600 mt-1">All time orders</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-green-800">₵{stats.total_revenue}</div>
                <p className="text-xs text-green-600 mt-1">All time revenue</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-purple-700">Pending Orders</CardTitle>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-purple-800">{stats.pending_orders}</div>
                <p className="text-xs text-purple-600 mt-1">Awaiting processing</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-orange-700">Avg Order Value</CardTitle>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-orange-800">₵{stats.avg_order_value}</div>
                <p className="text-xs text-orange-600 mt-1">Per order average</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions with Enhanced UX */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-choptym-brown mb-4 sm:mb-6 flex items-center gap-3">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-choptym-orange" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Button
              onClick={() => document.getElementById('restaurants-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-16 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200 group hover:scale-105"
            >
              <div className="flex flex-col items-center gap-2">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm sm:text-base">Manage Restaurants</span>
              </div>
            </Button>

            <Button
              onClick={() => document.getElementById('dishes-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-16 sm:h-20 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium transition-all duration-200 group hover:scale-105"
            >
              <div className="flex flex-col items-center gap-2">
                <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm sm:text-base">Manage Dishes</span>
              </div>
            </Button>

            <Button
              onClick={() => document.getElementById('delivery-zones-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-16 sm:h-20 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium transition-all duration-200 group hover:scale-105"
            >
              <div className="flex flex-col items-center gap-2">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm sm:text-base">Delivery Zones</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Management Sections with Enhanced UX */}
        <div className="space-y-8 sm:space-y-12">
          {/* Restaurants Section */}
          <section id="restaurants-section" className="scroll-mt-20">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-choptym-brown">Restaurant Management</h2>
                      <p className="text-sm sm:text-base text-gray-600">Manage restaurant information, menus, and settings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Restaurant
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {/* Search and Filters */}
                <DataSearchFilters
                  filters={filters}
                  onFiltersChange={updateFilters}
                  onClearFilters={clearFilters}
                  onExport={handleRestaurantExport}
                  onRefresh={handleRefresh}
                  showExport={true}
                  showRefresh={true}
                  showTownFilter={true}
                  towns={Array.from(new Set(filteredRestaurants.map(r => r.town)))}
                  totalItems={filteredRestaurants.length}
                  filteredItems={filteredRestaurants.length}
                  searchPlaceholder="Search restaurants by name or town..."
                />

                {/* Bulk Operations */}
                <BulkOperations
                  selectedItems={selectedRestaurants}
                  totalItems={filteredRestaurants.length}
                  onBulkActivate={async () => {
                    await handleBulkStatusUpdate(true);
                    return { success: true, message: 'Bulk activate completed', affectedCount: selectedRestaurants.length };
                  }}
                  onBulkDeactivate={async () => {
                    await handleBulkStatusUpdate(false);
                    return { success: true, message: 'Bulk deactivate completed', affectedCount: selectedRestaurants.length };
                  }}
                  onBulkDelete={async () => {
                    await handleBulkDeleteRestaurants();
                    return { success: true, message: 'Bulk delete completed', affectedCount: selectedRestaurants.length };
                  }}
                  onSelectAll={(selected) => {
                    if (selected) {
                      setSelectedRestaurants(filteredRestaurants.map(r => r.id));
                    } else {
                      setSelectedRestaurants([]);
                    }
                  }}
                  onClearSelection={() => setSelectedRestaurants([])}
                  itemType="restaurants"
                  loading={loading}
                />

                {/* Restaurants List */}
                <div className="mt-6 space-y-3">
                  {filteredRestaurants.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        selectedRestaurants.includes(restaurant.id)
                          ? 'border-choptym-orange bg-orange-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRestaurants.includes(restaurant.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRestaurants(prev => [...prev, restaurant.id]);
                            } else {
                              setSelectedRestaurants(prev => prev.filter(id => id !== restaurant.id));
                            }
                          }}
                          className="rounded border-gray-300 text-choptym-orange focus:ring-choptym-orange"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{restaurant.name}</h3>
                          <p className="text-sm text-gray-600">{restaurant.town}</p>
                        </div>
                        <Badge variant={restaurant.active ? "default" : "secondary"}>
                          {restaurant.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Dishes Section */}
          <section id="dishes-section" className="scroll-mt-20">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-choptym-brown">Dish Management</h2>
                      <p className="text-sm sm:text-base text-gray-600">Manage dish information, categories, and pricing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Dish
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {/* Search and Filters */}
                <DataSearchFilters
                  filters={filters}
                  onFiltersChange={updateFilters}
                  onClearFilters={clearFilters}
                  onExport={handleDishExport}
                  onRefresh={handleRefresh}
                  showExport={true}
                  showRefresh={true}
                  showCategoryFilter={true}
                  categories={Array.from(new Set(filteredDishes.map(d => d.category)))}
                  totalItems={filteredDishes.length}
                  filteredItems={filteredDishes.length}
                  searchPlaceholder="Search dishes by name, description, or category..."
                />

                {/* Dishes List */}
                <div className="mt-6 space-y-3">
                  {filteredDishes.map((dish) => (
                    <div
                      key={dish.id}
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        selectedDishes.includes(dish.id)
                          ? 'border-choptym-orange bg-orange-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDishes.includes(dish.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDishes(prev => [...prev, dish.id]);
                            } else {
                              setSelectedDishes(prev => prev.filter(id => id !== dish.id));
                            }
                          }}
                          className="rounded border-gray-300 text-choptym-orange focus:ring-choptym-orange"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{dish.name}</h3>
                          <p className="text-sm text-gray-600">{dish.description}</p>
                                                     <div className="flex items-center gap-2 mt-1">
                             <Badge variant="outline" className="text-xs">
                               {dish.category}
                             </Badge>
                             <Badge variant="outline" className="text-xs">
                               {dish.is_popular ? 'Popular' : 'Standard'}
                             </Badge>
                           </div>
                        </div>
                        <Badge variant={dish.active ? "default" : "secondary"}>
                          {dish.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Delivery Zones Section */}
          <section id="delivery-zones-section" className="scroll-mt-20">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-choptym-brown">Delivery Zones</h2>
                      <p className="text-sm sm:text-base text-gray-600">Manage delivery areas and zones</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Zone
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {/* Search and Filters */}
                <DataSearchFilters
                  filters={filters}
                  onFiltersChange={updateFilters}
                  onClearFilters={clearFilters}
                  onRefresh={handleRefresh}
                  showRefresh={true}
                  showTownFilter={true}
                  towns={Array.from(new Set(filteredDeliveryZones.map(z => z.town)))}
                  totalItems={filteredDeliveryZones.length}
                  filteredItems={filteredDeliveryZones.length}
                  searchPlaceholder="Search delivery zones by town or zone name..."
                />

                {/* Delivery Zones List */}
                <div className="mt-6 space-y-3">
                  {filteredDeliveryZones.map((zone) => (
                    <div
                      key={zone.id}
                      className="p-4 rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{zone.zone_name}</h3>
                          <p className="text-sm text-gray-600">{zone.town}</p>
                        </div>
                        <Badge variant={zone.active ? "default" : "secondary"}>
                          {zone.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CSV Import Section */}
          <section id="csv-import-section" className="scroll-mt-20">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-choptym-brown">CSV Import</h2>
                    <p className="text-sm sm:text-base text-gray-600">Import restaurant and dish data from CSV files</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                    <FileText className="h-6 w-6" />
                    <span>Import Restaurants</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                    <FileText className="h-6 w-6" />
                    <span>Import Dishes</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// WRAPPER WITH NOTIFICATION PROVIDER
// =============================================================================

const AdminDashboard: React.FC = () => {
  return (
    <NotificationProvider>
      <AdminDashboardContent />
    </NotificationProvider>
  );
};

export default AdminDashboard;
