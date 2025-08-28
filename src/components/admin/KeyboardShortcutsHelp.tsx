import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Keyboard, Settings, X, Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  onShortcutsChange?: (shortcuts: KeyboardShortcut[]) => void;
  onShortcutsReset?: () => void;
  showCustomize?: boolean;
  trigger?: React.ReactNode;
}

interface ShortcutGroup {
  name: string;
  shortcuts: KeyboardShortcut[];
}

// =============================================================================
// KEYBOARD SHORTCUTS HELP COMPONENT
// =============================================================================

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  shortcuts,
  onShortcutsChange,
  onShortcutsReset,
  showCustomize = false,
  trigger
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customShortcuts, setCustomShortcuts] = useState<KeyboardShortcut[]>(shortcuts);
  const [editingShortcut, setEditingShortcut] = useState<KeyboardShortcut | null>(null);
  const [newShortcut, setNewShortcut] = useState<Partial<KeyboardShortcut>>({});

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  /**
   * Group shortcuts by category
   */
  const groupShortcuts = (shortcuts: KeyboardShortcut[]): ShortcutGroup[] => {
    const groups: { [key: string]: KeyboardShortcut[] } = {};
    
    shortcuts.forEach(shortcut => {
      let category = 'General';
      
      if (shortcut.key === 'f' && shortcut.ctrl) category = 'Navigation';
      else if (shortcut.key === 'n' && shortcut.ctrl) category = 'Actions';
      else if (shortcut.key === 's' && shortcut.ctrl) category = 'Actions';
      else if (shortcut.key === 'Delete') category = 'Actions';
      else if (shortcut.key === 'a' && shortcut.ctrl) category = 'Selection';
      else if (shortcut.key === 'r') category = 'Data';
      else if (shortcut.key === 'h') category = 'Navigation';
      else if (shortcut.key === 'Escape') category = 'Navigation';
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
    });
    
    return Object.entries(groups).map(([name, shortcuts]) => ({
      name,
      shortcuts
    }));
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

  /**
   * Handle shortcut edit
   */
  const handleShortcutEdit = (shortcut: KeyboardShortcut) => {
    setEditingShortcut(shortcut);
    setNewShortcut({
      key: shortcut.key,
      ctrl: shortcut.ctrl,
      shift: shortcut.shift,
      alt: shortcut.alt,
      meta: shortcut.meta,
      description: shortcut.description
    });
  };

  /**
   * Handle shortcut save
   */
  const handleShortcutSave = () => {
    if (!editingShortcut || !newShortcut.key || !newShortcut.description) return;
    
    const updatedShortcuts = customShortcuts.map(s => 
      s.id === editingShortcut.id 
        ? { ...s, ...newShortcut }
        : s
    );
    
    setCustomShortcuts(updatedShortcuts);
    setEditingShortcut(null);
    setNewShortcut({});
    
    onShortcutsChange?.(updatedShortcuts);
  };

  /**
   * Handle shortcut delete
   */
  const handleShortcutDelete = (shortcutId: string) => {
    const updatedShortcuts = customShortcuts.filter(s => s.id !== shortcutId);
    setCustomShortcuts(updatedShortcuts);
    onShortcutsChange?.(updatedShortcuts);
  };

  /**
   * Handle shortcuts reset
   */
  const handleShortcutsReset = () => {
    if (onShortcutsReset) {
      onShortcutsReset();
      setCustomShortcuts(shortcuts);
    }
  };

  /**
   * Handle save all changes
   */
  const handleSaveAll = () => {
    onShortcutsChange?.(customShortcuts);
    setIsCustomizing(false);
  };

  /**
   * Handle cancel customization
   */
  const handleCancelCustomization = () => {
    setCustomShortcuts(shortcuts);
    setEditingShortcut(null);
    setNewShortcut({});
    setIsCustomizing(false);
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render shortcut item
   */
  const renderShortcutItem = (shortcut: KeyboardShortcut, isCustomizing: boolean = false) => {
    const isEditing = editingShortcut?.id === shortcut.id;
    
    if (isEditing) {
      return (
        <div key={shortcut.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Key (e.g., n, f, Delete)"
              value={newShortcut.key || ''}
              onChange={(e) => setNewShortcut(prev => ({ ...prev, key: e.target.value }))}
              className="w-24"
            />
            <div className="flex items-center gap-2">
              <Label className="text-sm">Modifiers:</Label>
              <div className="flex items-center gap-2">
                <Label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={newShortcut.ctrl || false}
                    onChange={(e) => setNewShortcut(prev => ({ ...prev, ctrl: e.target.checked }))}
                    className="mr-1"
                  />
                  Ctrl
                </Label>
                <Label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={newShortcut.shift || false}
                    onChange={(e) => setNewShortcut(prev => ({ ...prev, shift: e.target.checked }))}
                    className="mr-1"
                  />
                  Shift
                </Label>
                <Label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={newShortcut.alt || false}
                    onChange={(e) => setNewShortcut(prev => ({ ...prev, alt: e.target.checked }))}
                    className="mr-1"
                  />
                  Alt
                </Label>
              </div>
            </div>
            <Input
              placeholder="Description"
              value={newShortcut.description || ''}
              onChange={(e) => setNewShortcut(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleShortcutSave}>
              <Save className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setEditingShortcut(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div key={shortcut.id} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="font-mono text-sm">
            {getShortcutDisplay(shortcut)}
          </Badge>
          <span className="text-sm text-gray-700">{shortcut.description}</span>
        </div>
        
        {isCustomizing && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleShortcutEdit(shortcut)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleShortcutDelete(shortcut.id!)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render shortcut group
   */
  const renderShortcutGroup = (group: ShortcutGroup) => (
    <div key={group.name} className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
        {group.name}
      </h3>
      <div className="space-y-2">
        {group.shortcuts.map(shortcut => renderShortcutItem(shortcut, isCustomizing))}
      </div>
    </div>
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  const groupedShortcuts = groupShortcuts(isCustomizing ? customShortcuts : shortcuts);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Keyboard Shortcuts
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Keyboard className="h-6 w-6 text-choptym-orange" />
            Keyboard Shortcuts
            <Badge variant="secondary" className="ml-2">
              {shortcuts.length} shortcuts
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customization Controls */}
          {showCustomize && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="customize-mode"
                    checked={isCustomizing}
                    onCheckedChange={setIsCustomizing}
                  />
                  <Label htmlFor="customize-mode">Customize Mode</Label>
                </div>
                
                {isCustomizing && (
                  <span className="text-sm text-gray-600">
                    Click shortcuts to edit them
                  </span>
                )}
              </div>
              
              {isCustomizing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShortcutsReset}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelCustomization}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Shortcuts List */}
          <div className="space-y-6">
            {groupedShortcuts.map(renderShortcutGroup)}
          </div>
          
          {/* Help Text */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use Ctrl+N to quickly create new items</li>
              <li>• Press Ctrl+F to focus the search bar</li>
              <li>• Use Escape to close modals or clear selections</li>
              <li>• Press Ctrl+A to select all items in lists</li>
              <li>• Use Delete key to remove selected items</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp; 