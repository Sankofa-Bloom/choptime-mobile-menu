// Dish Card Component
// Displays dish information with restaurant count and actions

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit } from 'lucide-react';
import { DishCardProps, Dish, Restaurant, DISH_CATEGORIES } from '../types';

const DishCard: React.FC<DishCardProps> = ({ dish, restaurants, onEdit, onDelete }) => {
  const [restaurantCount, setRestaurantCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    const fetchRestaurantCount = async () => {
      try {
        const { count, error } = await supabase
          .from('restaurant_menus')
          .select('*', { count: 'exact', head: true })
          .eq('dish_id', dish.id);

        if (!error) {
          setRestaurantCount(count || 0);
        }
      } catch (error) {
        console.error('Error fetching restaurant count:', error);
      } finally {
        setLoadingCount(false);
      }
    };

    fetchRestaurantCount();
  }, [dish.id]);

  const getCategoryEmoji = (category: string) => {
    const categoryData = DISH_CATEGORIES.find(cat => cat.value === category);
    return categoryData?.emoji || '🍽️';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold">{dish.name}</h3>
              <Badge variant={dish.active ? 'default' : 'secondary'}>
                {dish.active ? 'Active' : 'Inactive'}
              </Badge>
              {dish.category && (
                <Badge variant="outline">
                  {getCategoryEmoji(dish.category)} {dish.category}
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mb-2">{dish.description}</p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>🏪 Served at: {loadingCount ? '...' : `${restaurantCount} restaurant${restaurantCount !== 1 ? 's' : ''}`}</p>
              {dish.admin_created && <p>👨‍💼 Admin Created</p>}
              <p className="text-xs text-gray-400">
                Created: {new Date(dish.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(dish)}
              title="Edit dish and manage restaurants"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(dish.id)}
              title="Delete dish from all restaurants"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DishCard;