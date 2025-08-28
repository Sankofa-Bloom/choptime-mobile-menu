import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Bell,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Auto-dismiss duration in ms
  actions?: NotificationAction[];
  persistent?: boolean; // Won't auto-dismiss
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export interface NotificationSystemProps {
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoDismiss?: boolean;
  defaultDuration?: number;
  showNotificationCount?: boolean;
  enableSound?: boolean;
}

// =============================================================================
// NOTIFICATION CONTEXT
// =============================================================================

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
}

const NotificationContext = React.createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// =============================================================================
// NOTIFICATION PROVIDER
// =============================================================================

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextId, setNextId] = useState(1);

  // =============================================================================
  // NOTIFICATION MANAGEMENT
  // =============================================================================

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `notification-${nextId}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, newNotification]);
    setNextId(prev => prev + 1);

    return id;
  }, [nextId]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, ...updates } : n)
    );
  }, []);

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    updateNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// =============================================================================
// NOTIFICATION ITEM COMPONENT
// =============================================================================

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Notification>) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRemove,
  onUpdate
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss if not persistent and duration is set
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notification, onRemove]);

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationStyles = () => {
    const baseStyles = 'border-l-4 transition-all duration-300 ease-in-out';
    
    switch (notification.type) {
      case 'success':
        return `${baseStyles} border-l-green-500 bg-green-50`;
      case 'error':
        return `${baseStyles} border-l-red-500 bg-red-50`;
      case 'warning':
        return `${baseStyles} border-l-yellow-500 bg-yellow-50`;
      case 'info':
        return `${baseStyles} border-l-blue-500 bg-blue-50`;
      default:
        return `${baseStyles} border-l-gray-500 bg-gray-50`;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div
      className={`
        notification-item
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        ${isExpanded ? 'max-h-96' : 'max-h-32'}
        overflow-hidden
        transform
        transition-all
        duration-300
        ease-in-out
        mb-3
        shadow-lg
        rounded-lg
        border
        bg-white
        hover:shadow-xl
        cursor-pointer
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <Alert className={`${getNotificationStyles()} border-0 rounded-lg`}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {notification.title}
                </h4>
                <p className={`text-sm text-gray-600 ${isExpanded ? 'block' : 'line-clamp-2'}`}>
                  {notification.message}
                </p>
                
                {/* Actions */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {notification.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick();
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp and Close */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-500">
                  {formatTimestamp(notification.timestamp)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(notification.id);
                  }}
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
};

// =============================================================================
// NOTIFICATION SYSTEM COMPONENT
// =============================================================================

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  maxNotifications = 5,
  position = 'top-right',
  autoDismiss = true,
  defaultDuration = 5000,
  showNotificationCount = true,
  enableSound = true
}) => {
  const { notifications, clearAll } = useNotifications();
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  const playNotificationSound = () => {
    if (!enableSound || isMuted) return;
    
    // Create a simple notification sound
    const audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    // Play sound for new notifications
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      if (Date.now() - latestNotification.timestamp.getTime() < 1000) {
        playNotificationSound();
      }
    }
  }, [notifications]);

  // =============================================================================
  // RENDER
  // =============================================================================

  if (notifications.length === 0) {
    return null;
  }

  const visibleNotifications = notifications.slice(-maxNotifications);

  return createPortal(
    <div className={`fixed z-50 ${getPositionClasses()} max-w-sm w-full`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 bg-white rounded-lg shadow-md p-3 border">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-900">Notifications</span>
          {showNotificationCount && (
            <Badge variant="secondary" className="ml-2">
              {notifications.length}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="h-8 w-8 p-0"
            title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8 p-0"
            title="Notification settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            title="Clear all notifications"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {visibleNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={(id) => {
              // This will be handled by the context
            }}
            onUpdate={(id, updates) => {
              // This will be handled by the context
            }}
          />
        ))}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-3 bg-white rounded-lg shadow-md p-4 border">
          <h4 className="font-medium text-gray-900 mb-3">Notification Settings</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sound</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="h-8 w-8 p-0"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Auto-dismiss</span>
              <Badge variant={autoDismiss ? "default" : "secondary"}>
                {autoDismiss ? "On" : "Off"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Position</span>
              <Badge variant="outline">{position}</Badge>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default NotificationSystem; 