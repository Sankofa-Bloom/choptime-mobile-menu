
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChefHat,
  LogOut,
  Keyboard,
  RefreshCw,
  Menu,
  X,
  AlertCircle,
  Star,
  Settings,
  MapPin,
  DollarSign,
  FileText,
  Bell,
  BarChart3
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { useKeyboardShortcuts, DEFAULT_ADMIN_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { NotificationProvider, useNotifications } from '@/components/admin/NotificationSystem';
import KeyboardShortcutsHelp from '@/components/admin/KeyboardShortcutsHelp';
import ChopTymLoader from '@/components/ui/ChopTymLoader';
import ComprehensiveOrderManagement from '@/components/admin/ComprehensiveOrderManagement';
import ComprehensiveRestaurantManagement from '@/components/admin/ComprehensiveRestaurantManagement';
import DynamicMenuManagement from '@/components/admin/DynamicMenuManagement';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminDashboardOverview from '@/components/admin/AdminDashboardOverview';
import AppSettings from '@/components/admin/AppSettings';

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
    refetch
  } = useAdminData();

  const { addNotification } = useNotifications();

  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        addNotification({
          type: 'info',
          title: 'Delete Items',
          message: 'Use the delete buttons in each management section',
          duration: 3000
        });
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

  /**
   * Handle section navigation
   */
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setSidebarOpen(false); // Close mobile sidebar when navigating
  };

  /**
   * Render content based on active section
   */
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <AdminDashboardOverview
            stats={stats}
            onNavigateToSection={handleSectionChange}
            error={error}
          />
        );

      case 'orders':
        return <ComprehensiveOrderManagement />;

      case 'restaurants':
        return <ComprehensiveRestaurantManagement />;

      case 'menus':
        return <DynamicMenuManagement />;

      case 'settings':
        return <AppSettings />;

      case 'analytics':
        return (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Analytics & Reports</h2>
                  <p className="text-sm text-gray-600">View detailed analytics and generate reports</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-600">Detailed analytics and reporting features are under development.</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'data':
        return (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Data Management</h2>
                  <p className="text-sm text-gray-600">Import, export, and manage your data</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Management Coming Soon</h3>
                <p className="text-gray-600">Bulk data operations and management features are under development.</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'notifications':
        return (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
                  <p className="text-sm text-gray-600">Configure system notifications and alerts</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Settings Coming Soon</h3>
                <p className="text-gray-600">Advanced notification configuration features are under development.</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <AdminDashboardOverview
            stats={stats}
            onNavigateToSection={handleSectionChange}
            error={error}
          />
        );
    }
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
    <div className="min-h-screen bg-gradient-to-br from-choptym-beige via-orange-50 to-yellow-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        stats={stats}
        className="hidden lg:flex"
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs">
            <AdminSidebar
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              stats={stats}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Enhanced Sticky Header */}
        <div className="bg-white/90 backdrop-blur-xl shadow-xl border-b border-orange-100/50 sticky top-0 z-30 transition-all duration-300">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>

                <div className="w-10 h-10 bg-gradient-to-br from-choptym-orange to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-choptym-brown to-orange-700 bg-clip-text text-transparent leading-tight">
                    ChopTym Admin
                  </h1>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="truncate">Welcome back, {admin.email}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                  className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </div>
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
