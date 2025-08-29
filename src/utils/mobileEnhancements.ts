/**
 * MOBILE ENHANCEMENTS
 * Mobile-specific features for PWA and native apps
 */

import { Capacitor } from '@capacitor/core';

// Mobile detection
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

// Touch and gesture utilities
export class MobileGestures {
  static enableSwipeGestures(element: HTMLElement, callbacks: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
  }) {
    let startX = 0;
    let startY = 0;
    const minSwipeDistance = 50;

    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    element.addEventListener('touchend', (e) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = startX - endX;
      const diffY = startY - endY;

      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);

      if (Math.max(absDiffX, absDiffY) > minSwipeDistance) {
        if (absDiffX > absDiffY) {
          // Horizontal swipe
          if (diffX > 0 && callbacks.onSwipeLeft) {
            callbacks.onSwipeLeft();
          } else if (diffX < 0 && callbacks.onSwipeRight) {
            callbacks.onSwipeRight();
          }
        } else {
          // Vertical swipe
          if (diffY > 0 && callbacks.onSwipeUp) {
            callbacks.onSwipeUp();
          } else if (diffY < 0 && callbacks.onSwipeDown) {
            callbacks.onSwipeDown();
          }
        }
      }
    });
  }

  static addHapticFeedback() {
    if (isNativeApp() && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  static enablePullToRefresh(callback: () => void) {
    let startY = 0;
    let isPulling = false;

    document.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    });

    document.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (pullDistance > 100 && window.scrollY === 0) {
        isPulling = true;
        e.preventDefault();
      }
    });

    document.addEventListener('touchend', () => {
      if (isPulling) {
        callback();
        this.addHapticFeedback();
      }
      isPulling = false;
    });
  }
}

// Mobile-optimized notifications
export class MobileNotifications {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static showOrderUpdate(title: string, body: string, orderId: string) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/choptym-logo.jpeg',
        badge: '/favicon.ico',
        tag: `order-${orderId}`,
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Order'
          }
        ]
      });

      notification.onclick = () => {
        window.focus();
        // Navigate to order details
        window.location.href = `/order/${orderId}`;
      };

      // Add haptic feedback for mobile
      MobileGestures.addHapticFeedback();
    }
  }

  static showPaymentSuccess(amount: number, currency = 'FCFA') {
    this.showOrderUpdate(
      'Payment Successful! 🎉',
      `Your payment of ${amount.toLocaleString()} ${currency} has been processed.`,
      'payment-success'
    );
  }
}

