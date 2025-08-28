import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Download, RefreshCw } from 'lucide-react';
import { DataFilters } from '@/hooks/useAdminData';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface DataSearchFiltersProps {
  filters: DataFilters;
  onFiltersChange: (filters: Partial<DataFilters>) => void;
  onClearFilters: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  searchPlaceholder?: string;
  showStatusFilter?: boolean;
  showCategoryFilter?: boolean;
  showTownFilter?: boolean;
  showSorting?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  categories?: string[];
  towns?: string[];
  sortOptions?: { value: string; label: string }[];
  totalItems?: number;
  filteredItems?: number;
}

// =============================================================================
// DATA SEARCH FILTERS COMPONENT
// =============================================================================

const DataSearchFilters: React.FC<DataSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  onExport,
  onRefresh,
  searchPlaceholder = "Search...",
  showStatusFilter = true,
  showCategoryFilter = false,
  showTownFilter = false,
  showSorting = true,
  showExport = false,
  showRefresh = false,
  categories = [],
  towns = [],
  sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' }
  ],
  totalItems = 0,
  filteredItems = 0
}) => {
  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  /**
   * Handle search input change
   */
  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value });
  };

  /**
   * Handle status filter change
   */
  const handleStatusChange = (value: string) => {
    onFiltersChange({ status: value as 'active' | 'inactive' | 'all' });
  };

  /**
   * Handle category filter change
   */
  const handleCategoryChange = (value: string) => {
    onFiltersChange({ category: value === 'all' ? undefined : value });
  };

  /**
   * Handle town filter change
   */
  const handleTownChange = (value: string) => {
    onFiltersChange({ town: value === 'all' ? undefined : value });
  };

  /**
   * Handle sort field change
   */
  const handleSortByChange = (value: string) => {
    onFiltersChange({ sortBy: value });
  };

  /**
   * Handle sort order change
   */
  const handleSortOrderChange = (value: string) => {
    onFiltersChange({ sortOrder: value as 'asc' | 'desc' });
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = () => {
    return filters.search || 
           filters.status !== 'all' || 
           filters.category || 
           filters.town ||
           filters.sortBy !== 'name' ||
           filters.sortOrder !== 'asc';
  };

  /**
   * Get active filters count
   */
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.category) count++;
    if (filters.town) count++;
    if (filters.sortBy !== 'name') count++;
    if (filters.sortOrder !== 'asc') count++;
    return count;
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 border-gray-200 focus:border-choptym-orange focus:ring-choptym-orange"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {/* Clear Filters Button */}
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}

          {/* Refresh Button */}
          {showRefresh && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}

          {/* Export Button */}
          {showExport && onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status Filter */}
        {showStatusFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Category Filter */}
        {showCategoryFilter && categories.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Town Filter */}
        {showTownFilter && towns.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Town:</span>
            <Select value={filters.town || 'all'} onValueChange={handleTownChange}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Towns</SelectItem>
                {towns.map(town => (
                  <SelectItem key={town} value={town}>
                    {town}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sorting Options */}
        {showSorting && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <Select value={filters.sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Order:</span>
              <Select value={filters.sortOrder} onValueChange={handleSortOrderChange}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">A-Z</SelectItem>
                  <SelectItem value="desc">Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Filter className="h-3 w-3" />
            {getActiveFiltersCount()}
          </Badge>
          
          {filters.search && (
            <Badge variant="outline" className="flex items-center gap-1">
              Search: "{filters.search}"
            </Badge>
          )}
          
          {filters.status !== 'all' && (
            <Badge variant="outline">
              Status: {filters.status}
            </Badge>
          )}
          
          {filters.category && (
            <Badge variant="outline">
              Category: {filters.category}
            </Badge>
          )}
          
          {filters.town && (
            <Badge variant="outline">
              Town: {filters.town}
            </Badge>
          )}
        </div>
      )}

      {/* Results Summary */}
      {(totalItems > 0 || filteredItems > 0) && (
        <div className="text-sm text-gray-600">
          Showing {filteredItems} of {totalItems} items
          {filteredItems !== totalItems && (
            <span className="text-choptym-orange font-medium">
              {' '}(filtered)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DataSearchFilters; 