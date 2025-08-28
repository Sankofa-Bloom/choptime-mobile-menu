-- =============================================================================
-- ENHANCED ADMIN DATABASE SCHEMA
-- This migration adds all necessary tables and columns to support the
-- comprehensive admin dashboard features
-- =============================================================================

-- =============================================================================
-- 1. ENHANCE RESTAURANTS TABLE WITH GPS AND OPERATING HOURS
-- =============================================================================

-- Add GPS coordinates and enhanced location data
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS gps_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS gps_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cuisine_type TEXT,
ADD COLUMN IF NOT EXISTS has_dynamic_menu BOOLEAN DEFAULT false;

-- Add operating hours (7 days)
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS monday_open TIME,
ADD COLUMN IF NOT EXISTS monday_close TIME,
ADD COLUMN IF NOT EXISTS tuesday_open TIME,
ADD COLUMN IF NOT EXISTS tuesday_close TIME,
ADD COLUMN IF NOT EXISTS wednesday_open TIME,
ADD COLUMN IF NOT EXISTS wednesday_close TIME,
ADD COLUMN IF NOT EXISTS thursday_open TIME,
ADD COLUMN IF NOT EXISTS thursday_close TIME,
ADD COLUMN IF NOT EXISTS friday_open TIME,
ADD COLUMN IF NOT EXISTS friday_close TIME,
ADD COLUMN IF NOT EXISTS saturday_open TIME,
ADD COLUMN IF NOT EXISTS saturday_close TIME,
ADD COLUMN IF NOT EXISTS sunday_open TIME,
ADD COLUMN IF NOT EXISTS sunday_close TIME,
ADD COLUMN IF NOT EXISTS is_open_24_7 BOOLEAN DEFAULT false;

-- =============================================================================
-- 2. ENHANCE ORDERS TABLE WITH PAYMENT AND DELIVERY TRACKING
-- =============================================================================

-- Add payment tracking fields
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_fee INTEGER,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('momo', 'cash', 'card', 'bank_transfer')),
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT CHECK (payment_provider IN ('mtn', 'vodafone', 'airteltigo', 'stripe', 'paystack'));

-- Add delivery and driver tracking
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS preparation_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS driver_id UUID,
ADD COLUMN IF NOT EXISTS driver_name TEXT,
ADD COLUMN IF NOT EXISTS driver_phone TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS review TEXT;

-- Add GPS tracking for delivery
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_gps_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS delivery_gps_longitude DECIMAL(11, 8);

-- Add status tracking timestamps
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Update order status enum to include new statuses
DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 3. CREATE DAILY MENUS SYSTEM
-- =============================================================================

-- Create daily_menus table
CREATE TABLE IF NOT EXISTS public.daily_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, date)
);

-- Create daily_menu_items table
CREATE TABLE IF NOT EXISTS public.daily_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_menu_id UUID NOT NULL REFERENCES public.daily_menus(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  price INTEGER NOT NULL, -- Price in FCFA
  availability BOOLEAN DEFAULT true,
  available_quantity INTEGER,
  sold_quantity INTEGER DEFAULT 0,
  special_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(daily_menu_id, dish_id)
);

-- =============================================================================
-- 4. CREATE DRIVER MANAGEMENT SYSTEM
-- =============================================================================

-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  license_number TEXT,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'car', 'scooter')),
  vehicle_registration TEXT,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  current_gps_latitude DECIMAL(10, 8),
  current_gps_longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 5. CREATE SYSTEM SETTINGS TABLE
-- =============================================================================

-- Create system_settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 6. CREATE ANALYTICS TABLES
-- =============================================================================

-- Create order_analytics table for daily/weekly/monthly reports
CREATE TABLE IF NOT EXISTS public.order_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  peak_hour INTEGER,
  popular_dishes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Create restaurant_analytics table
CREATE TABLE IF NOT EXISTS public.restaurant_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  popular_dishes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, date)
);

-- =============================================================================
-- 7. ENABLE ROW LEVEL SECURITY FOR NEW TABLES
-- =============================================================================

ALTER TABLE public.daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_analytics ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 8. RLS POLICIES FOR NEW TABLES
-- =============================================================================

