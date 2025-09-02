/**
 * PWA Notification Service
 * Handles push notifications for order status updates and location permissions
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private vapidPublicKey: string = '';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private configLoaded: boolean = false;

  /**
   * Load configuration from environment variables
   */
  private async loadConfig(): Promise<void> {
    if (this.configLoaded) return;

    try {
      // Use VAPID key from environment variables
      this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
      
      if (!this.vapidPublicKey) {
        console.warn('VAPID public key not found in environment variables');
        // Fallback to a dummy key for development
        this.vapidPublicKey = 'BKxQzAgO8Q8G3L3Z3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3';
      }
      
      this.configLoaded = true;
      console.log('Notification config loaded from environment variables');
    } catch (error) {
      console.error('Failed to load notification config:', error);
      // Fallback to a dummy key for development
      this.vapidPublicKey = 'BKxQzAgO8Q8G3L3Z3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3';
      this.configLoaded = true;
    }
  }

  /**
   * Wait for service worker to be fully ready
   */
  private async waitForServiceWorkerReady(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    return new Promise((resolve, reject) => {
      const registration = this.serviceWorkerRegistration!;

      // If service worker is already active, resolve immediately
      if (registration.active) {
        console.log('Service worker is already active');
        resolve();
        return;
      }

      // Wait for service worker to become active
      const checkState = () => {
        if (registration.active) {
          console.log('Service worker became active');
          resolve();
          return;
        }

        if (registration.installing || registration.waiting) {
          console.log('Service worker is installing/waiting, waiting...');
          // Check again in 100ms
          setTimeout(checkState, 100);
        } else {
          reject(new Error('Service worker failed to activate'));
        }
      };

      // Add event listeners for state changes
      const onStateChange = () => {
        console.log('Service worker state changed:', registration.active?.state);
        if (registration.active?.state === 'activated') {
          resolve();
        }
      };

      if (registration.installing) {
        registration.installing.addEventListener('statechange', onStateChange);
      }

      if (registration.waiting) {
        registration.waiting.addEventListener('statechange', onStateChange);
      }

      // Start checking state
      checkState();

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Service worker activation timeout'));
      }, 10000);
    });
  }

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        console.warn('Notifications not supported in this browser');
        return;
      }

      // Load configuration first
      await this.loadConfig();

      // Register service worker if not already registered
      if ('serviceWorker' in navigator) {
        try {
          this.serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();

          if (!this.serviceWorkerRegistration) {
            this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered for notifications');
          }
        } catch (swError) {
          console.error('Service worker registration failed:', swError);
          // Don't throw - just log the error and continue
        }
      }
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      // Don't throw - just log the error and continue
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  /**
   * Get service worker status for debugging
   */
  getServiceWorkerStatus(): string {
    if (!this.serviceWorkerRegistration) {
      return 'Not registered';
    }

    const reg = this.serviceWorkerRegistration;
    let status = 'Registered';

    if (reg.installing) {
      status += ' (Installing)';
    } else if (reg.waiting) {
      status += ' (Waiting)';
    } else if (reg.active) {
      status += ' (Active)';
    }

    return status;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscriptionData | null> {
    try {
      // Ensure config is loaded
      await this.loadConfig();

      if (!this.serviceWorkerRegistration) {
        throw new Error('Service worker not registered');
      }

      // Wait for service worker to be ready
      await this.waitForServiceWorkerReady();

      // Additional check to ensure push manager is available
      if (!this.serviceWorkerRegistration.pushManager) {
        throw new Error('Push manager not available');
      }

      if (!this.vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      console.log('Push subscription created:', subscriptionData);

      // Send subscription to backend
      await this.registerSubscription(subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('no active Service Worker')) {
          console.error('❌ Service worker is not active. Try refreshing the page or checking service worker registration.');
        } else if (error.message.includes('permission')) {
          console.error('❌ Notification permission not granted.');
        } else if (error.message.includes('VAPID')) {
          console.error('❌ VAPID key configuration error.');
        }
      }

      return null;
    }
  }

  /**
   * Register push subscription with backend
   */
  private async registerSubscription(subscription: PushSubscriptionData): Promise<void> {
    try {
      // Use backend API URL instead of relative URL
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/register-push-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: localStorage.getItem('user_id') || 'anonymous'
        })
      });

      if (response.status === 404) {
        // Backend endpoint not implemented yet
        console.warn('Push notification backend not implemented yet, subscription stored locally only');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to register subscription');
      }

      console.log('Push subscription registered with backend');
    } catch (error) {
      console.error('Failed to register push subscription:', error);
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<void> {
    try {
      if (!this.serviceWorkerRegistration) {
        return;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }

  /**
   * Show a local notification (for immediate display)
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (this.getPermissionStatus() !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if (!this.serviceWorkerRegistration) {
      console.warn('Service worker not registered');
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/logo-192.png',
      badge: payload.badge || '/logo-192.png',
      tag: payload.tag || 'choptym-notification',
      data: payload.data,
      actions: payload.actions,
      requireInteraction: false,
      silent: false
    };

    await this.serviceWorkerRegistration.showNotification(payload.title, options);
  }

  /**
   * Send order status update notification
   */
  async notifyOrderStatusUpdate(orderId: string, status: string, restaurantName: string): Promise<void> {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared!',
      preparing: 'Your order is now being prepared!',
      ready: 'Your order is ready for delivery!',
      out_for_delivery: 'Your order is out for delivery!',
      delivered: 'Your order has been delivered successfully!'
    };

    const message = statusMessages[status as keyof typeof statusMessages] || `Your order status has been updated to: ${status}`;

    await this.showNotification({
      title: 'Order Update',
      body: `${message}\nRestaurant: ${restaurantName}`,
      tag: `order-${orderId}`,
      data: { orderId, status, type: 'order_update' }
    });
  }

  /**
   * Send promotional notification
   */
  async notifyPromotion(title: string, message: string): Promise<void> {
    await this.showNotification({
      title,
      body: message,
      tag: 'promotion',
      data: { type: 'promotion' }
    });
  }

  /**
   * Check if push notifications are supported and enabled
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'Notification' in window &&
      'PushManager' in window
    );
  }

  /**
   * Get push subscription status
   */
  async getSubscriptionStatus(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
    return !!subscription;
  }

  // Utility methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;