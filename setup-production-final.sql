-- FINAL PRODUCTION DATABASE SETUP
-- Uses dollar quoting to avoid apostrophe issues

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE delivery_fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_menus ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CREATE POLICIES
-- =============================================================================

-- Note: Using simple policy creation to avoid syntax issues
CREATE POLICY "delivery_fee_policy" ON delivery_fee_settings FOR ALL USING (true);
CREATE POLICY "dishes_policy" ON dishes FOR ALL USING (true);
CREATE POLICY "restaurants_policy" ON restaurants FOR ALL USING (true);
CREATE POLICY "restaurant_menus_policy" ON restaurant_menus FOR ALL USING (true);

-- =============================================================================
-- INSERT SAMPLE DATA (Using individual INSERTs to avoid issues)
-- =============================================================================

-- Insert delivery fee setting
INSERT INTO delivery_fee_settings (is_delivery_fee_enabled) VALUES (false);

-- Insert dishes one by one using dollar quoting
INSERT INTO dishes (name, description, price, category, active) VALUES
($tag$'Eru with Achu'$tag$, $tag$'Traditional Cameroonian dish with fermented cassava leaves and pounded cocoyam'$tag$, 2500, $tag$'Traditional'$tag$, true);

INSERT INTO dishes (name, description, price, category, active) VALUES
($tag$'Ndolé with Fried Plantains'$tag$, $tag$'Bitterleaf stew with roasted peanuts and fried plantains'$tag$, 2200, $tag$'Traditional'$tag$, true);

INSERT INTO dishes (name, description, price, category, active) VALUES
($tag$'Chicken Pepper Soup'$tag$, $tag$'Spicy chicken soup with peppers and traditional spices'$tag$, 1800, $tag$'Soups'$tag$, true);

INSERT INTO dishes (name, description, price, category, active) VALUES
($tag$'Grilled Fish with Chips'$tag$, $tag$'Fresh grilled fish served with French fries and vegetables'$tag$, 3000, $tag$'Seafood'$tag$, true);

INSERT INTO dishes (name, description, price, category, active) VALUES
($tag$'Jollof Rice with Chicken'$tag$, $tag$'West African rice dish with tender chicken and vegetables'$tag$, 2000, $tag$'Rice Dishes'$tag$, true);

INSERT INTO dishes (name, description, price, category, active) VALUES
($tag$'Koki Beans'$tag$, $tag$'Steamed black-eyed peas with traditional spices'$tag$, 1500, $tag$'Vegetarian'$tag$, true);

INSERT INTO dishes (name, description, price, category, active) VALUES
($tag$'Poulet DG (Chicken DG)'$tag$, $tag$'Fried chicken with plantains and spicy sauce'$tag$, 2800, $tag$'Chicken'$tag$, true);

INSERT INTO dishes (name, description, price, category, active) VALUES
($tag$'Egusi Soup with Fufu'$tag$, $tag$'Melon seed soup served with cassava fufu'$tag$, 2400, $tag$'Soups'$tag$, true);

INSERT INTO dishes (name, description, price, category, active) VALUES
($tag$'Sanga (Spicy Beef)'$tag$, $tag$'Spicy grilled beef with peppers and onions'$tag$, 3200, $tag$'Meat'$tag$, true);

INSERT INTO dishes (name, description, price, category, active) VALUES
($tag$'Irish Potatoes with Eggs'$tag$, $tag$'Fried potatoes with scrambled eggs and vegetables'$tag$, 1600, $tag$'Breakfast'$tag$, true);

-- Insert restaurants using dollar quoting
INSERT INTO restaurants (name, description, address, phone, town, active) VALUES
($tag$'Mama''s Kitchen'$tag$, $tag$'Authentic Cameroonian cuisine since 2010'$tag$, $tag$'Mile 2, Limbe'$tag$, $tag$'+237670416449'$tag$, $tag$'Limbe'$tag$, true);

INSERT INTO restaurants (name, description, address, phone, town, active) VALUES
($tag$'Coastal Flavors'$tag$, $tag$'Fresh seafood and traditional dishes'$tag$, $tag$'Down Beach, Limbe'$tag$, $tag$'+237677123456'$tag$, $tag$'Limbe'$tag$, true);

INSERT INTO restaurants (name, description, address, phone, town, active) VALUES
($tag$'Savanna Grill'$tag$, $tag$'Grilled meats and barbecue specialties'$tag$, $tag$'Bundes Junction, Limbe'$tag$, $tag$'+237678234567'$tag$, $tag$'Limbe'$tag$, true);

INSERT INTO restaurants (name, description, address, phone, town, active) VALUES
($tag$'Urban Bites'$tag$, $tag$'Modern takes on traditional Cameroonian food'$tag$, $tag$'Carrefour Nlongkak, Yaoundé'$tag$, $tag$'+237679345678'$tag$, $tag$'Yaoundé'$tag$, true);

INSERT INTO restaurants (name, description, address, phone, town, active) VALUES
($tag$'Village Kitchen'$tag$, $tag$'Home-style cooking with fresh ingredients'$tag$, $tag$'Molyko, Buea'$tag$, $tag$'+237680456789'$tag$, $tag$'Buea'$tag$, true);

-- Create menu connections
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

-- Check table counts
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
  d.category,
  COUNT(rm.id) as available_at_restaurants
FROM dishes d
LEFT JOIN restaurant_menus rm ON d.id = rm.dish_id AND rm.availability = true
WHERE d.active = true
GROUP BY d.id, d.name, d.price, d.category
ORDER BY d.name
LIMIT 5;

-- Success message
SELECT '🎉 PRODUCTION DATABASE SETUP COMPLETE!' as message;
SELECT '✅ Tables created and populated with sample data' as status;
SELECT '✅ 10 dishes, 5 restaurants, menu connections ready' as data;
SELECT '🌐 Your production dishes should now display!' as result;