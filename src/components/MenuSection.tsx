
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Flame, Leaf, Package } from 'lucide-react';
import { Dish, Restaurant } from '@/types/restaurant';

interface MenuSectionProps {
  dishes: Dish[];
  restaurants: Restaurant[];
  selectedTown: string;
  getAvailableRestaurantsForDish: (dishId: string) => Restaurant[];
  getDishPrice: (dishId: string, restaurantId: string) => number;
  onAddToCart: (dish: Dish) => void;
  onCustomOrder: () => void;
}

const MenuSection: React.FC<MenuSectionProps> = ({
  dishes,
  restaurants,
  selectedTown,
  getAvailableRestaurantsForDish,
  getDishPrice,
  onAddToCart,
  onCustomOrder
}) => {
  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h3 className="text-2xl font-bold text-choptym-brown mb-6">Our Menu</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Custom Order Card */}
          <Card className="overflow-hidden choptym-shadow hover:shadow-lg transition-all duration-300 animate-slide-up border-2 border-dashed border-choptym-orange/50">
            <div className="relative bg-gradient-to-br from-choptym-orange/10 to-choptym-beige/50 h-48 flex items-center justify-center">
              <div className="text-center">
                <Package className="w-16 h-16 text-choptym-orange mx-auto mb-3" />
                <Badge className="bg-choptym-orange text-white">Custom Order</Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <h4 className="font-bold text-lg text-choptym-brown mb-2">📦 Custom Food Order</h4>
              <p className="text-sm text-choptym-brown/70 mb-3">
                Can't find what you're looking for? Order any dish from your favorite restaurant!
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-choptym-orange">
                  Starting from {formatPrice(2000)}
                </span>
                <Button 
                  onClick={onCustomOrder}
                  disabled={!selectedTown || restaurants.length === 0}
                  className="choptym-gradient hover:opacity-90 text-white disabled:opacity-50"
                >
                  {restaurants.length > 0 ? 'Order Custom' : 'No Restaurants'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Regular Dishes */}
          {dishes.map((dish, index) => {
            const availableRestaurants = getAvailableRestaurantsForDish(dish.id);
            const minPrice = availableRestaurants.length > 0 ? Math.min(...availableRestaurants.map(r => getDishPrice(dish.id, r.id))) : 0;
            
            return (
              <Card key={dish.id} className="overflow-hidden choptym-shadow hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                <div className="relative">
                  <img 
                    src={dish.image_url || '/placeholder.svg'} 
                    alt={dish.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      // Fallback to local placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <Badge className="absolute top-2 left-2 bg-choptym-orange text-white">
                    {dish.category}
                  </Badge>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {dish.is_popular && (
                      <Badge variant="secondary" className="bg-white/90 text-choptym-orange">
                        Popular
                      </Badge>
                    )}
                    {dish.is_spicy && (
                      <Badge variant="secondary" className="bg-red-100 text-red-600">
                        <Flame className="w-3 h-3" />
                      </Badge>
                    )}
                    {dish.is_vegetarian && (
                      <Badge variant="secondary" className="bg-green-100 text-green-600">
                        <Leaf className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-bold text-lg text-choptym-brown mb-2">{dish.name}</h4>
                  <p className="text-sm text-choptym-brown/70 mb-3 line-clamp-2">{dish.description}</p>
                  <div className="flex items-center gap-4 text-xs text-choptym-brown/60 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{dish.cook_time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{dish.serves}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-choptym-orange">
                      {availableRestaurants.length > 0 ? `From ${formatPrice(minPrice)}` : 'Not Available'}
                    </span>
                    <Button 
                      onClick={() => onAddToCart(dish)}
                      disabled={availableRestaurants.length === 0}
                      className="choptym-gradient hover:opacity-90 text-white disabled:opacity-50"
                    >
                      {availableRestaurants.length > 0 ? 'Choose Restaurant' : 'Not Available'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
