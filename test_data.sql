-- Test Data for ChopTym Mobile Menu
-- This file contains test data for development and testing purposes

-- =============================================================================
-- TEST RESTAURANT
-- =============================================================================

-- Insert test restaurant
INSERT INTO restaurants (
    id,
    name,
    town,
    contact_number,
    mtn_number,
    orange_number,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Test Restaurant - Free Food',
    'Limbe',
    '+237670416449',
    '+237670416449',
    '+237670416449',
    NOW(),
    NOW()
);

-- =============================================================================
-- TEST DISHES
-- =============================================================================

-- Insert test dish (FREE)
INSERT INTO dishes (
    id,
    name,
    description,
    category,
    image_url,
    is_popular,
    is_spicy,
    is_vegetarian,
    cook_time,
    serves,
    active,
    admin_created,
    created_at
) VALUES (
    gen_random_uuid(),
    'Free Test Dish',
    'A completely free test dish for development and testing. This dish costs 0 XAF - you only pay the delivery fee!',
    'Traditional',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    true,
    false,
    false,
    '10 min',
    '1-2 people',
    true,
    true,
    NOW()
);

-- Insert another test dish (also FREE)
INSERT INTO dishes (
    id,
    name,
    description,
    category,
    image_url,
    is_popular,
    is_spicy,
    is_vegetarian,
    cook_time,
    serves,
    active,
    admin_created,
    created_at
) VALUES (
    gen_random_uuid(),
    'Free Test Dessert',
    'A free test dessert for development and testing. Perfect for testing the payment flow with zero food cost!',
    'Traditional',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop',
    true,
    false,
    true,
    '5 min',
    '1 person',
    true,
    true,
    NOW()
);

-- =============================================================================
-- RESTAURANT MENUS (Link dishes to restaurants with prices)
-- =============================================================================

-- Link the free test dish to the test restaurant with 0 price
INSERT INTO restaurant_menus (
    id,
    restaurant_id,
    dish_id,
    price,
    availability,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM restaurants WHERE name = 'Test Restaurant - Free Food' LIMIT 1),
    (SELECT id FROM dishes WHERE name = 'Free Test Dish' LIMIT 1),
    0, -- FREE DISH
    true,
    NOW()
);

-- Link the free test dessert to the test restaurant with 0 price
INSERT INTO restaurant_menus (
    id,
    restaurant_id,
    dish_id,
    price,
    availability,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM restaurants WHERE name = 'Test Restaurant - Free Food' LIMIT 1),
    (SELECT id FROM dishes WHERE name = 'Free Test Dessert' LIMIT 1),
    0, -- FREE DISH
    true,
    NOW()
);

-- =============================================================================
-- DELIVERY ZONES FOR LIMBE
-- =============================================================================

-- Insert delivery zones for Limbe (if they don't exist)
INSERT INTO delivery_zones (
    id,
    town,
    zone_name,
    distance_min,
    distance_max,
    fee,
    active,
    created_at
) VALUES 
(
    gen_random_uuid(),
    'Limbe',
    'Mile 1-2 (0-3km)',
    0,
    3,
    500, -- 500 XAF delivery fee for close areas
    true,
    NOW()
),
(
    gen_random_uuid(),
    'Limbe',
    'Mile 3-4 (3-6km)',
    3,
    6,
    800, -- 800 XAF delivery fee for medium distance
    true,
    NOW()
),
(
    gen_random_uuid(),
    'Limbe',
    'Down Beach & Beyond (6km+)',
    6,
    20,
    1200, -- 1200 XAF delivery fee for far areas
    true,
    NOW()
) ON CONFLICT (town, zone_name) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Query to verify the test data was inserted correctly
-- Uncomment and run these queries to verify the data:

/*
-- Check test restaurant
SELECT 
    id,
    name,
    town,
    contact_number,
    active
FROM restaurants 
WHERE name = 'Test Restaurant - Free Food';

-- Check test dishes
SELECT 
    d.id,
    d.name,
    d.description,
    d.category,
    d.active,
    d.admin_created
FROM dishes d
WHERE d.name IN ('Free Test Dish', 'Free Test Dessert');

-- Check restaurant menus (prices)
SELECT 
    rm.id,
    r.name as restaurant_name,
    d.name as dish_name,
    rm.price,
    rm.availability
FROM restaurant_menus rm
JOIN restaurants r ON rm.restaurant_id = r.id
JOIN dishes d ON rm.dish_id = d.id
WHERE r.name = 'Test Restaurant - Free Food';

-- Check delivery zones for Limbe
SELECT 
    id,
    town,
    zone_name,
    distance_min,
    distance_max,
    fee,
    active
FROM delivery_zones 
WHERE town = 'Limbe';
*/

-- =============================================================================
-- NOTES
-- =============================================================================
/*
This test data creates:
1. A test restaurant called "Test Restaurant - Free Food" in Limbe
2. Two free dishes (0 XAF each) in the restaurant menu
3. Delivery zones for Limbe with different fee tiers:
   - Mile 1-2 (0-3km): 500 XAF
   - Mile 3-4 (3-6km): 800 XAF  
   - Down Beach & Beyond (6km+): 1200 XAF

The dishes are completely free (0 XAF), so users will only pay:
- 0 XAF for the food (dishes are free)
- 500-1200 XAF for delivery (depending on location)
- Total: 500-1200 XAF (delivery fee only)

This is perfect for testing the payment flow without requiring users to pay for food.
*/ 