// Restaurant Management Section
// Handles restaurant CRUD operations

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus } from 'lucide-react';
import { Restaurant, RestaurantFormData } from '../types';
import { useAdminData } from '../hooks/useAdminData';
import RestaurantForm from '../components/RestaurantForm';

interface RestaurantManagementProps {
  onDataChange?: () => void;
}

const RestaurantManagement: React.FC<RestaurantManagementProps> = ({ onDataChange }) => {
  const { restaurants, loading, createRestaurant, updateRestaurant, deleteRestaurant } = useAdminData({ onDataChange });
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  const handleCreate = async (data: RestaurantFormData) => {
    return await createRestaurant(data);
  };

  const handleUpdate = async (data: RestaurantFormData) => {
    if (!editingRestaurant) return false;
    return await updateRestaurant(editingRestaurant.id, data);
  };

  const handleSubmit = async (data: RestaurantFormData) => {
    const success = editingRestaurant ? await handleUpdate(data) : await handleCreate(data);
    return success;
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteRestaurant(id);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRestaurant(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2">Loading restaurants...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Restaurants ({restaurants.length})</CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Restaurant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <RestaurantForm
            restaurant={editingRestaurant || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={!!editingRestaurant}
          />
        )}

        <div className="space-y-4">
          {restaurants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No restaurants found</p>
              <p className="text-sm">Create your first restaurant to get started</p>
            </div>
          ) : (
            restaurants.map((restaurant) => (
              <Card key={restaurant.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                        <Badge variant={restaurant.active ? 'default' : 'secondary'}>
                          {restaurant.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{restaurant.description}</p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>🏙️ {restaurant.town}</p>
                        <p>📍 {restaurant.address}</p>
                        <p>📞 {restaurant.contact_number}</p>
                        <p>🍽️ {restaurant.cuisine_type}</p>
                        <p>⏱️ Delivery: {restaurant.delivery_time_min}-{restaurant.delivery_time_max} min</p>
                        <p>⭐ Rating: {restaurant.rating}/5</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(restaurant)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(restaurant.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RestaurantManagement;