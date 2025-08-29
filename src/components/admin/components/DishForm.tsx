// Dish Form Component
// Form for creating and editing dishes with restaurant management

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Save, Trash2 } from 'lucide-react';
import { DishFormData, RestaurantMenuItem, Restaurant, Dish, DISH_CATEGORIES } from '../types';

interface DishFormProps {
  dish?: Dish;
  menuItems: RestaurantMenuItem[];
  restaurants: Restaurant[];
  loadingMenuData?: boolean;
  onSubmit: (data: DishFormData, menuItems: RestaurantMenuItem[]) => Promise<boolean>;
  onCancel: () => void;
  onAddRestaurant: (restaurantId: string) => void;
  onRemoveRestaurant: (restaurantId: string) => void;
  onUpdatePrice: (restaurantId: string, price: number) => void;
  onUpdateAvailability: (restaurantId: string, availability: boolean) => void;
  isEditing?: boolean;
}

const DishForm: React.FC<DishFormProps> = ({
  dish,
  menuItems,
  restaurants,
  loadingMenuData,
  onSubmit,
  onCancel,
  onAddRestaurant,
  onRemoveRestaurant,
  onUpdatePrice,
  onUpdateAvailability,
  isEditing = false
}) => {
  const [formData, setFormData] = React.useState<DishFormData>({
    name: dish?.name || '',
    description: dish?.description || '',
    category: dish?.category || 'Traditional',
    image_url: dish?.image_url || '',
    active: dish?.active ?? true,
    admin_created: dish?.admin_created ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData, menuItems);
    if (success) {
      onCancel();
    }
  };

  const handleInputChange = (field: keyof DishFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get available restaurants (not already added)
  const availableRestaurants = restaurants.filter(restaurant =>
    !menuItems.some(item => item.restaurant_id === restaurant.id)
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Dish' : 'Add New Dish'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loadingMenuData && isEditing && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700 flex items-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></span>
              Loading restaurant and pricing information...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dish Name *
                </label>
                <Input
                  placeholder="Enter dish name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  required
                >
                  {DISH_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <Input
                placeholder="Describe the dish"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (Optional)
              </label>
              <Input
                placeholder="https://example.com/dish-image.jpg"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dish-active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="dish-active" className="text-sm font-medium text-gray-700">
                Dish is active
              </label>
            </div>
          </div>

          {/* Restaurant & Pricing Management */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700">Restaurant & Pricing</h4>
              <div className="text-sm text-gray-600">
                {menuItems.length} restaurant{menuItems.length !== 1 ? 's' : ''} serve{isEditing ? 's' : ''} this dish
              </div>
            </div>

            {/* Add Restaurant Dropdown */}
            <div className="flex gap-2">
              <select
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                onChange={(e) => {
                  if (e.target.value) {
                    onAddRestaurant(e.target.value);
                    e.target.value = ''; // Reset selection
                  }
                }}
                value=""
              >
                <option value="">➕ Add Restaurant</option>
                {availableRestaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name} - {restaurant.town}
                  </option>
                ))}
              </select>
            </div>

            {/* Restaurant Menu Items */}
            <div className="space-y-3">
              {menuItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>🏪 No restaurants selected</p>
                  <p className="text-sm">Use the dropdown above to add restaurants that serve this dish</p>
                </div>
              ) : (
                menuItems.map((menuItem, index) => (
                  <Card key={menuItem.restaurant_id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">
                              {menuItem.restaurant?.name || 'Unknown Restaurant'}
                            </h5>
                            <p className="text-sm text-gray-500">
                              📍 {menuItem.restaurant?.town || 'Unknown Location'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24">
                              <label className="block text-xs text-gray-600 mb-1">
                                Price (¢)
                              </label>
                              <Input
                                type="number"
                                placeholder="500"
                                value={menuItem.price || ''}
                                onChange={(e) => onUpdatePrice(
                                  menuItem.restaurant_id,
                                  e.target.value ? parseInt(e.target.value) : 0
                                )}
                                className="h-8 text-sm"
                                min="0"
                              />
                            </div>
                            <div className="w-20">
                              <label className="block text-xs text-gray-600 mb-1">
                                Available
                              </label>
                              <input
                                type="checkbox"
                                checked={menuItem.availability}
                                onChange={(e) => onUpdateAvailability(
                                  menuItem.restaurant_id,
                                  e.target.checked
                                )}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                            </div>
                          </div>
                        </div>
                        {menuItem.price > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            💰 Display price: ${(menuItem.price / 100).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveRestaurant(menuItem.restaurant_id)}
                        className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {isEditing && menuItems.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-700">
                  💡 <strong>Multi-Restaurant Management:</strong> This dish is served by {menuItems.length} restaurant{menuItems.length !== 1 ? 's' : ''}.
                  You can set different prices and availability for each restaurant.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DishForm;