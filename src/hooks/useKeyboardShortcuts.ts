import { useEffect, useCallback } from 'react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
}

export interface KeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

// =============================================================================
// KEYBOARD SHORTCUTS HOOK
// =============================================================================

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: KeyboardShortcutsConfig) => {
  // =============================================================================
  // SHORTCUT HANDLER
  // =============================================================================

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts if disabled or if user is typing in an input
    if (!enabled || isTypingInInput(event)) {
      return;
    }

    // Check each shortcut
    for (const shortcut of shortcuts) {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled]);

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  /**
   * Check if user is typing in an input field
   */
  const isTypingInInput = (event: KeyboardEvent): boolean => {
    const target = event.target as HTMLElement;
    return target.tagName === 'INPUT' || 
           target.tagName === 'TEXTAREA' || 
           target.contentEditable === 'true';
  };

  /**
   * Check if keyboard event matches a shortcut
   */
  const matchesShortcut = (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
    // Check if the key matches
    if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
      return false;
    }

    // Check modifier keys
    if (shortcut.ctrl && !event.ctrlKey) return false;
    if (shortcut.shift && !event.shiftKey) return false;
    if (shortcut.alt && !event.altKey) return false;
    if (shortcut.meta && !event.metaKey) return false;

    // Check that no extra modifier keys are pressed
    if (shortcut.ctrl && !event.ctrlKey) return false;
    if (shortcut.shift && !event.shiftKey) return false;
    if (shortcut.alt && !event.altKey) return false;
    if (shortcut.meta && !event.metaKey) return false;

    // Check that no extra modifier keys are pressed when not required
    if (!shortcut.ctrl && event.ctrlKey) return false;
    if (!shortcut.shift && event.shiftKey) return false;
    if (!shortcut.alt && event.altKey) return false;
    if (!shortcut.meta && event.metaKey) return false;

    return true;
  };

  /**
   * Get display text for a shortcut
   */
  const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta) parts.push('⌘');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  };

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  // =============================================================================
  // RETURN VALUES
  // =============================================================================

  return {
    getShortcutDisplay,
    isEnabled: enabled
  };
};

// =============================================================================
// DEFAULT ADMIN SHORTCUTS
// =============================================================================

export const DEFAULT_ADMIN_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'n',
    ctrl: true,
    description: 'Create new item',
    action: () => {
      // This will be overridden by the component using the hook
      console.log('Ctrl+N: Create new item');
    }
  },
  {
    key: 's',
    ctrl: true,
    description: 'Save changes',
    action: () => {
      console.log('Ctrl+S: Save changes');
    }
  },
  {
    key: 'f',
    ctrl: true,
    description: 'Focus search',
    action: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"], input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  },
  {
    key: 'Escape',
    description: 'Close modal or clear selection',
    action: () => {
      // Close any open modals or clear selections
      const modals = document.querySelectorAll('[role="dialog"]');
      if (modals.length > 0) {
        // Find the topmost modal and close it
        const topModal = modals[modals.length - 1];
        const closeButton = topModal.querySelector('button[aria-label="Close"], button:contains("Close")');
        if (closeButton) {
          (closeButton as HTMLButtonElement).click();
        }
      }
    }
  },
  {
    key: 'Delete',
    description: 'Delete selected items',
    action: () => {
      console.log('Delete: Delete selected items');
    }
  },
  {
    key: 'a',
    ctrl: true,
    description: 'Select all items',
    action: () => {
      const selectAllCheckbox = document.querySelector('input[id="select-all"]') as HTMLInputElement;
      if (selectAllCheckbox) {
        selectAllCheckbox.click();
      }
    }
  },
  {
    key: 'r',
    description: 'Refresh data',
    action: () => {
      const refreshButton = document.querySelector('button:contains("Refresh"), button[aria-label*="refresh"]') as HTMLButtonElement;
      if (refreshButton) {
        refreshButton.click();
      }
    }
  },
  {
    key: 'h',
    description: 'Go to home/dashboard',
    action: () => {
      if (window.location.pathname !== '/dash/chp-ctrl') {
        window.location.href = '/dash/chp-ctrl';
      }
    }
  }
];

export default useKeyboardShortcuts; 