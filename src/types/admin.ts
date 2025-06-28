
export interface AdminUser {
  id: string;
  email: string;
  role: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryZone {
  id: string;
  town: string;
  zone_name: string;
  distance_min: number;
  distance_max: number;
  fee: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface RestaurantFormData {
  name: string;
  town: string;
  contact_number: string;
  mtn_number?: string;
  orange_number?: string;
  image_url?: string;
  logo_url?: string;
  active: boolean;
  delivery_time_min: number;
  delivery_time_max: number;
}

export interface DishFormData {
  name: string;
  description?: string;
  category: string;
  image_url?: string;
  is_popular: boolean;
  is_spicy: boolean;
  is_vegetarian: boolean;
  cook_time: string;
  serves: string;
  active: boolean;
}

export interface MenuItemFormData {
  restaurant_id: string;
  dish_id: string;
  price: number;
  availability: boolean;
}
