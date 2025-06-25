
export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  deliveryTime: string;
  location: string;
  mtnNumber?: string;
  orangeNumber?: string;
  contactNumber: string;
  image: string;
}

export interface RestaurantMenuItem {
  menuItemId: string;
  restaurantId: string;
  price: number;
  availability: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
  category: string;
  rating: number;
  cookTime: string;
  serves: string;
}

export interface OrderItem extends MenuItem {
  quantity: number;
  restaurant: Restaurant;
  finalPrice: number;
}