-- Daily Menus: Restaurants can manage their own, admins can view all
CREATE POLICY "Restaurants can manage their daily menus" ON public.daily_menus
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = daily_menus.restaurant_id
      AND restaurants.auth_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email' AND active = true
    )
  );

CREATE POLICY "Anyone can view active daily menus" ON public.daily_menus
  FOR SELECT USING (is_active = true);

-- Daily Menu Items: Same as daily menus
CREATE POLICY "Restaurants can manage their daily menu items" ON public.daily_menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.daily_menus dm
      JOIN public.restaurants r ON r.id = dm.restaurant_id
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND r.auth_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email' AND active = true
    )
  );

CREATE POLICY "Anyone can view active daily menu items" ON public.daily_menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.daily_menus
      WHERE daily_menus.id = daily_menu_items.daily_menu_id
      AND daily_menus.is_active = true
    )
  );

-- Drivers: Only admins can manage drivers
CREATE POLICY "Admins can manage drivers" ON public.drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email' AND active = true
    )
  );

CREATE POLICY "Anyone can view active drivers" ON public.drivers
  FOR SELECT USING (is_active = true);

-- System Settings: Only admins can manage
CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email' AND active = true
    )
  );

-- Analytics: Only admins can view
CREATE POLICY "Admins can view order analytics" ON public.order_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email' AND active = true
    )
  );

CREATE POLICY "Admins can view restaurant analytics" ON public.restaurant_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email' AND active = true
    )
  );

