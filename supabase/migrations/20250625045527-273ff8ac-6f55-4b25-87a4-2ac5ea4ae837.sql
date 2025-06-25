
-- Create enum for dish categories
CREATE TYPE dish_category AS ENUM ('Traditional', 'Soup', 'Rice', 'Grilled', 'Snacks', 'Drinks');

-- Create enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');

-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  town TEXT NOT NULL,
  image_url TEXT,
  contact_number TEXT NOT NULL,
  mtn_number TEXT,
  orange_number TEXT,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dishes table (master list of all dishes)
CREATE TABLE public.dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category dish_category NOT NULL,
  image_url TEXT,
  is_popular BOOLEAN DEFAULT FALSE,
  is_spicy BOOLEAN DEFAULT FALSE,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  cook_time TEXT DEFAULT '30-45 min',
  serves TEXT DEFAULT '1-2 people',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create restaurant_menus table (links restaurants to dishes with their prices)
CREATE TABLE public.restaurant_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  dish_id UUID REFERENCES public.dishes(id) ON DELETE CASCADE,
  price INTEGER NOT NULL, -- Price in FCFA
  availability BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, dish_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  user_location TEXT NOT NULL,
  dish_name TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id),
  dish_id UUID REFERENCES public.dishes(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL, -- Price in FCFA
  total_amount INTEGER NOT NULL, -- quantity * price
  status order_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_towns table to store user's selected town
CREATE TABLE public.user_towns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone TEXT NOT NULL UNIQUE,
  town TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_towns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants
CREATE POLICY "Restaurants can manage their own data" ON public.restaurants
  FOR ALL USING (auth.uid() = auth_id);

CREATE POLICY "Anyone can view restaurants" ON public.restaurants
  FOR SELECT USING (true);

-- RLS Policies for dishes (public read, admin write)
CREATE POLICY "Anyone can view dishes" ON public.dishes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage dishes" ON public.dishes
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for restaurant_menus
CREATE POLICY "Restaurants can manage their own menu" ON public.restaurant_menus
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = restaurant_menus.restaurant_id 
      AND restaurants.auth_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view restaurant menus" ON public.restaurant_menus
  FOR SELECT USING (true);

-- RLS Policies for orders
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Restaurants can view their orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = orders.restaurant_id 
      AND restaurants.auth_id = auth.uid()
    )
  );

CREATE POLICY "Orders can be updated by restaurant owners" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = orders.restaurant_id 
      AND restaurants.auth_id = auth.uid()
    )
  );

-- RLS Policies for user_towns
CREATE POLICY "Anyone can manage user towns" ON public.user_towns
  FOR ALL USING (true);

-- Insert sample data
INSERT INTO public.dishes (name, description, category, is_popular, is_spicy, cook_time, serves) VALUES
('Eru with Fufu', 'Traditional Cameroonian eru leaves cooked with dried fish, crayfish, and palm oil. Served with soft fufu.', 'Traditional', true, false, '45 min', '2-3 people'),
('Achu Yellow Soup', 'Delicious yellow soup made with palm nuts, vegetables, and assorted meat. Served with pounded cocoyam.', 'Soup', true, false, '60 min', '3-4 people'),
('Ndolé', 'Cameroon''s national dish made with ndolé leaves, groundnuts, fish, and meat in rich sauce.', 'Traditional', true, true, '50 min', '2-3 people'),
('Pepper Soup', 'Spicy and aromatic pepper soup with fresh fish or meat, perfect for any weather.', 'Soup', false, true, '30 min', '1-2 people'),
('Jollof Rice', 'Perfectly seasoned jollof rice cooked with tomatoes, spices, and your choice of chicken or beef.', 'Rice', true, false, '40 min', '2 people'),
('Banga Soup', 'Rich palm fruit soup with assorted meat and fish, seasoned with traditional spices.', 'Soup', false, false, '55 min', '3 people');

-- Insert sample restaurants
INSERT INTO public.restaurants (name, town, contact_number, mtn_number, orange_number) VALUES
('Mama Africa Kitchen', 'Douala', '+237 6 70 41 64 49', '+237 6 70 41 64 49', '+237 6 90 12 34 56'),
('Authentic Bamileke Cuisine', 'Yaoundé', '+237 6 80 22 33 44', '+237 6 80 22 33 44', '+237 6 95 44 55 66'),
('ChopTime Express', 'Douala', '+237 6 70 41 64 49', '+237 6 70 41 64 49', '+237 6 92 77 88 99'),
('Buea Flavors', 'Buea', '+237 6 75 55 66 77', '+237 6 75 55 66 77', '+237 6 98 77 66 55');

-- Insert sample restaurant menus with town-based pricing
INSERT INTO public.restaurant_menus (restaurant_id, dish_id, price, availability) 
SELECT 
  r.id,
  d.id,
  CASE 
    WHEN r.town = 'Buea' THEN 2500
    WHEN r.town = 'Yaoundé' THEN 3000
    ELSE 2600
  END,
  true
FROM public.restaurants r
CROSS JOIN public.dishes d
WHERE (r.name = 'Mama Africa Kitchen' AND d.name IN ('Eru with Fufu', 'Achu Yellow Soup', 'Ndolé', 'Pepper Soup'))
   OR (r.name = 'Authentic Bamileke Cuisine' AND d.name IN ('Eru with Fufu', 'Achu Yellow Soup', 'Ndolé', 'Banga Soup'))
   OR (r.name = 'ChopTime Express' AND d.name IN ('Eru with Fufu', 'Ndolé', 'Pepper Soup', 'Jollof Rice', 'Banga Soup'))
   OR (r.name = 'Buea Flavors' AND d.name IN ('Eru with Fufu', 'Ndolé', 'Pepper Soup', 'Jollof Rice'));

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-images', 'restaurant-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('dish-images', 'dish-images', true);

-- Storage policies for restaurant images
CREATE POLICY "Anyone can view restaurant images" ON storage.objects
  FOR SELECT USING (bucket_id = 'restaurant-images');

CREATE POLICY "Authenticated users can upload restaurant images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'restaurant-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their restaurant images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'restaurant-images' AND auth.uid() IS NOT NULL);

-- Storage policies for dish images
CREATE POLICY "Anyone can view dish images" ON storage.objects
  FOR SELECT USING (bucket_id = 'dish-images');

CREATE POLICY "Authenticated users can upload dish images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'dish-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update dish images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'dish-images' AND auth.uid() IS NOT NULL);
