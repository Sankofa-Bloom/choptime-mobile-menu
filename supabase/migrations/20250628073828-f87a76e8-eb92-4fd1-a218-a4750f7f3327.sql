
-- Create admin_users table for authentication
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add delivery zones table for distance-based pricing
CREATE TABLE public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  town TEXT NOT NULL,
  zone_name TEXT NOT NULL,
  distance_min INTEGER NOT NULL DEFAULT 0, -- in km
  distance_max INTEGER NOT NULL DEFAULT 5, -- in km
  fee INTEGER NOT NULL, -- in FCFA
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhance restaurants table with admin fields
ALTER TABLE public.restaurants 
ADD COLUMN logo_url TEXT,
ADD COLUMN active BOOLEAN DEFAULT true,
ADD COLUMN delivery_time_min INTEGER DEFAULT 15,
ADD COLUMN delivery_time_max INTEGER DEFAULT 45;

-- Enhance dishes table with admin fields
ALTER TABLE public.dishes 
ADD COLUMN active BOOLEAN DEFAULT true,
ADD COLUMN admin_created BOOLEAN DEFAULT false;

-- Create dish_categories enum if not exists
DO $$ BEGIN
  CREATE TYPE dish_category AS ENUM ('Eru', 'Achu', 'Rice', 'Ndole', 'Soup', 'Grilled', 'Snacks', 'Drinks', 'Traditional');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update dishes category column to use new enum
ALTER TABLE public.dishes ALTER COLUMN category TYPE dish_category USING category::dish_category;

-- Add order_status enum if not exists
DO $$ BEGIN
  CREATE TYPE admin_order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enhance orders table with admin fields
ALTER TABLE public.orders 
ADD COLUMN delivery_zone_id UUID REFERENCES public.delivery_zones(id),
ADD COLUMN delivery_fee_breakdown TEXT,
ADD COLUMN admin_notes TEXT,
ADD COLUMN momo_number TEXT;

-- Enable RLS for new tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users (only admins can access)
CREATE POLICY "Only authenticated admins can access admin_users" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.jwt() ->> 'email' AND active = true
    )
  );

-- RLS Policies for delivery_zones (public read, admin write)
CREATE POLICY "Anyone can view active delivery zones" ON public.delivery_zones
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage delivery zones" ON public.delivery_zones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.jwt() ->> 'email' AND active = true
    )
  );

-- Insert default delivery zones for Buea and Limbe
INSERT INTO public.delivery_zones (town, zone_name, distance_min, distance_max, fee) VALUES
('Buea', 'Town Center (0-2km)', 0, 2, 500),
('Buea', 'Suburbs (2-5km)', 2, 5, 800),
('Buea', 'Outskirts (5km+)', 5, 20, 1200),
('Limbe', 'Mile 1-2 (0-3km)', 0, 3, 600),
('Limbe', 'Mile 3-4 (3-6km)', 3, 6, 900),
('Limbe', 'Down Beach & Beyond (6km+)', 6, 20, 1400);

-- Update existing restaurants with new fields
UPDATE public.restaurants SET 
  active = true, 
  delivery_time_min = 15, 
  delivery_time_max = 45
WHERE active IS NULL;

-- Update existing dishes with new fields
UPDATE public.dishes SET 
  active = true, 
  admin_created = false
WHERE active IS NULL;

-- Create function to calculate delivery fee based on location
CREATE OR REPLACE FUNCTION calculate_delivery_fee(town_name TEXT, location_description TEXT)
RETURNS TABLE(zone_id UUID, zone_name TEXT, fee INTEGER) AS $$
DECLARE
  zone_record RECORD;
BEGIN
  -- Simple text-based logic for now (can be enhanced with maps API later)
  -- Default to first zone if no specific match
  SELECT dz.id, dz.zone_name, dz.fee INTO zone_record
  FROM public.delivery_zones dz
  WHERE dz.town = town_name AND dz.active = true
  ORDER BY dz.distance_min
  LIMIT 1;
  
  -- Check for keywords that might indicate distance
  IF location_description ILIKE '%outskirt%' OR location_description ILIKE '%far%' OR 
     location_description ILIKE '%beyond%' OR location_description ILIKE '%distant%' THEN
    SELECT dz.id, dz.zone_name, dz.fee INTO zone_record
    FROM public.delivery_zones dz
    WHERE dz.town = town_name AND dz.active = true
    ORDER BY dz.distance_max DESC
    LIMIT 1;
  ELSIF location_description ILIKE '%center%' OR location_description ILIKE '%town%' OR
        location_description ILIKE '%main%' THEN
    SELECT dz.id, dz.zone_name, dz.fee INTO zone_record
    FROM public.delivery_zones dz
    WHERE dz.town = town_name AND dz.active = true
    ORDER BY dz.distance_min
    LIMIT 1;
  END IF;
  
  RETURN QUERY SELECT zone_record.id, zone_record.zone_name, zone_record.fee;
END;
$$ LANGUAGE plpgsql;

-- Create admin function to get order statistics
CREATE OR REPLACE FUNCTION get_order_stats()
RETURNS TABLE(
  total_orders BIGINT,
  pending_orders BIGINT,
  completed_orders BIGINT,
  total_revenue BIGINT,
  avg_order_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE status = 'delivered') as completed_orders,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COALESCE(AVG(total_amount), 0) as avg_order_value
  FROM public.orders;
END;
$$ LANGUAGE plpgsql;
