
export interface Restaurant {
  id: string;
  name: string;
  town: string;
  image_url?: string;
  logo_url?: string;
  contact_number: string;
  mtn_number?: string;
  orange_number?: string;
  auth_id?: string;
  active?: boolean;
  delivery_time_min?: number;
  delivery_time_max?: number;
  // Enhanced restaurant data
  gps_latitude?: number;
  gps_longitude?: number;
  address?: string;
  description?: string;
  rating?: number;
  total_reviews?: number;
  cuisine_type?: string;
  has_dynamic_menu?: boolean;
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
  active?: boolean;
  admin_created?: boolean;
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
  delivery_fee?: number;
  order_reference?: string;
  status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  // Payment tracking
  payment_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method?: 'momo' | 'cash' | 'card' | 'bank_transfer';
  payment_reference?: string;
  payment_provider?: 'mtn' | 'vodafone' | 'airteltigo' | 'stripe' | 'paystack';
  // Enhanced tracking
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  preparation_time?: number; // in minutes
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  special_instructions?: string;
  rating?: number;
  review?: string;
  // GPS tracking
  delivery_gps_latitude?: number;
  delivery_gps_longitude?: number;
  created_at?: string;
  updated_at?: string;
  confirmed_at?: string;
  preparing_at?: string;
  ready_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
}

export interface CustomOrder {
  id?: string;
  user_name: string;
  user_phone: string;
  user_location: string;
  custom_dish_name: string;
  quantity: number;
  special_instructions?: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
  estimated_price?: number;
  total_amount?: number;
  order_reference?: string;
  status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryFee {
  id: string;
  town: string;
  fee: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  dish: Dish;
  restaurant: Restaurant;
  quantity: number;
  price: number;
}

export interface CustomOrderItem {
  customDishName: string;
  restaurant: Restaurant;
  quantity: number;
  estimatedPrice: number;
  specialInstructions?: string;
  restaurantAddress: string;
  restaurantPhone: string;
}

export interface UserTown {
  id?: string;
  user_phone: string;
  town: string;
  created_at?: string;
  updated_at?: string;
}

// Dynamic menu management
export interface DailyMenu {
  id: string;
  restaurant_id: string;
  date: string; // YYYY-MM-DD format
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined data
  restaurant?: Restaurant;
  menu_items?: DailyMenuItem[];
}

export interface DailyMenuItem {
  id: string;
  daily_menu_id: string;
  dish_id: string;
  price: number;
  availability: boolean;
  available_quantity?: number;
  sold_quantity?: number;
  special_notes?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  dish?: Dish;
}

// Driver management
export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  license_number?: string;
  vehicle_type?: 'motorcycle' | 'bicycle' | 'car' | 'scooter';
  vehicle_registration?: string;
  is_active: boolean;
  is_available: boolean;
  current_gps_latitude?: number;
  current_gps_longitude?: number;
  rating?: number;
  total_deliveries?: number;
  created_at?: string;
  updated_at?: string;
}

// System settings
export interface SystemSettings {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Analytics and reporting
export interface OrderAnalytics {
  date: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
  peak_hour: string;
  popular_dishes: string[];
}

export interface RestaurantAnalytics {
  restaurant_id: string;
  restaurant_name: string;
  total_orders: number;
  total_revenue: number;
  average_rating: number;
  completion_rate: number;
  popular_dishes: { dish_name: string; count: number }[];
}
