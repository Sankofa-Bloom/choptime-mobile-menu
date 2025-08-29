// Admin Dashboard Types
// Centralized type definitions for the admin dashboard

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  town: string;
  address: string;
  contact_number: string;
  cuisine_type: string;
  active: boolean;
  delivery_time_min: number;
  delivery_time_max: number;
  rating: number;
  gps_latitude: number;
  gps_longitude: number;
  created_at: string;
  is_active?: boolean; // Alternative field name for compatibility
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url?: string;
  active: boolean;
  admin_created: boolean;
  created_at: string;
}

export interface RestaurantMenu {
  id?: string;
  restaurant_id: string;
  dish_id?: string;
  price: number;
  availability: boolean;
  restaurant?: {
    id: string;
    name: string;
    town: string;
  };
}

export interface RestaurantMenuItem {
  restaurant_id: string;
  price: number;
  availability: boolean;
  restaurant?: {
    id: string;
    name: string;
    town: string;
  };
}

export interface Order {
  id: string;
  user_name: string;
  user_phone: string;
  user_email?: string;
  user_location: string;
  dish_name: string;
  restaurant_name: string;
  restaurant_id?: string;
  dish_id?: string;
  quantity: number;
  price: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status: string;
  payment_method?: string;
  payment_reference?: string;
  order_reference?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  preparing_at?: string;
  ready_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
  delivery_fee?: number;
  driver_name?: string;
  driver_phone?: string;
  special_instructions?: string;
}

// Form types
export interface RestaurantFormData {
  name: string;
  description: string;
  town: string;
  address: string;
  contact_number: string;
  cuisine_type: string;
  active: boolean;
  delivery_time_min: number;
  delivery_time_max: number;
  rating: number;
  gps_latitude: number;
  gps_longitude: number;
}

export interface DishFormData {
  name: string;
  description: string;
  category: string;
  image_url?: string;
  active: boolean;
  admin_created: boolean;
}

// Component props types
export interface DishCardProps {
  dish: Dish;
  restaurants: Restaurant[];
  onEdit: (dish: Dish) => void;
  onDelete: (id: string) => void;
}

export interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: Order['status']) => void;
}

// Statistics types
export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
}

// Constants
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled'
] as const;

export const DISH_CATEGORIES = [
  { value: 'Traditional', label: '🍽️ Traditional', emoji: '🍽️' },
  { value: 'Soup', label: '🥣 Soup', emoji: '🥣' },
  { value: 'Rice', label: '🍚 Rice', emoji: '🍚' },
  { value: 'Grilled', label: '🔥 Grilled', emoji: '🔥' },
  { value: 'Snacks', label: '🍿 Snacks', emoji: '🍿' },
  { value: 'Drinks', label: '🥤 Drinks', emoji: '🥤' }
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];
export type DishCategory = typeof DISH_CATEGORIES[number]['value'];