
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Flame, Leaf, Package, MapPin } from 'lucide-react';
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

// Traditional dishes with their restaurant mappings
const traditionalDishes = [
  {
    name: "Eru",
    description: "Traditional vegetable dish with waterleaf, crayfish, and palm oil.",
    restaurants: ["IYA BUEA", "G&G Restaurant", "Tantie Hilary's Spot", "Jam Rock"],
    category: "Traditional",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: true,
    is_spicy: false,
    is_vegetarian: true,
    cook_time: "45-60 min",
    serves: "2-3 people"
  },
  {
    name: "Kati-Kati",
    description: "Grilled chicken cooked in red oil and spices, served with corn fufu.",
    restaurants: ["G&G Restaurant", "Jam Rock", "Tantie Hilary's Spot"],
    category: "Grilled",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: true,
    is_spicy: true,
    is_vegetarian: false,
    cook_time: "30-40 min",
    serves: "1-2 people"
  },
  {
    name: "Ekwang",
    description: "Grated cocoyams wrapped in cocoyam leaves, simmered in palm oil sauce.",
    restaurants: ["Velda's Recipes", "Je's Restaurant", "Tantie Hilary's Spot", "IYA BUEA"],
    category: "Traditional",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: true,
    is_spicy: false,
    is_vegetarian: true,
    cook_time: "60-90 min",
    serves: "3-4 people"
  },
  {
    name: "Achu",
    description: "Yellow soup with pounded cocoyams and meat.",
    restaurants: ["IYA BUEA", "Tantie Hilary's Spot"],
    category: "Soup",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: false,
    is_spicy: true,
    is_vegetarian: false,
    cook_time: "45-60 min",
    serves: "2-3 people"
  },
  {
    name: "Ndole",
    description: "Bitterleaf and peanut stew served with rice, plantains, or yams.",
    restaurants: ["IYA BUEA", "Top Food Restaurant"],
    category: "Soup",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: true,
    is_spicy: false,
    is_vegetarian: false,
    cook_time: "60-75 min",
    serves: "3-4 people"
  },
  {
    name: "Koki",
    description: "Steamed pudding of ground black-eyed peas, often wrapped in banana leaves.",
    restaurants: ["Top Food Restaurant", "Local Vendors"],
    category: "Traditional",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: false,
    is_spicy: false,
    is_vegetarian: true,
    cook_time: "45-60 min",
    serves: "2-3 people"
  },
  {
    name: "Pork Pepper Soup",
    description: "Spicy broth made with pork, country onions, and njangsa.",
    restaurants: ["Velda's Recipes", "IYA BUEA"],
    category: "Soup",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: false,
    is_spicy: true,
    is_vegetarian: false,
    cook_time: "30-45 min",
    serves: "1-2 people"
  },
  {
    name: "Kwa Coco",
    description: "Steamed grated cocoyam, often served with spicy banga soup.",
    restaurants: ["IYA BUEA"],
    category: "Traditional",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: false,
    is_spicy: true,
    is_vegetarian: true,
    cook_time: "40-50 min",
    serves: "2-3 people"
  },
  {
    name: "Ogbono Soup",
    description: "Nigerian-style draw soup made from wild mango seeds and assorted meat.",
    restaurants: ["Onye Naija Restaurant"],
    category: "Soup",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: false,
    is_spicy: false,
    is_vegetarian: false,
    cook_time: "45-60 min",
    serves: "2-3 people"
  },
  {
    name: "Bongo (Mbongo Tchobi)",
    description: "Dark, spicy stew made with traditional spices and smoked fish.",
    restaurants: ["IYA BUEA"],
    category: "Soup",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: false,
    is_spicy: true,
    is_vegetarian: false,
    cook_time: "60-90 min",
    serves: "3-4 people"
  },
  {
    name: "Rice",
    description: "Fried, jollof, or plain rice served with various sauces and proteins.",
    restaurants: ["Oxford Guest House", "Students Restaurant", "Fork'n Fingers"],
    category: "Rice",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: true,
    is_spicy: false,
    is_vegetarian: true,
    cook_time: "20-30 min",
    serves: "1-2 people"
  },
  {
    name: "Bush Meat",
    description: "Grilled or stewed wild meat delicacy, usually seasonal.",
    restaurants: ["IYA BUEA", "Local Bush Meat Vendors"],
    category: "Grilled",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: false,
    is_spicy: false,
    is_vegetarian: false,
    cook_time: "45-60 min",
    serves: "2-3 people"
  },
  {
    name: "Grilled Chicken",
    description: "Marinated chicken grilled to perfection with local spices.",
    restaurants: ["IYA BUEA", "G&G Restaurant", "Jam Rock"],
    category: "Grilled",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: true,
    is_spicy: false,
    is_vegetarian: false,
    cook_time: "25-35 min",
    serves: "1-2 people"
  },
  {
    name: "Mpu - Fish",
    description: "Steamed freshwater fish seasoned and wrapped in leaves.",
    restaurants: ["IYA BUEA", "Traditional Vendors"],
    category: "Traditional",
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    is_popular: false,
    is_spicy: false,
    is_vegetarian: false,
    cook_time: "30-40 min",
    serves: "1-2 people"
  }
];

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

  // Create mock dishes for traditional items
  const createTraditionalDish = (item: any, index: number): Dish => ({
    id: `traditional-${index}`,
    name: item.name,
    description: item.description,
    category: item.category as any,
    image_url: item.image_url,
    is_popular: item.is_popular,
    is_spicy: item.is_spicy,
    is_vegetarian: item.is_vegetarian,
    cook_time: item.cook_time,
    serves: item.serves,
    active: true
  });

  // Combine regular dishes with traditional dishes
  const allDishes = [
    ...dishes,
    ...traditionalDishes.map(createTraditionalDish)
  ];

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h3 className="text-2xl font-bold text-choptime-brown mb-6">Our Menu</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {/* Custom Order Card */}
          <Card className="overflow-hidden choptime-shadow hover:shadow-lg transition-all duration-300 animate-slide-up border-2 border-dashed border-choptime-orange/50">
            <div className="relative bg-gradient-to-br from-choptime-orange/10 to-choptime-beige/50 h-32 md:h-48 flex items-center justify-center">
              <div className="text-center">
                <Package className="w-8 h-8 md:w-16 md:h-16 text-choptime-orange mx-auto mb-2 md:mb-3" />
                <Badge className="bg-choptime-orange text-white text-xs">Custom Order</Badge>
              </div>
            </div>
            <CardContent className="p-2 md:p-4">
              <h4 className="font-bold text-sm md:text-lg text-choptime-brown mb-1 md:mb-2">📦 Custom Food Order</h4>
              <p className="text-xs md:text-sm text-choptime-brown/70 mb-2 md:mb-3 line-clamp-2">
                Can't find what you're looking for? Order any dish from your favorite restaurant!
              </p>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <span className="text-xs md:text-sm font-medium text-choptime-orange">
                  Starting from {formatPrice(2000)}
                </span>
                <Button 
                  onClick={onCustomOrder}
                  disabled={!selectedTown || restaurants.length === 0}
                  className="choptime-gradient hover:opacity-90 text-white disabled:opacity-50 text-xs md:text-sm p-2 h-auto"
                >
                  {restaurants.length > 0 ? 'Order Custom' : 'No Restaurants'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* All Dishes */}
          {allDishes.map((dish, index) => {
            const availableRestaurants = getAvailableRestaurantsForDish(dish.id);
            const minPrice = availableRestaurants.length > 0 ? Math.min(...availableRestaurants.map(r => getDishPrice(dish.id, r.id))) : 3000;
            
            // For traditional dishes, use the predefined restaurant list
            const isTraditional = dish.id.startsWith('traditional-');
            const traditionalItem = isTraditional ? traditionalDishes[parseInt(dish.id.split('-')[1])] : null;
            const restaurantList = isTraditional ? traditionalItem?.restaurants || [] : availableRestaurants.map(r => r.name);
            
            return (
              <Card key={dish.id} className="overflow-hidden choptime-shadow hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                <div className="relative">
                  <img 
                    src={dish.image_url || 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400'} 
                    alt={dish.name}
                    className="w-full h-24 md:h-48 object-cover"
                  />
                  <Badge className="absolute top-1 md:top-2 left-1 md:left-2 bg-choptime-orange text-white text-xs">
                    {dish.category}
                  </Badge>
                  <div className="absolute top-1 md:top-2 right-1 md:right-2 flex gap-1">
                    {dish.is_popular && (
                      <Badge variant="secondary" className="bg-white/90 text-choptime-orange text-xs">
                        Popular
                      </Badge>
                    )}
                    {dish.is_spicy && (
                      <Badge variant="secondary" className="bg-red-100 text-red-600 text-xs">
                        <Flame className="w-2 h-2 md:w-3 md:h-3" />
                      </Badge>
                    )}
                    {dish.is_vegetarian && (
                      <Badge variant="secondary" className="bg-green-100 text-green-600 text-xs">
                        <Leaf className="w-2 h-2 md:w-3 md:h-3" />
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-2 md:p-4">
                  <h4 className="font-bold text-sm md:text-lg text-choptime-brown mb-1 md:mb-2">{dish.name}</h4>
                  <p className="text-xs md:text-sm text-choptime-brown/70 mb-2 md:mb-3 line-clamp-2">{dish.description}</p>
                  
                  {/* Restaurant List */}
                  {restaurantList.length > 0 && (
                    <div className="mb-2 md:mb-3">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-choptime-orange flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-choptime-brown/60">
                          <span className="font-medium">Available at:</span>
                          <div className="mt-1">
                            {restaurantList.slice(0, 2).map((restaurant, idx) => (
                              <span key={idx} className="inline-block bg-choptime-beige/50 px-2 py-0.5 rounded-full mr-1 mb-1 text-xs">
                                {restaurant}
                              </span>
                            ))}
                            {restaurantList.length > 2 && (
                              <span className="text-choptime-orange font-medium">
                                +{restaurantList.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 md:gap-4 text-xs text-choptime-brown/60 mb-2 md:mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-2 h-2 md:w-3 md:h-3" />
                      <span>{dish.cook_time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-2 h-2 md:w-3 md:h-3" />
                      <span>{dish.serves}</span>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <span className="text-sm md:text-lg font-bold text-choptime-orange">
                      {(availableRestaurants.length > 0 || isTraditional) ? `From ${formatPrice(minPrice)}` : 'Not Available'}
                    </span>
                    <Button 
                      onClick={() => onAddToCart(dish)}
                      disabled={availableRestaurants.length === 0 && !isTraditional}
                      className="choptime-gradient hover:opacity-90 text-white disabled:opacity-50 text-xs md:text-sm p-2 h-auto"
                    >
                      {(availableRestaurants.length > 0 || isTraditional) ? 'Choose Restaurant' : 'Not Available'}
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
