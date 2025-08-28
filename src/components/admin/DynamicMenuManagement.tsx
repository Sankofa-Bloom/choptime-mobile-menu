import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  ChefHat,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Copy
} from 'lucide-react';
import { DailyMenu, DailyMenuItem, Restaurant, Dish } from '@/types/restaurant';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from './NotificationSystem';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface MenuFormData {
  restaurant_id: string;
  date: string;
  is_active: boolean;
}

interface MenuItemFormData {
  dish_id: string;
  price: number;
  availability: boolean;
  available_quantity?: number;
  special_notes?: string;
}

// =============================================================================
// DYNAMIC MENU MANAGEMENT COMPONENT
// =============================================================================

const DynamicMenuManagement: React.FC = () => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<DailyMenu | null>(null);
  const [editingMenuItems, setEditingMenuItems] = useState<DailyMenuItem[]>([]);
  
  const [menuFormData, setMenuFormData] = useState<MenuFormData>({
    restaurant_id: '',
    date: new Date().toISOString().split('T')[0],
    is_active: true
  });

  const { addNotification } = useNotifications();

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch restaurants with dynamic menus
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('has_dynamic_menu', true)
        .order('name');

      if (restaurantsError) throw restaurantsError;
      setRestaurants(restaurantsData || []);

      // Fetch all dishes
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select('*')
        .order('name');

      if (dishesError) throw dishesError;
      setDishes(dishesData || []);

      // Fetch daily menus
      await fetchDailyMenus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification, fetchDailyMenus]);

  const fetchDailyMenus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('daily_menus')
        .select(`
          *,
          restaurants(name, town),
          daily_menu_items(
            *,
            dishes(name, category, description)
          )
        `)
        .gte('date', selectedDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setDailyMenus(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch daily menus';
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 5000
      });
    }
  }, [selectedDate, addNotification]);

  // =============================================================================
  // CRUD OPERATIONS
  // =============================================================================

  const createDailyMenu = async () => {
    try {
      setLoading(true);

      // Check if menu already exists for this restaurant and date
      const { data: existingMenu } = await supabase
        .from('daily_menus')
        .select('id')
        .eq('restaurant_id', menuFormData.restaurant_id)
        .eq('date', menuFormData.date)
        .single();

      if (existingMenu) {
        addNotification({
          type: 'error',
          title: 'Menu Exists',
          message: 'A menu already exists for this restaurant on this date',
          duration: 5000
        });
        return;
      }

      const { data, error } = await supabase
        .from('daily_menus')
        .insert([menuFormData])
        .select()
        .single();

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Daily menu created successfully',
        duration: 4000
      });

      setShowCreateModal(false);
      resetMenuForm();
      await fetchDailyMenus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create daily menu';
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

  const updateDailyMenu = async () => {
    if (!editingMenu) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('daily_menus')
        .update({
          is_active: menuFormData.is_active
        })
        .eq('id', editingMenu.id);

      if (error) throw error;

      // Update menu items
      for (const item of editingMenuItems) {
        if (item.id) {
          // Update existing item
          const { error: updateError } = await supabase
            .from('daily_menu_items')
            .update({
              price: item.price,
              availability: item.availability,
              available_quantity: item.available_quantity,
              special_notes: item.special_notes
            })
            .eq('id', item.id);

          if (updateError) throw updateError;
        } else {
          // Create new item
          const { error: createError } = await supabase
            .from('daily_menu_items')
            .insert([{
              daily_menu_id: editingMenu.id,
              dish_id: item.dish_id,
              price: item.price,
              availability: item.availability,
              available_quantity: item.available_quantity,
              special_notes: item.special_notes
            }]);

          if (createError) throw createError;
        }
      }

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Daily menu updated successfully',
        duration: 4000
      });

      setShowEditModal(false);
      setEditingMenu(null);
      setEditingMenuItems([]);
      await fetchDailyMenus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update daily menu';
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

  const deleteDailyMenu = async (menuId: string) => {
    try {
      setLoading(true);

      // Delete menu items first
      const { error: itemsError } = await supabase
        .from('daily_menu_items')
        .delete()
        .eq('daily_menu_id', menuId);

      if (itemsError) throw itemsError;

      // Delete menu
      const { error } = await supabase
        .from('daily_menus')
        .delete()
        .eq('id', menuId);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Daily menu deleted successfully',
        duration: 4000
      });

      await fetchDailyMenus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete daily menu';
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

  const copyMenuFromPreviousDay = async (restaurantId: string, date: string) => {
    try {
      setLoading(true);

      // Get previous day's menu
      const previousDate = new Date(date);
      previousDate.setDate(previousDate.getDate() - 1);
      const prevDateStr = previousDate.toISOString().split('T')[0];

      const { data: previousMenu, error: fetchError } = await supabase
        .from('daily_menus')
        .select(`
          *,
          daily_menu_items(*)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('date', prevDateStr)
        .single();

      if (fetchError || !previousMenu) {
        addNotification({
          type: 'error',
          title: 'No Previous Menu',
          message: 'No menu found for the previous day to copy from',
          duration: 5000
        });
        return;
      }

      // Create new menu
      const { data: newMenu, error: menuError } = await supabase
        .from('daily_menus')
        .insert([{
          restaurant_id: restaurantId,
          date: date,
          is_active: true
        }])
        .select()
        .single();

      if (menuError) throw menuError;

      // Copy menu items
      if (previousMenu.daily_menu_items && previousMenu.daily_menu_items.length > 0) {
        const itemsToInsert = previousMenu.daily_menu_items.map((item: { dish_id: string; price: number; availability: boolean; available_quantity?: number; special_notes?: string }) => ({
          daily_menu_id: newMenu.id,
          dish_id: item.dish_id,
          price: item.price,
          availability: item.availability,
          available_quantity: item.available_quantity,
          special_notes: item.special_notes
        }));

        const { error: itemsError } = await supabase
          .from('daily_menu_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      addNotification({
        type: 'success',
        title: 'Menu Copied',
        message: 'Previous day\'s menu has been copied successfully',
        duration: 4000
      });

      await fetchDailyMenus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to copy menu';
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

  const resetMenuForm = () => {
    setMenuFormData({
      restaurant_id: '',
      date: new Date().toISOString().split('T')[0],
      is_active: true
    });
  };

  const openEditModal = (menu: DailyMenu) => {
    setEditingMenu(menu);
    setMenuFormData({
      restaurant_id: menu.restaurant_id,
      date: menu.date,
      is_active: menu.is_active
    });
    setEditingMenuItems(menu.menu_items || []);
    setShowEditModal(true);
  };

  const addMenuItem = () => {
    setEditingMenuItems(prev => [...prev, {
      id: '',
      daily_menu_id: editingMenu?.id || '',
      dish_id: '',
      price: 0,
      availability: true,
      available_quantity: undefined,
      special_notes: ''
    }]);
  };

  const updateMenuItem = (index: number, field: keyof DailyMenuItem, value: string | number | boolean | undefined) => {
    setEditingMenuItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeMenuItem = (index: number) => {
    setEditingMenuItems(prev => prev.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number) => {
    return `₵${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // =============================================================================
  // FILTER FUNCTIONS
  // =============================================================================

  const filteredMenus = dailyMenus.filter(menu => {
    if (selectedRestaurant && menu.restaurant_id !== selectedRestaurant) {
      return false;
    }
    return true;
  });

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  const renderMenuCard = (menu: DailyMenu) => (
    <Card key={menu.id} className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{menu.restaurant?.name}</h3>
              <Badge variant={menu.is_active ? "default" : "secondary"}>
                {menu.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(menu.date)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <ChefHat className="h-3 w-3" />
                <span>{menu.menu_items?.length || 0} items</span>
              </div>
            </div>

            {menu.menu_items && menu.menu_items.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Today's Menu:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  {menu.menu_items.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-1 bg-gray-50 rounded">
                      <span className="truncate">{item.dish?.name}</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                  {menu.menu_items.length > 4 && (
                    <div className="text-gray-500 text-center col-span-2">
                      +{menu.menu_items.length - 4} more items
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditModal(menu)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => deleteDailyMenu(menu.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyMenuFromPreviousDay(menu.restaurant_id, new Date(new Date(menu.date).getTime() + 86400000).toISOString().split('T')[0])}
              title="Copy to next day"
            >
              <Copy className="h-3 w-3" />
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
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchDailyMenus();
  }, [fetchDailyMenus]);

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dynamic Menu Management</h2>
          <p className="text-gray-600">Manage daily menus for restaurants with changing dishes</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button onClick={() => resetMenuForm()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Daily Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Daily Menu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="restaurant_id">Restaurant</Label>
                <Select
                  value={menuFormData.restaurant_id}
                  onValueChange={(value) => setMenuFormData(prev => ({ ...prev, restaurant_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map(restaurant => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name} - {restaurant.town}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={menuFormData.date}
                  onChange={(e) => setMenuFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={menuFormData.is_active}
                  onCheckedChange={(checked) => setMenuFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Menu Active</Label>
              </div>

              {menuFormData.restaurant_id && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> After creating the menu, you can add menu items by editing it. 
                    You can also copy items from the previous day.
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createDailyMenu} 
                  disabled={loading || !menuFormData.restaurant_id || !menuFormData.date}
                >
                  {loading ? 'Creating...' : 'Create Menu'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date_filter">Date From</Label>
              <Input
                id="date_filter"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="restaurant_filter">Restaurant</Label>
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger>
                  <SelectValue placeholder="All restaurants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Restaurants</SelectItem>
                  {restaurants.map(restaurant => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={fetchDailyMenus}
                disabled={loading}
                className="w-full"
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{filteredMenus.length}</div>
                <div className="text-sm text-gray-600">Total Menus</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredMenus.filter(m => m.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Active Menus</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredMenus.reduce((sum, menu) => sum + (menu.menu_items?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menus list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-choptym-orange mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading daily menus...</p>
          </div>
        ) : filteredMenus.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No daily menus found</h3>
              <p className="text-gray-600 mb-4">
                {restaurants.length === 0 
                  ? 'No restaurants with dynamic menus found. Enable dynamic menus for restaurants first.'
                  : 'Create daily menus for restaurants with changing dishes.'}
              </p>
              {restaurants.length > 0 && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Daily Menu
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredMenus.map(renderMenuCard)
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Daily Menu</DialogTitle>
          </DialogHeader>
          
          {editingMenu && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Restaurant</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {editingMenu.restaurant?.name}
                  </div>
                </div>
                <div>
                  <Label>Date</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {formatDate(editingMenu.date)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={menuFormData.is_active}
                  onCheckedChange={(checked) => setMenuFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Menu Active</Label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Menu Items</h3>
                  <Button onClick={addMenuItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {editingMenuItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Dish</Label>
                            <Select
                              value={item.dish_id}
                              onValueChange={(value) => updateMenuItem(index, 'dish_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select dish" />
                              </SelectTrigger>
                              <SelectContent>
                                {dishes.map(dish => (
                                  <SelectItem key={dish.id} value={dish.id}>
                                    {dish.name} ({dish.category})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Price (₵)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateMenuItem(index, 'price', parseFloat(e.target.value))}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <Label>Available Quantity</Label>
                            <Input
                              type="number"
                              value={item.available_quantity || ''}
                              onChange={(e) => updateMenuItem(index, 'available_quantity', e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="Optional"
                            />
                          </div>

                          <div className="flex items-end gap-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={item.availability}
                                onCheckedChange={(checked) => updateMenuItem(index, 'availability', checked)}
                              />
                              <Label className="text-sm">Available</Label>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeMenuItem(index)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2">
                          <Label>Special Notes</Label>
                          <Textarea
                            value={item.special_notes || ''}
                            onChange={(e) => updateMenuItem(index, 'special_notes', e.target.value)}
                            placeholder="Any special notes about this item..."
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {editingMenuItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No menu items added yet. Click "Add Item" to start.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={updateDailyMenu} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Menu'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DynamicMenuManagement;