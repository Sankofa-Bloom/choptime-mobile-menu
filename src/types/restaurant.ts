
export interface Restaurant {
  id: string;
  name: string;
  town: string;
  image_url?: string;
  contact_number: string;
  mtn_number?: string;
  orange_number?: string;
  auth_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  category: 'Traditional' | 'Soup' | 'Rice' | 'Grilled' | 'Snacks' | 'Drinks';
  image_url?: string;
  is_popular: boolean;
  is_spicy: boolean;
  is_vegetarian: boolean;
  cook_time: string;
  serves: string;
  created_at?: string;
}

export interface RestaurantMenu {
  id: string;
  restaurant_id: string;
  dish_id: string;
  price: number;
  availability: boolean;
  created_at?: string;
  // Joined data
  restaurant?: Restaurant;
  dish?: Dish;
}

export interface Order {
  id?: string;
  user_name: string;
  user_phone: string;
  user_location: string;
  dish_name: string;
  restaurant_name: string;
  restaurant_id: string;
  dish_id: string;
  quantity: number;
  price: number;
  total_amount: number;
  status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  dish: Dish;
  restaurant: Restaurant;
  quantity: number;
  price: number;
}

export interface UserTown {
  id?: string;
  user_phone: string;
  town: string;
  created_at?: string;
  updated_at?: string;
}
