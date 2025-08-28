import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Power, 
  PowerOff,
  Download,
  Copy,
  MoreHorizontal
} from 'lucide-react';
import { BulkOperationResult } from '@/hooks/useAdminData';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface BulkOperationsProps {
  selectedItems: string[];
  totalItems: number;
  onBulkActivate?: () => Promise<BulkOperationResult>;
  onBulkDeactivate?: () => Promise<BulkOperationResult>;
  onBulkDelete?: () => Promise<BulkOperationResult>;
  onBulkExport?: () => void;
  onBulkCopy?: () => void;
  onSelectAll?: (selected: boolean) => void;
  onClearSelection?: () => void;
  itemType?: string;
  showActivate?: boolean;
  showDeactivate?: boolean;
  showDelete?: boolean;
  showExport?: boolean;
  showCopy?: boolean;
  loading?: boolean;
}

// =============================================================================
// BULK OPERATIONS COMPONENT
// =============================================================================

const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedItems,
  totalItems,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  onBulkExport,
  onBulkCopy,
  onSelectAll,
  onClearSelection,
  itemType = 'items',
  showActivate = true,
  showDeactivate = true,
  showDelete = true,
  showExport = false,
  showCopy = false,
  loading = false
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [operationLoading, setOperationLoading] = useState(false);
  const [lastOperationResult, setLastOperationResult] = useState<BulkOperationResult | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  /**
   * Handle select all checkbox change
   */
  const handleSelectAllChange = (checked: boolean) => {
    onSelectAll?.(checked);
  };

  /**
   * Handle bulk activate operation
   */
  const handleBulkActivate = async () => {
    if (!onBulkActivate) return;
    
    try {
      setOperationLoading(true);
      setLastOperationResult(null);
      
      const result = await onBulkActivate();
      setLastOperationResult(result);
      
      if (result.success) {
        // Clear selection on success
        onClearSelection?.();
      }
    } catch (error) {
      console.error('Bulk activate error:', error);
      setLastOperationResult({
        success: false,
        message: 'Operation failed unexpectedly',
        affectedCount: 0
      });
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Handle bulk deactivate operation
   */
  const handleBulkDeactivate = async () => {
    if (!onBulkDeactivate) return;
    
    try {
      setOperationLoading(true);
      setLastOperationResult(null);
      
      const result = await onBulkDeactivate();
      setLastOperationResult(result);
      
      if (result.success) {
        // Clear selection on success
        onClearSelection?.();
      }
    } catch (error) {
      console.error('Bulk deactivate error:', error);
      setLastOperationResult({
        success: false,
        message: 'Operation failed unexpectedly',
        affectedCount: 0
      });
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Handle bulk delete operation
   */
  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    
    try {
      setOperationLoading(true);
      setLastOperationResult(null);
      setShowConfirmDelete(false);
      
      const result = await onBulkDelete();
      setLastOperationResult(result);
      
      if (result.success) {
        // Clear selection on success
        onClearSelection?.();
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      setLastOperationResult({
        success: false,
        message: 'Operation failed unexpectedly',
        affectedCount: 0
      });
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Handle bulk export operation
   */
  const handleBulkExport = () => {
    onBulkExport?.();
  };

  /**
   * Handle bulk copy operation
   */
  const handleBulkCopy = () => {
    onBulkCopy?.();
  };

  /**
   * Clear last operation result
   */
  const clearOperationResult = () => {
    setLastOperationResult(null);
  };

  // =============================================================================
  // RENDER CONDITIONS
  // =============================================================================

  const hasSelection = selectedItems.length > 0;
  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < totalItems;

  // =============================================================================
  // RENDER
  // =============================================================================

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg border">
        {/* Selection Info and Controls */}
        <div className="flex items-center gap-4">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              ref={(el) => {
                if (el) {
                  el.indeterminate = isIndeterminate;
                }
              }}
              onCheckedChange={handleSelectAllChange}
              disabled={loading}
            />
            <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
              Select All
            </label>
          </div>

          {/* Selection Count */}
          {hasSelection && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {selectedItems.length} of {totalItems} {itemType} selected
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        {hasSelection && (
          <div className="flex flex-wrap gap-2">
            {/* Bulk Activate */}
            {showActivate && onBulkActivate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkActivate}
                disabled={operationLoading || loading}
                className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
              >
                <Power className="h-4 w-4" />
                Activate
              </Button>
            )}

            {/* Bulk Deactivate */}
            {showDeactivate && onBulkDeactivate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDeactivate}
                disabled={operationLoading || loading}
                className="flex items-center gap-2 text-orange-700 border-orange-200 hover:bg-orange-50"
              >
                <PowerOff className="h-4 w-4" />
                Deactivate
              </Button>
            )}

            {/* Bulk Export */}
            {showExport && onBulkExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
                disabled={operationLoading || loading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}

            {/* Bulk Copy */}
            {showCopy && onBulkCopy && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkCopy}
                disabled={operationLoading || loading}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            )}

            {/* Bulk Delete */}
            {showDelete && onBulkDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDelete(true)}
                disabled={operationLoading || loading}
                className="flex items-center gap-2 text-red-700 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={operationLoading || loading}
              className="text-gray-600 hover:text-gray-800"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Operation Results */}
      {lastOperationResult && (
        <Alert 
          variant={lastOperationResult.success ? "default" : "destructive"}
          className="border-l-4 border-l-current"
        >
          {lastOperationResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription className="flex items-center justify-between">
            <span>{lastOperationResult.message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearOperationResult}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Bulk Delete</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedItems.length} selected {itemType}? 
              This action cannot be undone.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDelete(false)}
                disabled={operationLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={operationLoading}
                className="flex items-center gap-2"
              >
                {operationLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete {selectedItems.length} {itemType}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOperations; 