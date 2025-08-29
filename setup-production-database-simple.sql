-- SIMPLE PRODUCTION DATABASE SETUP
-- Run this SQL in your Supabase production dashboard
-- This version avoids the IF NOT EXISTS syntax issue

-- =============================================================================
-- CREATE TABLES
-- =============================================================================

-- Drop existing tables if they exist (clean start)
DROP TABLE IF EXISTS restaurant_menus CASCADE;
DROP TABLE IF EXISTS dishes CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS delivery_fee_settings CASCADE;

-- Create delivery_fee_settings table
CREATE TABLE delivery_fee_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_delivery_fee_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT delivery_fee_settings_enabled_check CHECK (is_delivery_fee_enabled IN (true, false))
);

-- Create dishes table
CREATE TABLE dishes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT dishes_price_check CHECK (price >= 0)
);

-- Create restaurants table
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  phone VARCHAR(20),
  town VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create restaurant_menus table
CREATE TABLE restaurant_menus (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  availability BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT restaurant_menus_price_check CHECK (price >= 0)
);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE delivery_fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_menus ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CREATE POLICIES (Simple version)
-- =============================================================================

-- Delivery fee settings
CREATE POLICY "Allow all access to delivery fee settings"
  ON delivery_fee_settings FOR ALL USING (true);

-- Dishes
CREATE POLICY "Allow all access to dishes"
  ON dishes FOR ALL USING (true);

-- Restaurants
CREATE POLICY "Allow all access to restaurants"
  ON restaurants FOR ALL USING (true);

-- Restaurant menus
CREATE POLICY "Allow all access to restaurant menus"
  ON restaurant_menus FOR ALL USING (true);

-- =============================================================================
-- INSERT SAMPLE DATA
-- =============================================================================

-- Insert delivery fee setting
INSERT INTO delivery_fee_settings (is_delivery_fee_enabled)
VALUES (false);

-- Insert sample dishes
INSERT INTO dishes (name, description, price, category, image_url, active) VALUES
('Eru with Achu', 'Traditional Cameroonian dish with fermented cassava leaves and pounded cocoyam', 2500, 'Traditional', 'https://example.com/eru-achu.jpg', true),
('Ndolé with Fried Plantains', 'Bitterleaf stew with roasted peanuts and fried plantains', 2200, 'Traditional', 'https://example.com/ndole.jpg', true),
('Chicken Pepper Soup', 'Spicy chicken soup with peppers and traditional spices', 1800, 'Soups', 'https://example.com/pepper-soup.jpg', true),
('Grilled Fish with Chips', 'Fresh grilled fish served with French fries and vegetables', 3000, 'Seafood', 'https://example.com/grilled-fish.jpg', true),
('Jollof Rice with Chicken', 'West African rice dish with tender chicken and vegetables', 2000, 'Rice Dishes', 'https://example.com/jollof-rice.jpg', true),
('Koki Beans', 'Steamed black-eyed peas with traditional spices', 1500, 'Vegetarian', 'https://example.com/koki.jpg', true),
('Poulet DG (Chicken DG)', 'Fried chicken with plantains and spicy sauce', 2800, 'Chicken', 'https://example.com/poulet-dg.jpg', true),
('Egusi Soup with Fufu', 'Melon seed soup served with cassava fufu', 2400, 'Soups', 'https://example.com/egusi.jpg', true),
('Sanga (Spicy Beef)', 'Spicy grilled beef with peppers and onions', 3200, 'Meat', 'https://example.com/sanga.jpg', true),
('Irish Potatoes with Eggs', 'Fried potatoes with scrambled eggs and vegetables', 1600, 'Breakfast', 'https://example.com/irish-potatoes.jpg', true);

-- Insert sample restaurants
INSERT INTO restaurants (name, description, address, phone, town, active) VALUES
('Mama''s Kitchen', 'Authentic Cameroonian cuisine since 2010', 'Mile 2, Limbe', '+237670416449', 'Limbe', true),
('Coastal Flavors', 'Fresh seafood and traditional dishes', 'Down Beach, Limbe', '+237677123456', 'Limbe', true),
('Savanna Grill', 'Grilled meats and barbecue specialties', 'Bundes Junction, Limbe', '+237678234567', 'Limbe', true),
('Urban Bites', 'Modern takes on traditional Cameroonian food', 'Carrefour Nlongkak, Yaoundé', '+237679345678', 'Yaoundé', true),
('Village Kitchen', 'Home-style cooking with fresh ingredients', 'Molyko, Buea', '+237680456789', 'Buea', true);

-- Insert restaurant menu items (link dishes to restaurants)
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT
  r.id as restaurant_id,
  d.id as dish_id,
  d.price,
  true as availability
FROM restaurants r
CROSS JOIN dishes d
WHERE r.active = true AND d.active = true;

-- =============================================================================
-- VERIFY SETUP
-- =============================================================================

-- Check that tables were created and populated
SELECT 'Tables created successfully!' as status;

SELECT
  'dishes' as table_name,
  COUNT(*) as record_count
FROM dishes
UNION ALL
SELECT
  'restaurants' as table_name,
  COUNT(*) as record_count
FROM restaurants
UNION ALL
SELECT
  'restaurant_menus' as table_name,
  COUNT(*) as record_count
FROM restaurant_menus
UNION ALL
SELECT
  'delivery_fee_settings' as table_name,
  COUNT(*) as record_count
FROM delivery_fee_settings;

-- Show sample dishes
SELECT
  d.name,
  d.price,
  d.category
FROM dishes d
WHERE d.active = true
ORDER BY d.name
LIMIT 5;

-- Success message
SELECT '🎉 PRODUCTION DATABASE SETUP COMPLETE!' as message;
SELECT '✅ Tables created and populated' as status;
SELECT '✅ 10 dishes, 5 restaurants, menu connections ready' as data;
SELECT '🌐 Your production dishes should now display!' as result;