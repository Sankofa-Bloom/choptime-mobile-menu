import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Clock, 
  Star, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Navigation,
  Calendar,
  ChefHat,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Restaurant } from '@/types/restaurant';
import { RestaurantFormData } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from './NotificationSystem';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface OperatingHours {
  monday_open?: string;
  monday_close?: string;
  tuesday_open?: string;
  tuesday_close?: string;
  wednesday_open?: string;
  wednesday_close?: string;
  thursday_open?: string;
  thursday_close?: string;
  friday_open?: string;
  friday_close?: string;
  saturday_open?: string;
  saturday_close?: string;
  sunday_open?: string;
  sunday_close?: string;
  is_open_24_7?: boolean;
}

// =============================================================================
// COMPREHENSIVE RESTAURANT MANAGEMENT COMPONENT
// =============================================================================

const ComprehensiveRestaurantManagement: React.FC = () => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    town: '',
    contact_number: '',
    active: true,
    delivery_time_min: 30,
    delivery_time_max: 60,
    has_dynamic_menu: false,
    is_open_24_7: false
  });

  const { addNotification } = useNotifications();

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchRestaurants = useCallback(async () => {
    try {
      console.log('🔄 Fetching restaurants from database...');
      setLoading(true);

      const { data, error, count } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact' })
        .order('name');

      console.log('📊 Fetch restaurants result:', {
        count: data?.length || 0,
        totalCount: count,
        error: error?.message || null
      });

      if (error) throw error;

      setRestaurants(data || []);
      console.log('✅ Restaurants loaded successfully:', data?.length || 0, 'restaurants');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch restaurants';
      console.error('❌ Fetch restaurants failed:', errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // =============================================================================
  // CRUD OPERATIONS
  // =============================================================================

  const createRestaurant = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Restaurant created successfully',
        duration: 4000
      });

      setShowAddModal(false);
      resetForm();
      await fetchRestaurants();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create restaurant';
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRestaurant = async () => {
    if (!editingRestaurant) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('restaurants')
        .update(formData)
        .eq('id', editingRestaurant.id);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Restaurant updated successfully',
        duration: 4000
      });

      setShowEditModal(false);
      setEditingRestaurant(null);
      resetForm();
      await fetchRestaurants();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update restaurant';
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRestaurant = async (id: string) => {
    try {
      console.log('🗑️ Starting restaurant deletion process for ID:', id);
      setLoading(true);

      // First, let's verify the restaurant exists before deletion
      const { data: restaurantBefore, error: fetchError } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching restaurant before deletion:', fetchError);
      } else {
        console.log('📋 Restaurant found before deletion:', restaurantBefore);
      }

      // Check for related orders that might prevent deletion
      const { data: relatedOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, created_at')
        .eq('restaurant_id', id);

      if (ordersError) {
        console.error('❌ Error checking related orders:', ordersError);
      } else {
        console.log('📋 Found related orders:', relatedOrders?.length || 0);
        if (relatedOrders && relatedOrders.length > 0) {
          console.log('⚠️ Related orders found - will be deleted:', relatedOrders);

          // Delete related orders first to avoid foreign key constraint errors
          console.log('🗑️ Deleting related orders...');
          const { error: deleteOrdersError } = await supabase
            .from('orders')
            .delete()
            .eq('restaurant_id', id);

          if (deleteOrdersError) {
            console.error('❌ Error deleting related orders:', deleteOrdersError);
          } else {
            console.log('✅ Related orders deleted successfully');
          }
        }
      }

      // Perform the restaurant deletion
      console.log('🔄 Executing restaurant delete query...');

      // First, check if we're authenticated
      const { data: authData } = await supabase.auth.getSession();
      console.log('🔐 Authentication status:', authData.session ? 'Authenticated' : 'Not authenticated');

      if (authData.session?.user) {
        console.log('👤 Authenticated as:', authData.session.user.email);
      } else {
        console.log('⚠️ CRITICAL: Not authenticated - RLS policy will block deletion!');
        console.log('🔄 Attempting to refresh authentication...');

        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('❌ Failed to refresh session:', refreshError);
          throw new Error('Authentication required for restaurant deletion. Please refresh the page and try again.');
        }

        if (refreshData.session?.user) {
          console.log('✅ Session refreshed successfully');
        } else {
          throw new Error('Unable to authenticate. Please log in again.');
        }
      }

      const deleteResult = await supabase
        .from('restaurants')
        .delete({ count: 'exact' })
        .eq('id', id);

      console.log('📊 Restaurant delete operation result:', JSON.stringify(deleteResult, null, 2));
      console.log('📊 Delete result details:', {
        error: deleteResult.error,
        count: deleteResult.count,
        data: deleteResult.data,
        status: deleteResult.status,
        statusText: deleteResult.statusText
      });

      const { error, count } = deleteResult;

      if (error) {
        console.error('❌ Delete restaurant error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      // Check if deletion actually worked (count should be 1)
      if (count === 0) {
        console.error('❌ CRITICAL: Delete returned count=0 - likely an RLS policy issue!');
        console.error('🔍 Possible causes:');
        console.error('   - User not authenticated');
        console.error('   - User not in admin_users table');
        console.error('   - RLS policy blocking the operation');
        throw new Error('Restaurant deletion blocked by security policy (RLS). Check authentication and admin permissions.');
      }

      // Verify the deletion was successful
      const { data: restaurantAfter, error: verifyError } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', id)
        .single();

      if (restaurantAfter) {
        console.error('⚠️ WARNING: Restaurant still exists after deletion!', restaurantAfter);
        throw new Error('Restaurant was not actually deleted from database');
      } else {
        console.log('✅ Restaurant successfully deleted from database');
      }

      console.log('🔄 Refreshing restaurant list...');
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Restaurant deleted successfully',
        duration: 4000
      });

      await fetchRestaurants();

      // Final verification - check if restaurant is gone from local state
      const stillExists = restaurants.some(r => r.id === id);
      if (stillExists) {
        console.error('⚠️ WARNING: Restaurant still exists in local state after refresh!');
      } else {
        console.log('✅ Restaurant successfully removed from UI');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete restaurant';
      console.error('💥 Delete restaurant failed:', errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const resetForm = () => {
    setFormData({
      name: '',
      town: '',
      contact_number: '',
      active: true,
      delivery_time_min: 30,
      delivery_time_max: 60,
      has_dynamic_menu: false,
      is_open_24_7: false
    });
  };

  const openEditModal = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      town: restaurant.town,
      contact_number: restaurant.contact_number,
      image_url: restaurant.image_url,
      logo_url: restaurant.logo_url,
      active: restaurant.active ?? true,
      delivery_time_min: restaurant.delivery_time_min ?? 30,
      delivery_time_max: restaurant.delivery_time_max ?? 60,
      gps_latitude: restaurant.gps_latitude,
      gps_longitude: restaurant.gps_longitude,
      address: restaurant.address,
      description: restaurant.description,
      cuisine_type: restaurant.cuisine_type,
      has_dynamic_menu: restaurant.has_dynamic_menu ?? false,
      mtn_number: restaurant.mtn_number,
      orange_number: restaurant.orange_number,
      rating: restaurant.rating,
      total_reviews: restaurant.total_reviews,
      monday_open: restaurant.monday_open,
      monday_close: restaurant.monday_close,
      tuesday_open: restaurant.tuesday_open,
      tuesday_close: restaurant.tuesday_close,
      wednesday_open: restaurant.wednesday_open,
      wednesday_close: restaurant.wednesday_close,
      thursday_open: restaurant.thursday_open,
      thursday_close: restaurant.thursday_close,
      friday_open: restaurant.friday_open,
      friday_close: restaurant.friday_close,
      saturday_open: restaurant.saturday_open,
      saturday_close: restaurant.saturday_close,
      sunday_open: restaurant.sunday_open,
      sunday_close: restaurant.sunday_close,
      is_open_24_7: restaurant.is_open_24_7 ?? false
    });
    setShowEditModal(true);
  };

  const getCurrentLocationGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gps_latitude: position.coords.latitude,
            gps_longitude: position.coords.longitude
          }));
          addNotification({
            type: 'success',
            title: 'Location Captured',
            message: 'GPS coordinates have been added',
            duration: 3000
          });
        },
        (error) => {
          addNotification({
            type: 'error',
            title: 'Location Error',
            message: 'Failed to get current location',
            duration: 4000
          });
        }
      );
    } else {
      addNotification({
        type: 'error',
        title: 'Not Supported',
        message: 'Geolocation is not supported by this browser',
        duration: 4000
      });
    }
  };

  const formatOperatingHours = (restaurant: Restaurant) => {
    if (restaurant.is_open_24_7) return '24/7';
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const openDays = days.filter(day => {
      const openKey = `${day}_open` as keyof Restaurant;
      const closeKey = `${day}_close` as keyof Restaurant;
      return restaurant[openKey] && restaurant[closeKey];
    });

    if (openDays.length === 0) return 'Hours not set';
    if (openDays.length === 7) {
      const firstDay = openDays[0];
      const openTime = restaurant[`${firstDay}_open` as keyof Restaurant] as string;
      const closeTime = restaurant[`${firstDay}_close` as keyof Restaurant] as string;
      return `Daily: ${openTime} - ${closeTime}`;
    }

    return `${openDays.length} days/week`;
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  const renderRestaurantForm = (isEdit = false) => (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="location">Location</TabsTrigger>
        <TabsTrigger value="hours">Operating Hours</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Restaurant Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter restaurant name"
              required
            />
          </div>
          <div>
            <Label htmlFor="town">Town *</Label>
            <Input
              id="town"
              value={formData.town}
              onChange={(e) => setFormData(prev => ({ ...prev, town: e.target.value }))}
              placeholder="Enter town"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact_number">Contact Number *</Label>
            <Input
              id="contact_number"
              value={formData.contact_number}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
              placeholder="e.g., +233123456789"
              required
            />
          </div>
          <div>
            <Label htmlFor="cuisine_type">Cuisine Type</Label>
            <Select
              value={formData.cuisine_type || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, cuisine_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cuisine type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ghanaian">Ghanaian</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
                <SelectItem value="italian">Italian</SelectItem>
                <SelectItem value="indian">Indian</SelectItem>
                <SelectItem value="mexican">Mexican</SelectItem>
                <SelectItem value="continental">Continental</SelectItem>
                <SelectItem value="fast_food">Fast Food</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the restaurant..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="image_url">Restaurant Image URL</Label>
            <Input
              id="image_url"
              value={formData.image_url || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={formData.logo_url || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder="https://example.com/logo.jpg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="delivery_time_min">Min Delivery Time (minutes)</Label>
            <Input
              id="delivery_time_min"
              type="number"
              value={formData.delivery_time_min}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_time_min: parseInt(e.target.value) }))}
              min="5"
              max="120"
            />
          </div>
          <div>
            <Label htmlFor="delivery_time_max">Max Delivery Time (minutes)</Label>
            <Input
              id="delivery_time_max"
              type="number"
              value={formData.delivery_time_max}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_time_max: parseInt(e.target.value) }))}
              min="10"
              max="180"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="location" className="space-y-4">
        <div>
          <Label htmlFor="address">Full Address</Label>
          <Textarea
            id="address"
            value={formData.address || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Enter full address..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gps_latitude">GPS Latitude</Label>
            <Input
              id="gps_latitude"
              type="number"
              step="any"
              value={formData.gps_latitude || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, gps_latitude: parseFloat(e.target.value) }))}
              placeholder="e.g., 5.6037"
            />
          </div>
          <div>
            <Label htmlFor="gps_longitude">GPS Longitude</Label>
            <Input
              id="gps_longitude"
              type="number"
              step="any"
              value={formData.gps_longitude || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, gps_longitude: parseFloat(e.target.value) }))}
              placeholder="e.g., -0.1870"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocationGPS}
          className="flex items-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          Get Current Location
        </Button>

        {formData.gps_latitude && formData.gps_longitude && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Location:</strong> {formData.gps_latitude.toFixed(6)}, {formData.gps_longitude.toFixed(6)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              This will be used for accurate delivery fee calculation and map integration.
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="hours" className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="is_open_24_7"
            checked={formData.is_open_24_7}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_open_24_7: checked }))}
          />
          <Label htmlFor="is_open_24_7">Open 24/7</Label>
        </div>

        {!formData.is_open_24_7 && (
          <div className="space-y-4">
            {[
              'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
              'Friday', 'Saturday', 'Sunday'
            ].map((day) => {
              const dayKey = day.toLowerCase();
              const openKey = `${dayKey}_open` as keyof RestaurantFormData;
              const closeKey = `${dayKey}_close` as keyof RestaurantFormData;
              
              return (
                <div key={day} className="grid grid-cols-3 gap-4 items-center">
                  <Label className="font-medium">{day}</Label>
                  <div>
                    <Label htmlFor={`${dayKey}_open`} className="text-sm">Open</Label>
                    <Input
                      id={`${dayKey}_open`}
                      type="time"
                      value={formData[openKey] as string || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [openKey]: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${dayKey}_close`} className="text-sm">Close</Label>
                    <Input
                      id={`${dayKey}_close`}
                      type="time"
                      value={formData[closeKey] as string || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [closeKey]: e.target.value }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="advanced" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mtn_number">MTN Mobile Money</Label>
            <Input
              id="mtn_number"
              value={formData.mtn_number || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, mtn_number: e.target.value }))}
              placeholder="e.g., 0241234567"
            />
          </div>
          <div>
            <Label htmlFor="orange_number">Orange Money</Label>
            <Input
              id="orange_number"
              value={formData.orange_number || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, orange_number: e.target.value }))}
              placeholder="e.g., 0541234567"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="total_reviews">Total Reviews</Label>
            <Input
              id="total_reviews"
              type="number"
              value={formData.total_reviews || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, total_reviews: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="rating">Rating</Label>
            <Input
              id="rating"
              type="number"
              step="0.1"
              value={formData.rating || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 4.5 }))}
              placeholder="4.5"
              min="0"
              max="5"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="has_dynamic_menu"
              checked={formData.has_dynamic_menu}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_dynamic_menu: checked }))}
            />
            <Label htmlFor="has_dynamic_menu">Has Dynamic Daily Menu</Label>
          </div>
          <p className="text-sm text-gray-600">
            Enable this if the restaurant changes their menu daily and needs to update dishes frequently.
          </p>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <Label htmlFor="active">Restaurant Active</Label>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  const renderRestaurantCard = (restaurant: Restaurant) => (
    <Card key={restaurant.id} className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{restaurant.name}</h3>
              <Badge variant={restaurant.active ? "default" : "secondary"}>
                {restaurant.active ? 'Active' : 'Inactive'}
              </Badge>
              {restaurant.has_dynamic_menu && (
                <Badge variant="outline">Dynamic Menu</Badge>
              )}
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>{restaurant.town}</span>
                {restaurant.address && <span>• {restaurant.address}</span>}
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>{restaurant.contact_number}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{formatOperatingHours(restaurant)}</span>
              </div>

              {restaurant.cuisine_type && (
                <div className="flex items-center gap-2">
                  <ChefHat className="h-3 w-3" />
                  <span className="capitalize">{restaurant.cuisine_type}</span>
                </div>
              )}

              {restaurant.gps_latitude && restaurant.gps_longitude && (
                <div className="flex items-center gap-2">
                  <Navigation className="h-3 w-3" />
                  <span>GPS: {restaurant.gps_latitude.toFixed(4)}, {restaurant.gps_longitude.toFixed(4)}</span>
                </div>
              )}
            </div>

            {restaurant.description && (
              <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                {restaurant.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Delivery: {restaurant.delivery_time_min}-{restaurant.delivery_time_max} min</span>
              {restaurant.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{restaurant.rating}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRestaurant(restaurant);
                setShowDetailsModal(true);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditModal(restaurant)}
              disabled={loading}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => deleteRestaurant(restaurant.id)}
              disabled={loading}
              className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Restaurant Management</h2>
          <p className="text-gray-600">Manage restaurant partners and their details</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Restaurant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {renderRestaurantForm()}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={createRestaurant} disabled={loading || !formData.name || !formData.town}>
                  {loading ? 'Creating...' : 'Create Restaurant'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Restaurant list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-choptym-orange mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading restaurants...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
              <p className="text-gray-600 mb-4">Start by adding your first restaurant partner.</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Restaurant
              </Button>
            </CardContent>
          </Card>
        ) : (
          restaurants.map(renderRestaurantCard)
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Restaurant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {renderRestaurantForm(true)}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={updateRestaurant} disabled={loading}>
                {loading ? 'Updating...' : 'Update Restaurant'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Restaurant Details</DialogTitle>
          </DialogHeader>
          
          {selectedRestaurant && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Basic Information</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Name:</strong> {selectedRestaurant.name}</div>
                    <div><strong>Town:</strong> {selectedRestaurant.town}</div>
                    <div><strong>Contact:</strong> {selectedRestaurant.contact_number}</div>
                    <div><strong>Status:</strong> 
                      <Badge variant={selectedRestaurant.active ? "default" : "secondary"} className="ml-2">
                        {selectedRestaurant.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Delivery Information</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Delivery Time:</strong> {selectedRestaurant.delivery_time_min}-{selectedRestaurant.delivery_time_max} min</div>
                    <div><strong>Cuisine:</strong> {selectedRestaurant.cuisine_type || 'Not specified'}</div>
                    <div><strong>Dynamic Menu:</strong> {selectedRestaurant.has_dynamic_menu ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>

              {selectedRestaurant.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-gray-700">{selectedRestaurant.description}</p>
                </div>
              )}

              {(selectedRestaurant.gps_latitude && selectedRestaurant.gps_longitude) || selectedRestaurant.address && (
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <div className="space-y-1 text-sm">
                    {selectedRestaurant.address && (
                      <div><strong>Address:</strong> {selectedRestaurant.address}</div>
                    )}
                    {selectedRestaurant.gps_latitude && selectedRestaurant.gps_longitude && (
                      <div><strong>GPS:</strong> {selectedRestaurant.gps_latitude}, {selectedRestaurant.gps_longitude}</div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Operating Hours</h3>
                <div className="text-sm">
                  {selectedRestaurant.is_open_24_7 ? (
                    <div className="text-green-600 font-medium">Open 24/7</div>
                  ) : (
                    <div className="space-y-1">
                      {[
                        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
                        'Friday', 'Saturday', 'Sunday'
                      ].map((day) => {
                        const dayKey = day.toLowerCase();
                        const openTime = selectedRestaurant[`${dayKey}_open` as keyof Restaurant] as string;
                        const closeTime = selectedRestaurant[`${dayKey}_close` as keyof Restaurant] as string;
                        
                        return (
                          <div key={day} className="flex justify-between">
                            <span>{day}:</span>
                            <span>{openTime && closeTime ? `${openTime} - ${closeTime}` : 'Closed'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {(selectedRestaurant.mtn_number || selectedRestaurant.orange_number) && (
                <div>
                  <h3 className="font-semibold mb-2">Payment Numbers</h3>
                  <div className="space-y-1 text-sm">
                    {selectedRestaurant.mtn_number && (
                      <div><strong>MTN MoMo:</strong> {selectedRestaurant.mtn_number}</div>
                    )}
                    {selectedRestaurant.orange_number && (
                      <div><strong>Orange Money:</strong> {selectedRestaurant.orange_number}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComprehensiveRestaurantManagement;