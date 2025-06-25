
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin, Phone } from 'lucide-react';
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
          <DialogTitle className="text-choptime-brown">
            Choose Restaurant for {dish.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {dish.description && (
            <div className="bg-choptime-beige p-4 rounded-lg">
              <p className="text-sm text-choptime-brown/80">{dish.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {dish.category}
                </Badge>
                {dish.is_popular && (
                  <Badge className="bg-choptime-orange text-white text-xs">
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
              <p className="text-choptime-brown/70">No restaurants available for this dish in your selected town.</p>
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
                          <h4 className="font-semibold text-choptime-brown">{restaurant.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-choptime-brown/70 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{restaurant.town}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-choptime-brown/70">
                            <Phone className="w-3 h-3" />
                            <span>{restaurant.contact_number}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-choptime-orange mb-2">
                            {formatPrice(price)}
                          </div>
                          <Button
                            onClick={() => handleSelectRestaurant(restaurant)}
                            className="choptime-gradient hover:opacity-90 text-white"
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
