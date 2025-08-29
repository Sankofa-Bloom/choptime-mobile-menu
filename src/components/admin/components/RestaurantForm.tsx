// Restaurant Form Component
// Form for creating and editing restaurants

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save } from 'lucide-react';
import { RestaurantFormData, Restaurant } from '../types';

interface RestaurantFormProps {
  restaurant?: Restaurant;
  onSubmit: (data: RestaurantFormData) => Promise<boolean>;
  onCancel: () => void;
  isEditing?: boolean;
}

const RestaurantForm: React.FC<RestaurantFormProps> = ({
  restaurant,
  onSubmit,
  onCancel,
  isEditing = false
}) => {
  const [formData, setFormData] = React.useState<RestaurantFormData>({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    town: restaurant?.town || '',
    address: restaurant?.address || '',
    contact_number: restaurant?.contact_number || '',
    cuisine_type: restaurant?.cuisine_type || '',
    active: restaurant?.active ?? true,
    delivery_time_min: restaurant?.delivery_time_min || 15,
    delivery_time_max: restaurant?.delivery_time_max || 45,
    rating: restaurant?.rating || 4.5,
    gps_latitude: restaurant?.gps_latitude || 0.00000000,
    gps_longitude: restaurant?.gps_longitude || 0.00000000
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      onCancel();
    }
  };

  const handleInputChange = (field: keyof RestaurantFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Restaurant' : 'Add New Restaurant'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name *
              </label>
              <Input
                placeholder="Restaurant Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Town *
              </label>
              <Input
                placeholder="Town"
                value={formData.town}
                onChange={(e) => handleInputChange('town', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <Input
              placeholder="Restaurant description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <Input
              placeholder="Full address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <Input
                placeholder="Contact Number"
                value={formData.contact_number}
                onChange={(e) => handleInputChange('contact_number', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Type *
              </label>
              <Input
                placeholder="Cuisine Type"
                value={formData.cuisine_type}
                onChange={(e) => handleInputChange('cuisine_type', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Delivery Time (minutes) *
              </label>
              <Input
                type="number"
                placeholder="15"
                value={formData.delivery_time_min || ''}
                onChange={(e) => handleInputChange('delivery_time_min', parseInt(e.target.value) || 15)}
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Delivery Time (minutes) *
              </label>
              <Input
                type="number"
                placeholder="45"
                value={formData.delivery_time_max || ''}
                onChange={(e) => handleInputChange('delivery_time_max', parseInt(e.target.value) || 45)}
                required
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="4.5"
                value={formData.rating || ''}
                onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 4.5)}
                min="0"
                max="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <Input
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                value={formData.gps_latitude || ''}
                onChange={(e) => handleInputChange('gps_latitude', parseFloat(e.target.value) || 0.00000000)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <Input
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                value={formData.gps_longitude || ''}
                onChange={(e) => handleInputChange('gps_longitude', parseFloat(e.target.value) || 0.00000000)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleInputChange('active', e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Restaurant is active
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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

export default RestaurantForm;