// Mobile-optimized form handling
export class MobileForms {
  static enhanceInputs() {
    // Auto-focus next input on mobile
    document.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.type === 'tel' && input.value.length === input.maxLength) {
        const nextInput = input.nextElementSibling as HTMLInputElement;
        if (nextInput && nextInput.tagName === 'INPUT') {
          nextInput.focus();
        }
      }
    });

    // Better number input handling
    document.querySelectorAll('input[type="tel"]').forEach(input => {
      input.setAttribute('inputmode', 'tel');
      input.setAttribute('autocomplete', 'tel');
    });

    // Better email input handling
    document.querySelectorAll('input[type="email"]').forEach(input => {
      input.setAttribute('inputmode', 'email');
      input.setAttribute('autocomplete', 'email');
    });
  }

  static addInputValidation() {
    // Real-time validation feedback
    document.addEventListener('blur', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.hasAttribute('required') && !input.value.trim()) {
        this.showValidationError(input, 'This field is required');
      }
    });
  }

  static showValidationError(input: HTMLInputElement, message: string) {
    // Remove existing error
    const existingError = input.parentElement?.querySelector('.validation-error');
    if (existingError) {
      existingError.remove();
    }

    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      animation: shake 0.5s ease-in-out;
    `;

    input.parentElement?.appendChild(errorDiv);

    // Add shake animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);

    // Add haptic feedback
    MobileGestures.addHapticFeedback();

    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

// Mobile-optimized cart and checkout
export class MobileCommerce {
  static enableOneClickOrdering() {
    // Add quick order buttons for repeat customers
    const orderButtons = document.querySelectorAll('.order-button');
    orderButtons.forEach(button => {
      button.addEventListener('touchstart', () => {
        button.classList.add('touch-active');
      });

      button.addEventListener('touchend', () => {
        button.classList.remove('touch-active');
        MobileGestures.addHapticFeedback();
      });
    });
  }

  static optimizeCheckoutFlow() {
    // Progressive form enhancement
    const checkoutForm = document.querySelector('#checkout-form');
    if (checkoutForm && isMobile()) {
      // Auto-save form data
      checkoutForm.addEventListener('input', (e) => {
        const formData = new FormData(checkoutForm as HTMLFormElement);
        const data = Object.fromEntries(formData);
        localStorage.setItem('checkout-draft', JSON.stringify(data));
      });

      // Restore draft data
      const draft = localStorage.getItem('checkout-draft');
      if (draft) {
        const data = JSON.parse(draft);
        Object.entries(data).forEach(([key, value]) => {
          const input = checkoutForm.querySelector(`[name="${key}"]`) as HTMLInputElement;
          if (input) {
            input.value = value as string;
          }
        });
      }
    }
  }

  static addPaymentOptimizations() {
    // Mobile-optimized payment UI
    if (isMobile()) {
      // Larger touch targets for payment buttons
      document.querySelectorAll('.payment-button').forEach(button => {
        (button as HTMLElement).style.minHeight = '48px';
      });

      // Auto-fill payment forms where possible
      this.enableAutoFill();
    }
  }

  static enableAutoFill() {
    // Enable browser autofill for payment forms
    const paymentForm = document.querySelector('#payment-form');
    if (paymentForm) {
      paymentForm.setAttribute('autocomplete', 'on');

      // Add autocomplete attributes
      const inputs = paymentForm.querySelectorAll('input');
      inputs.forEach(input => {
        const name = input.getAttribute('name');
        if (name?.includes('phone')) {
          input.setAttribute('autocomplete', 'tel');
        } else if (name?.includes('email')) {
          input.setAttribute('autocomplete', 'email');
        } else if (name?.includes('address')) {
          input.setAttribute('autocomplete', 'address-line1');
        }
      });
    }
  }
}

// Offline support enhancements
export class MobileOffline {
  static enhanceOfflineExperience() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);

          // Listen for offline/online events
          window.addEventListener('offline', () => {
            this.showOfflineNotification();
          });

          window.addEventListener('online', () => {
            this.showOnlineNotification();
            this.syncPendingOrders();
          });
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  static showOfflineNotification() {
    const notification = document.createElement('div');
    notification.id = 'offline-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f59e0b;
        color: white;
        padding: 12px;
        text-align: center;
        z-index: 1000;
        font-size: 14px;
      ">
        📱 You're offline. Orders will be saved and sent when connection returns.
      </div>
    `;
    document.body.appendChild(notification);
  }

  static showOnlineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #10b981;
          color: white;
          padding: 12px;
          text-align: center;
          z-index: 1000;
          font-size: 14px;
        ">
          🌐 Back online! Syncing your data...
        </div>
      `;

      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  }

  static async syncPendingOrders() {
    // Sync any pending orders from IndexedDB
    try {
      const pendingOrders = await this.getPendingOrders();
      for (const order of pendingOrders) {
        await this.submitOrder(order);
      }
      await this.clearPendingOrders();
    } catch (error) {
      console.error('Failed to sync pending orders:', error);
    }
  }

  static async getPendingOrders() {
    // Implementation for getting pending orders from IndexedDB
    return [];
  }

  static async submitOrder(order: any) {
    // Implementation for submitting order to server
    console.log('Submitting pending order:', order);
  }

  static async clearPendingOrders() {
    // Implementation for clearing pending orders
    console.log('Cleared pending orders');
  }
}

// Initialize mobile enhancements
export const initializeMobileEnhancements = () => {
  if (typeof window !== 'undefined') {
    // Initialize all mobile enhancements
    MobileForms.enhanceInputs();
    MobileForms.addInputValidation();
    MobileCommerce.enableOneClickOrdering();
    MobileCommerce.optimizeCheckoutFlow();
    MobileCommerce.addPaymentOptimizations();
    MobileOffline.enhanceOfflineExperience();

    // Add mobile-specific CSS
    if (isMobile()) {
      const style = document.createElement('style');
      style.textContent = `
        /* Mobile-specific styles */
        .touch-active {
          transform: scale(0.98);
          transition: transform 0.1s ease;
        }

        .mobile-optimized {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .mobile-input {
          font-size: 16px; /* Prevents zoom on iOS */
        }

        .validation-error {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    console.log('📱 Mobile enhancements initialized');
  }
};

// Export everything
export {
  MobileGestures,
  MobileNotifications,
  MobileForms,
  MobileCommerce,
  MobileOffline,
  initializeMobileEnhancements
};