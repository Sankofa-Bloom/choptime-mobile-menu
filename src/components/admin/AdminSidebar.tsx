import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Calendar,
  Settings,
  BarChart3,
  FileText,
  Bell,
  MapPin,
  DollarSign,
  ChefHat,
  Menu,
  X,
  Home,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
}

export interface SidebarSection {
  id: string;
  label: string;
  items: SidebarItem[];
}

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  stats?: {
    total_orders?: number;
    pending_orders?: number;
    total_restaurants?: number;
    active_menus?: number;
  };
  className?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onSectionChange,
  stats,
  className
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarSections: SidebarSection[] = [
    {
      id: 'overview',
      label: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          description: 'Overview and statistics'
        }
      ]
    },
    {
      id: 'management',
      label: 'Management',
      items: [
        {
          id: 'orders',
          label: 'Orders',
          icon: ShoppingBag,
          badge: stats?.total_orders,
          description: 'Manage customer orders'
        },
        {
          id: 'restaurants',
          label: 'Restaurants',
          icon: Users,
          badge: stats?.total_restaurants,
          description: 'Manage restaurant partners'
        },
        {
          id: 'menus',
          label: 'Daily Menus',
          icon: Calendar,
          badge: stats?.active_menus,
          description: 'Manage daily menus'
        }
      ]
    },
    {
      id: 'system',
      label: 'System',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          description: 'System configuration'
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          description: 'View reports and insights'
        },
        {
          id: 'data',
          label: 'Data Management',
          icon: FileText,
          description: 'Import/export operations'
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          description: 'Configure alerts'
        }
      ]
    }
  ];

  const getStatsForSection = (sectionId: string) => {
    switch (sectionId) {
      case 'orders':
        return {
          value: stats?.pending_orders || 0,
          label: 'Pending',
          color: stats?.pending_orders && stats.pending_orders > 5 ? 'destructive' : 'secondary'
        };
      case 'restaurants':
        return {
          value: stats?.total_restaurants || 0,
          label: 'Total',
          color: 'default' as const
        };
      case 'menus':
        return {
          value: stats?.active_menus || 0,
          label: 'Active',
          color: 'default' as const
        };
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <ChefHat className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 h-8 w-8"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        {sidebarSections.map((section) => (
          <div key={section.id} className="mb-6">
            {!isCollapsed && (
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.label}
                </h3>
              </div>
            )}

            <div className="space-y-1 px-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                const statsInfo = getStatsForSection(item.id);
                const isActive = activeSection === item.id;

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-10 px-3 transition-all duration-200",
                      isActive && "bg-orange-50 border-orange-200 text-orange-700",
                      isCollapsed && "justify-center px-2"
                    )}
                    onClick={() => onSectionChange(item.id)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn(
                      "flex-shrink-0",
                      isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
                    )} />

                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium truncate">
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="text-xs text-gray-500 truncate">
                              {item.description}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-2">
                          {statsInfo && statsInfo.value > 0 && (
                            <Badge
                              variant={statsInfo.color}
                              className="text-xs h-5 px-1.5"
                            >
                              {statsInfo.value}
                            </Badge>
                          )}
                          {item.badge && typeof item.badge === 'number' && item.badge > 0 && (
                            <Badge variant="secondary" className="text-xs h-5 px-1.5">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && stats && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              Quick Stats
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-500" />
                <span className="text-gray-600">{stats.pending_orders || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-blue-500" />
                <span className="text-gray-600">{stats.total_restaurants || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;