// Restaurant Form Component
// Form for creating and editing restaurants

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, Save, Clock, MapPin, Phone, Image, Settings } from 'lucide-react';
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
    mtn_number: restaurant?.mtn_number || '',
    orange_number: restaurant?.orange_number || '',
    cuisine_type: restaurant?.cuisine_type || '',
    active: restaurant?.active ?? true,
    delivery_time_min: restaurant?.delivery_time_min || 15,
    delivery_time_max: restaurant?.delivery_time_max || 45,
    rating: restaurant?.rating || 4.5,
    gps_latitude: restaurant?.gps_latitude || 0.00000000,
    gps_longitude: restaurant?.gps_longitude || 0.00000000,
    image_url: restaurant?.image_url || '',
    logo_url: restaurant?.logo_url || '',
    total_reviews: restaurant?.total_reviews || 0,
    has_dynamic_menu: restaurant?.has_dynamic_menu || false,
    is_open_24_7: restaurant?.is_open_24_7 || false,
    // Operating hours
    monday_open: restaurant?.monday_open || '',
    monday_close: restaurant?.monday_close || '',
    tuesday_open: restaurant?.tuesday_open || '',
    tuesday_close: restaurant?.tuesday_close || '',
    wednesday_open: restaurant?.wednesday_open || '',
    wednesday_close: restaurant?.wednesday_close || '',
    thursday_open: restaurant?.thursday_open || '',
    thursday_close: restaurant?.thursday_close || '',
    friday_open: restaurant?.friday_open || '',
    friday_close: restaurant?.friday_close || '',
    saturday_open: restaurant?.saturday_open || '',
    saturday_close: restaurant?.saturday_close || '',
    sunday_open: restaurant?.sunday_open || '',
    sunday_close: restaurant?.sunday_close || ''
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

  const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => {
    const field = `${day}_${type}` as keyof RestaurantFormData;
    handleInputChange(field, value);
  };

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Restaurant' : 'Add New Restaurant'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="hours" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hours
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Media
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    placeholder="Restaurant Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="town">Town *</Label>
                  <Input
                    id="town"
                    placeholder="Town"
                    value={formData.town}
                    onChange={(e) => handleInputChange('town', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="Restaurant description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="Full address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cuisine_type">Cuisine Type *</Label>
                  <Input
                    id="cuisine_type"
                    placeholder="Cuisine Type"
                    value={formData.cuisine_type}
                    onChange={(e) => handleInputChange('cuisine_type', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    placeholder="4.5"
                    value={formData.rating || ''}
                    onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 4.5)}
                    min="0"
                    max="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_time_min">Min Delivery Time (minutes) *</Label>
                  <Input
                    id="delivery_time_min"
                    type="number"
                    placeholder="15"
                    value={formData.delivery_time_min || ''}
                    onChange={(e) => handleInputChange('delivery_time_min', parseInt(e.target.value) || 15)}
                    required
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_time_max">Max Delivery Time (minutes) *</Label>
                  <Input
                    id="delivery_time_max"
                    type="number"
                    placeholder="45"
                    value={formData.delivery_time_max || ''}
                    onChange={(e) => handleInputChange('delivery_time_max', parseInt(e.target.value) || 45)}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => handleInputChange('active', checked)}
                  />
                  <Label htmlFor="active">Restaurant is active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="has_dynamic_menu"
                    checked={formData.has_dynamic_menu}
                    onCheckedChange={(checked) => handleInputChange('has_dynamic_menu', checked)}
                  />
                  <Label htmlFor="has_dynamic_menu">Has dynamic menu</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_open_24_7"
                    checked={formData.is_open_24_7}
                    onCheckedChange={(checked) => handleInputChange('is_open_24_7', checked)}
                  />
                  <Label htmlFor="is_open_24_7">Open 24/7</Label>
                </div>
              </div>
            </TabsContent>

            {/* Contact Information Tab */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contact_number">Main Contact Number *</Label>
                  <Input
                    id="contact_number"
                    placeholder="+237 6XX XXX XXX"
                    value={formData.contact_number}
                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mtn_number">MTN Number</Label>
                  <Input
                    id="mtn_number"
                    placeholder="+237 6XX XXX XXX"
                    value={formData.mtn_number}
                    onChange={(e) => handleInputChange('mtn_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="orange_number">Orange Number</Label>
                  <Input
                    id="orange_number"
                    placeholder="+237 6XX XXX XXX"
                    value={formData.orange_number}
                    onChange={(e) => handleInputChange('orange_number', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="total_reviews">Total Reviews</Label>
                <Input
                  id="total_reviews"
                  type="number"
                  placeholder="0"
                  value={formData.total_reviews || ''}
                  onChange={(e) => handleInputChange('total_reviews', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </TabsContent>

            {/* Operating Hours Tab */}
            <TabsContent value="hours" className="space-y-4 mt-4">
              {!formData.is_open_24_7 && (
                <div className="space-y-4">
                  {days.map((day) => (
                    <div key={day.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <Label htmlFor={`${day.key}_day`}>{day.label}</Label>
                        <Input
                          id={`${day.key}_day`}
                          value={day.label}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${day.key}_open`}>Open Time</Label>
                        <Input
                          id={`${day.key}_open`}
                          type="time"
                          value={formData[`${day.key}_open` as keyof RestaurantFormData] as string || ''}
                          onChange={(e) => handleTimeChange(day.key, 'open', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${day.key}_close`}>Close Time</Label>
                        <Input
                          id={`${day.key}_close`}
                          type="time"
                          value={formData[`${day.key}_close` as keyof RestaurantFormData] as string || ''}
                          onChange={(e) => handleTimeChange(day.key, 'close', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {formData.is_open_24_7 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                  <p>Restaurant is open 24/7 - no specific hours needed</p>
                </div>
              )}
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gps_latitude">Latitude</Label>
                  <Input
                    id="gps_latitude"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00000000"
                    value={formData.gps_latitude || ''}
                    onChange={(e) => handleInputChange('gps_latitude', parseFloat(e.target.value) || 0.00000000)}
                  />
                </div>
                <div>
                  <Label htmlFor="gps_longitude">Longitude</Label>
                  <Input
                    id="gps_longitude"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00000000"
                    value={formData.gps_longitude || ''}
                    onChange={(e) => handleInputChange('gps_longitude', parseFloat(e.target.value) || 0.00000000)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="image_url">Restaurant Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  placeholder="https://example.com/restaurant-image.jpg"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-6">
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