
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import { Restaurant, Dish } from '@/types/restaurant';

interface RestaurantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: Dish | null;
  restaurants: Restaurant[];
  getDishPrice: (restaurantId: string) => number;
  onSelectRestaurant: (restaurant: Restaurant, price: number) => void;
}

const RestaurantSelectionModal: React.FC<RestaurantSelectionModalProps> = ({
  isOpen,
  onClose,
  dish,
  restaurants,
  getDishPrice,
  onSelectRestaurant
}) => {
  if (!dish) return null;

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    const price = getDishPrice(restaurant.id);
    onSelectRestaurant(restaurant, price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-choptym-brown">
            Choose Restaurant for {dish.name}
          </DialogTitle>
          <DialogDescription>
            Select a restaurant to order {dish.name} from. Each restaurant may have different pricing and delivery times.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {dish.description && (
            <div className="bg-choptym-beige p-4 rounded-lg">
              <p className="text-sm text-choptym-brown/80">{dish.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {dish.category}
                </Badge>
                {dish.is_popular && (
                  <Badge className="bg-choptym-orange text-white text-xs">
                    Popular
                  </Badge>
                )}
                {dish.is_spicy && (
                  <Badge variant="destructive" className="text-xs">
                    Spicy
                  </Badge>
                )}
                {dish.is_vegetarian && (
                  <Badge className="bg-green-500 text-white text-xs">
                    Vegetarian
                  </Badge>
                )}
              </div>
            </div>
          )}

          {restaurants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-choptym-brown/70">No restaurants available for this dish in your selected town.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {restaurants.map((restaurant) => {
                const price = getDishPrice(restaurant.id);
                return (
                  <Card key={restaurant.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {restaurant.image_url && (
                          <img 
                            src={restaurant.image_url}
                            alt={restaurant.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-choptym-brown">{restaurant.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-choptym-brown/70 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{restaurant.town}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-choptym-brown/70">
                            <Clock className="w-3 h-3" />
                            <span>
                              {restaurant.delivery_time_min || 15}-{restaurant.delivery_time_max || 45} min delivery
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-choptym-orange mb-2">
                            {formatPrice(price)}
                          </div>
                          <Button
                            onClick={() => handleSelectRestaurant(restaurant)}
                            className="choptym-gradient hover:opacity-90 text-white"
                            size="sm"
                          >
                            Select Restaurant
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantSelectionModal;
