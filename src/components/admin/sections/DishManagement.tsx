// Dish Management Section
// Handles dish CRUD operations with restaurant menu management

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Dish, DishFormData, RestaurantMenuItem } from '../types';
import { useAdminData } from '../hooks/useAdminData';
import { useDishManagement } from '../hooks/useDishManagement';
import DishForm from '../components/DishForm';
import DishCard from '../components/DishCard';

interface DishManagementProps {
  onDataChange?: () => void;
}

const DishManagement: React.FC<DishManagementProps> = ({ onDataChange }) => {
  const { restaurants, dishes, loading, createDish, updateDish, deleteDish } = useAdminData({ onDataChange });
  const {
    menuItems,
    loadingMenuData,
    addRestaurantToDish,
    removeRestaurantFromDish,
    updateMenuItemPrice,
    updateMenuItemAvailability,
    loadMenuItemsForDish,
    resetMenuItems,
    validateMenuItems
  } = useDishManagement(restaurants);

  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  const handleCreate = async (data: DishFormData, menuItems: RestaurantMenuItem[]) => {
    const validation = validateMenuItems();
    if (!validation.valid) {
      // Toast will be shown by the validation function
      return false;
    }
    return await createDish(data, menuItems);
  };

  const handleUpdate = async (data: DishFormData, menuItems: RestaurantMenuItem[]) => {
    if (!editingDish) return false;

    const validation = validateMenuItems();
    if (!validation.valid) {
      // Toast will be shown by the validation function
      return false;
    }

    return await updateDish(editingDish.id, data, menuItems);
  };

  const handleSubmit = async (data: DishFormData, menuItems: RestaurantMenuItem[]) => {
    const success = editingDish ? await handleUpdate(data, menuItems) : await handleCreate(data, menuItems);
    if (success) {
      handleCancel();
    }
    return success;
  };

  const handleEdit = async (dish: Dish) => {
    setEditingDish(dish);
    await loadMenuItemsForDish(dish.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteDish(id);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDish(null);
    resetMenuItems();
  };

  const handleAddRestaurant = (restaurantId: string) => {
    addRestaurantToDish(restaurantId);
  };

  const handleRemoveRestaurant = (restaurantId: string) => {
    removeRestaurantFromDish(restaurantId);
  };

  const handleUpdatePrice = (restaurantId: string, price: number) => {
    updateMenuItemPrice(restaurantId, price);
  };

  const handleUpdateAvailability = (restaurantId: string, availability: boolean) => {
    updateMenuItemAvailability(restaurantId, availability);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2">Loading dishes...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Dishes ({dishes.length})</CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Dish
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <DishForm
            dish={editingDish || undefined}
            menuItems={menuItems}
            restaurants={restaurants}
            loadingMenuData={loadingMenuData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onAddRestaurant={handleAddRestaurant}
            onRemoveRestaurant={handleRemoveRestaurant}
            onUpdatePrice={handleUpdatePrice}
            onUpdateAvailability={handleUpdateAvailability}
            isEditing={!!editingDish}
          />
        )}

        <div className="space-y-4">
          {dishes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No dishes found</p>
              <p className="text-sm">Create your first dish to get started</p>
            </div>
          ) : (
            dishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                restaurants={restaurants}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DishManagement;