-- =============================================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_daily_menus_restaurant_date ON public.daily_menus(restaurant_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_menus_active ON public.daily_menus(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_daily_menu_items_menu ON public.daily_menu_items(daily_menu_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_drivers_active ON public.drivers(is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_order_analytics_date ON public.order_analytics(date);
CREATE INDEX IF NOT EXISTS idx_restaurant_analytics_date ON public.restaurant_analytics(restaurant_id, date);

-- =============================================================================
-- 10. CREATE UTILITY FUNCTIONS
-- =============================================================================

-- Function to update order status with timestamps
CREATE OR REPLACE FUNCTION update_order_status_with_timestamp(
  order_id UUID,
  new_status TEXT,
  driver_id UUID DEFAULT NULL,
  driver_name TEXT DEFAULT NULL,
  driver_phone TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update the order status and timestamp
  UPDATE public.orders
  SET
    status = new_status,
    driver_id = COALESCE(driver_id, orders.driver_id),
    driver_name = COALESCE(driver_name, orders.driver_name),
    driver_phone = COALESCE(driver_phone, orders.driver_phone),
    updated_at = NOW()
  WHERE id = order_id;

  -- Set appropriate timestamp based on status
  CASE new_status
    WHEN 'confirmed' THEN
      UPDATE public.orders SET confirmed_at = NOW() WHERE id = order_id;
    WHEN 'preparing' THEN
      UPDATE public.orders SET preparing_at = NOW() WHERE id = order_id;
    WHEN 'ready' THEN
      UPDATE public.orders SET ready_at = NOW() WHERE id = order_id;
    WHEN 'out_for_delivery' THEN
      UPDATE public.orders SET out_for_delivery_at = NOW() WHERE id = order_id;
    WHEN 'delivered' THEN
      UPDATE public.orders SET delivered_at = NOW(), actual_delivery_time = NOW() WHERE id = order_id;
    ELSE
      NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate delivery fee based on GPS distance
CREATE OR REPLACE FUNCTION calculate_gps_delivery_fee(
  restaurant_lat DECIMAL,
  restaurant_lng DECIMAL,
  delivery_lat DECIMAL,
  delivery_lng DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  distance_km DECIMAL;
  base_fee INTEGER := 500; -- Base delivery fee in FCFA
  per_km_fee INTEGER := 200; -- Additional fee per km
BEGIN
  -- Calculate distance using Haversine formula (simplified)
  -- This is a basic implementation - you might want to use a more sophisticated mapping service
  distance_km := 10; -- Placeholder - implement actual distance calculation

  RETURN base_fee + (distance_km * per_km_fee);
END;
$$ LANGUAGE plpgsql;

-- Function to generate daily analytics
CREATE OR REPLACE FUNCTION generate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  -- Insert or update order analytics
  INSERT INTO public.order_analytics (
    date, total_orders, completed_orders, cancelled_orders,
    total_revenue, average_order_value, popular_dishes
  )
  SELECT
    target_date,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'delivered') as completed_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COALESCE(AVG(total_amount), 0) as average_order_value,
    jsonb_agg(dish_name) FILTER (WHERE rn <= 5) as popular_dishes
  FROM (
    SELECT
      o.*,
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
    FROM public.orders o
    WHERE DATE(o.created_at) = target_date
    GROUP BY o.id, o.dish_name, o.total_amount, o.status
  ) t
  ON CONFLICT (date) DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    completed_orders = EXCLUDED.completed_orders,
    cancelled_orders = EXCLUDED.cancelled_orders,
    total_revenue = EXCLUDED.total_revenue,
    average_order_value = EXCLUDED.average_order_value,
    popular_dishes = EXCLUDED.popular_dishes;

  -- Insert restaurant analytics
  INSERT INTO public.restaurant_analytics (
    restaurant_id, date, total_orders, total_revenue,
    average_rating, completion_rate, popular_dishes
  )
  SELECT
    r.id,
    target_date,
    COUNT(o.*) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(AVG(o.rating), 0) as average_rating,
    CASE
      WHEN COUNT(o.*) > 0 THEN
        (COUNT(*) FILTER (WHERE o.status = 'delivered')::DECIMAL / COUNT(*)) * 100
      ELSE 0
    END as completion_rate,
    jsonb_agg(jsonb_build_object('dish', o.dish_name, 'count', COUNT(*))) FILTER (WHERE rn <= 3) as popular_dishes
  FROM public.restaurants r
  LEFT JOIN public.orders o ON o.restaurant_id = r.id AND DATE(o.created_at) = target_date
  LEFT JOIN (
    SELECT
      restaurant_id,
      dish_name,
      ROW_NUMBER() OVER (PARTITION BY restaurant_id ORDER BY COUNT(*) DESC) as rn
    FROM public.orders
    WHERE DATE(created_at) = target_date
    GROUP BY restaurant_id, dish_name
  ) popular ON popular.restaurant_id = r.id
  GROUP BY r.id
  ON CONFLICT (restaurant_id, date) DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    total_revenue = EXCLUDED.total_revenue,
    average_rating = EXCLUDED.average_rating,
    completion_rate = EXCLUDED.completion_rate,
    popular_dishes = EXCLUDED.popular_dishes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 11. INSERT DEFAULT SYSTEM SETTINGS
-- =============================================================================

INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description) VALUES
('platform_name', 'ChopTym', 'string', 'Name of the food delivery platform'),
('support_email', 'support@choptym.com', 'string', 'Customer support email address'),
('support_phone', '+237 6XX XXX XXX', 'string', 'Customer support phone number'),
('default_delivery_fee', '500', 'number', 'Default delivery fee in FCFA'),
('delivery_fee_per_km', '200', 'number', 'Additional delivery fee per kilometer'),
('minimum_order_amount', '1000', 'number', 'Minimum order amount in FCFA'),
('maximum_delivery_distance', '20', 'number', 'Maximum delivery distance in kilometers'),
('platform_commission', '5', 'number', 'Platform commission percentage'),
('enable_notifications', 'true', 'boolean', 'Enable push notifications'),
('enable_sms_notifications', 'false', 'boolean', 'Enable SMS notifications'),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
('accepting_orders', 'true', 'boolean', 'Whether platform is accepting new orders')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- 12. UPDATE EXISTING DATA WITH NEW FIELDS
-- =============================================================================

-- Update existing restaurants with default values
UPDATE public.restaurants
SET
  active = true,
  delivery_time_min = 15,
  delivery_time_max = 45,
  has_dynamic_menu = false
WHERE active IS NULL;

-- Update existing dishes with active status
UPDATE public.dishes
SET active = true
WHERE active IS NULL;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- This migration adds comprehensive database support for all admin dashboard features
-- including GPS tracking, payment management, driver assignment, daily menus,
-- analytics, and system configuration.