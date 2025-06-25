
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin } from 'lucide-react';
import { Restaurant, MenuItem, RestaurantMenuItem } from '@/types/restaurant';

interface RestaurantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  restaurants: Restaurant[];
  restaurantMenuItems: RestaurantMenuItem[];
  onSelectRestaurant: (restaurant: Restaurant, price: number) => void;
}

const RestaurantSelectionModal: React.FC<RestaurantSelectionModalProps> = ({
  isOpen,
  onClose,
  menuItem,
  restaurants,
  restaurantMenuItems,
  onSelectRestaurant
}) => {
  if (!menuItem) return null;

  const availableRestaurants = restaurants.filter(restaurant => {
    const restaurantMenuItem = restaurantMenuItems.find(
      rm => rm.menuItemId === menuItem.id && rm.restaurantId === restaurant.id && rm.availability
    );
    return restaurantMenuItem;
  });

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-choptime-brown">Choose Restaurant</DialogTitle>
          <p className="text-sm text-choptime-brown/70">Select where to order {menuItem.name}</p>
        </DialogHeader>
        
        <div className="space-y-4">
          {availableRestaurants.map(restaurant => {
            const restaurantMenuItem = restaurantMenuItems.find(
              rm => rm.menuItemId === menuItem.id && rm.restaurantId === restaurant.id
            );
            const price = restaurantMenuItem?.price || menuItem.basePrice;

            return (
              <Card key={restaurant.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-choptime-brown">{restaurant.name}</h4>
                      <div className="flex items-center gap-4 text-xs text-choptime-brown/60 mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-choptime-orange text-choptime-orange" />
                          <span>{restaurant.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{restaurant.deliveryTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-choptime-brown/60 mb-3">
                        <MapPin className="w-3 h-3" />
                        <span>{restaurant.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-choptime-orange">{formatPrice(price)}</span>
                        <Button 
                          size="sm"
                          onClick={() => onSelectRestaurant(restaurant, price)}
                          className="choptime-gradient hover:opacity-90 text-white"
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantSelectionModal;
