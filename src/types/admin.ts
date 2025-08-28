
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
  total_restaurants: number;
  active_restaurants: number;
  total_dishes: number;
  active_dishes: number;
  total_drivers: number;
  active_drivers: number;
  // Payment stats
  completed_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_payment_volume: number;
  // Time-based stats
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
  revenue_today: number;
  revenue_this_week: number;
  revenue_this_month: number;
}

export interface RestaurantFormData {
  name: string;
  town: string;
  contact_number: string;
  image_url?: string;
  logo_url?: string;
  active: boolean;
  delivery_time_min: number;
  delivery_time_max: number;
  // Enhanced data
  gps_latitude?: number;
  gps_longitude?: number;
  address?: string;
  description?: string;
  cuisine_type?: string;
  has_dynamic_menu?: boolean;
  mtn_number?: string;
  orange_number?: string;
  // Operating hours
  monday_open?: string;
  monday_close?: string;
  tuesday_open?: string;
  tuesday_close?: string;
  wednesday_open?: string;
  wednesday_close?: string;
  thursday_open?: string;
  thursday_close?: string;
  friday_open?: string;
  friday_close?: string;
  saturday_open?: string;
  saturday_close?: string;
  sunday_open?: string;
  sunday_close?: string;
  is_open_24_7?: boolean;
}

export interface DishFormData {
  name: string;
  description?: string;
  category: 'Traditional' | 'Soup' | 'Rice' | 'Grilled' | 'Snacks' | 'Drinks';
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
