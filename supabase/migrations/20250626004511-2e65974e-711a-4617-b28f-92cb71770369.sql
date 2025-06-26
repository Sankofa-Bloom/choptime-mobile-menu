
-- Add Limbe and Buea to existing towns, and update sample data
INSERT INTO public.restaurants (name, town, contact_number, mtn_number, orange_number) VALUES
('Limbe Fresh Kitchen', 'Limbe', '+237 6 70 41 64 49', '+237 6 70 41 64 49', '+237 6 92 77 88 99'),
('Buea Mountain Cuisine', 'Buea', '+237 6 70 41 64 49', '+237 6 70 41 64 49', '+237 6 98 77 66 55');

-- Add more menu items for Limbe and Buea restaurants
INSERT INTO public.restaurant_menus (restaurant_id, dish_id, price, availability) 
SELECT 
  r.id,
  d.id,
  CASE 
    WHEN r.town = 'Limbe' THEN 2800
    WHEN r.town = 'Buea' THEN 2500
    ELSE 2600
  END,
  true
FROM public.restaurants r
CROSS JOIN public.dishes d
WHERE (r.name = 'Limbe Fresh Kitchen' AND d.name IN ('Eru with Fufu', 'Ndolé', 'Pepper Soup', 'Jollof Rice'))
   OR (r.name = 'Buea Mountain Cuisine' AND d.name IN ('Eru with Fufu', 'Achu Yellow Soup', 'Ndolé', 'Banga Soup'));

-- Create delivery_fees table for town-based delivery pricing
CREATE TABLE public.delivery_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  town TEXT NOT NULL UNIQUE,
  fee INTEGER NOT NULL DEFAULT 500, -- Fee in FCFA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default delivery fees
INSERT INTO public.delivery_fees (town, fee) VALUES
('Douala', 600),
('Yaoundé', 800),
('Buea', 500),
('Limbe', 700),
('Bamenda', 600),
('Bafoussam', 550);

-- Add order_reference to orders table for unique order IDs
ALTER TABLE public.orders ADD COLUMN order_reference TEXT;

-- Create custom_orders table for custom food orders
CREATE TABLE public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  user_location TEXT NOT NULL,
  custom_dish_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  special_instructions TEXT,
  restaurant_id UUID REFERENCES public.restaurants(id),
  restaurant_name TEXT NOT NULL,
  estimated_price INTEGER, -- Estimated price in FCFA
  total_amount INTEGER,
  order_reference TEXT,
  status order_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE public.delivery_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_fees (public read)
CREATE POLICY "Anyone can view delivery fees" ON public.delivery_fees
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage delivery fees" ON public.delivery_fees
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for custom_orders
CREATE POLICY "Anyone can create custom orders" ON public.custom_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Restaurants can view their custom orders" ON public.custom_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = custom_orders.restaurant_id 
      AND restaurants.auth_id = auth.uid()
    )
  );

-- Create function to generate unique order reference
CREATE OR REPLACE FUNCTION generate_order_reference(town_name TEXT)
RETURNS TEXT AS $$
DECLARE
  town_code TEXT;
  random_number INTEGER;
BEGIN
  -- Get town code
  town_code := CASE 
    WHEN UPPER(town_name) = 'DOUALA' THEN 'DLA'
    WHEN UPPER(town_name) = 'YAOUNDÉ' THEN 'YDE'
    WHEN UPPER(town_name) = 'BUEA' THEN 'BUE'
    WHEN UPPER(town_name) = 'LIMBE' THEN 'LMB'
    WHEN UPPER(town_name) = 'BAMENDA' THEN 'BAM'
    WHEN UPPER(town_name) = 'BAFOUSSAM' THEN 'BAF'
    ELSE 'CHT'
  END;
  
  -- Generate random 4-digit number
  random_number := FLOOR(RANDOM() * 9000) + 1000;
  
  RETURN 'CHP-' || town_code || '-' || random_number::TEXT;
END;
$$ LANGUAGE plpgsql;
