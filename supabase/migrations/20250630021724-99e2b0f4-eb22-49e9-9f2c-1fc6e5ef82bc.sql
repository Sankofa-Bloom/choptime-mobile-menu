
-- First, let's add the new restaurants (without ON CONFLICT since there's no unique constraint)
INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'G&G Restaurant', 'Buea', '+237670000001', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'G&G Restaurant' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Tantie Hilary''s Spot', 'Buea', '+237670000002', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Tantie Hilary''s Spot' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Jam Rock', 'Buea', '+237670000003', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Jam Rock' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Velda''s Recipes', 'Buea', '+237670000004', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Velda''s Recipes' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Je''s Restaurant', 'Buea', '+237670000005', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Je''s Restaurant' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Top Food Restaurant', 'Buea', '+237670000006', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Top Food Restaurant' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Local Vendors', 'Buea', '+237670000007', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Local Vendors' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Onye Naija Restaurant', 'Buea', '+237670000008', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Onye Naija Restaurant' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Oxford Guest House', 'Buea', '+237670000009', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Oxford Guest House' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Students Restaurant', 'Buea', '+237670000010', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Students Restaurant' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Fork''n Fingers', 'Buea', '+237670000011', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Fork''n Fingers' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Local Bush Meat Vendors', 'Buea', '+237670000012', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Local Bush Meat Vendors' AND town = 'Buea');

INSERT INTO restaurants (name, town, contact_number, active) 
SELECT 'Traditional Vendors', 'Buea', '+237670000013', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Traditional Vendors' AND town = 'Buea');

-- Add the new dishes (without ON CONFLICT since there's no unique constraint on name)
INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Eru', 'Traditional vegetable dish with waterleaf, crayfish, and palm oil.', 'Traditional', true, false, true, '45-60 min', '2-4 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Eru');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Kati-Kati', 'Grilled chicken cooked in red oil and spices, served with corn fufu.', 'Traditional', true, true, false, '30-45 min', '1-2 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Kati-Kati');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Ekwang', 'Grated cocoyams wrapped in cocoyam leaves, simmered in palm oil sauce.', 'Traditional', true, false, true, '60-90 min', '3-5 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Ekwang');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Achu', 'Yellow soup with pounded cocoyams and meat.', 'Traditional', true, true, false, '45-60 min', '2-3 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Achu');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Ndole', 'Bitterleaf and peanut stew served with rice, plantains, or yams.', 'Traditional', true, false, false, '45-60 min', '3-4 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Ndole');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Koki', 'Steamed pudding of ground black-eyed peas, often wrapped in banana leaves.', 'Traditional', false, false, true, '30-45 min', '2-3 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Koki');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Pork Pepper Soup', 'Spicy broth made with pork, country onions, and njangsa.', 'Soup', false, true, false, '60-90 min', '2-3 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Pork Pepper Soup');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Kwa Coco', 'Steamed grated cocoyam, often served with spicy banga soup.', 'Traditional', false, true, true, '30-45 min', '1-2 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Kwa Coco');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Ogbono Soup', 'Nigerian-style draw soup made from wild mango seeds and assorted meat.', 'Soup', false, false, false, '45-60 min', '3-4 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Ogbono Soup');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Bongo (Mbongo Tchobi)', 'Dark, spicy stew made with traditional spices and smoked fish.', 'Traditional', false, true, false, '60-90 min', '2-3 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Bongo (Mbongo Tchobi)');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Rice', 'Fried, jollof, or plain rice served with various sauces and proteins.', 'Rice', true, false, false, '20-30 min', '1-2 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Rice');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Bush Meat', 'Grilled or stewed wild meat delicacy, usually seasonal.', 'Grilled', false, false, false, '45-60 min', '1-2 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Bush Meat');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Grilled Chicken', 'Marinated chicken grilled to perfection with local spices.', 'Grilled', true, false, false, '30-45 min', '1-2 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Grilled Chicken');

INSERT INTO dishes (name, description, category, is_popular, is_spicy, is_vegetarian, cook_time, serves, active, admin_created) 
SELECT 'Mpu Fish', 'Steamed freshwater fish seasoned and wrapped in leaves.', 'Traditional', false, false, false, '30-45 min', '1-2 people', true, true
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Mpu Fish');

-- Now let's create the restaurant menu mappings with prices
-- Eru restaurants
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 2500, true
FROM restaurants r, dishes d
WHERE r.name IN ('G&G Restaurant', 'Tantie Hilary''s Spot', 'Jam Rock')
AND d.name = 'Eru'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);

-- Kati-Kati restaurants  
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 3000, true
FROM restaurants r, dishes d
WHERE r.name IN ('G&G Restaurant', 'Jam Rock', 'Tantie Hilary''s Spot')
AND d.name = 'Kati-Kati'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);

-- Ekwang restaurants
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 3500, true
FROM restaurants r, dishes d
WHERE r.name IN ('Velda''s Recipes', 'Je''s Restaurant', 'Tantie Hilary''s Spot')
AND d.name = 'Ekwang'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);

-- Achu restaurants
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 4000, true
FROM restaurants r, dishes d
WHERE r.name IN ('Tantie Hilary''s Spot')
AND d.name = 'Achu'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);

-- Ndole restaurants
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 3000, true
FROM restaurants r, dishes d
WHERE r.name IN ('Top Food Restaurant')
AND d.name = 'Ndole'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);

-- Koki restaurants
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 1500, true
FROM restaurants r, dishes d
WHERE r.name IN ('Top Food Restaurant', 'Local Vendors')
AND d.name = 'Koki'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);

-- Pork Pepper Soup restaurants
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 4500, true
FROM restaurants r, dishes d
WHERE r.name IN ('Velda''s Recipes')
AND d.name = 'Pork Pepper Soup'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);

-- Kwa Coco restaurants (no restaurants available for this dish currently)

-- Ogbono Soup restaurants
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 3500, true
FROM restaurants r, dishes d
WHERE r.name = 'Onye Naija Restaurant'
AND d.name = 'Ogbono Soup'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);

-- Rice restaurants
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 1500, true
FROM restaurants r, dishes d
WHERE r.name IN ('Oxford Guest House', 'Students Restaurant', 'Fork''n Fingers')
AND d.name = 'Rice'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);

-- Bush Meat restaurants
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 6000, true
FROM restaurants r, dishes d
WHERE r.name IN ('Local Bush Meat Vendors')
AND d.name = 'Bush Meat'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);

-- Grilled Chicken restaurants
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 3500, true
FROM restaurants r, dishes d
WHERE r.name IN ('G&G Restaurant', 'Jam Rock')
AND d.name = 'Grilled Chicken'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);

-- Mpu Fish restaurants
INSERT INTO restaurant_menus (restaurant_id, dish_id, price, availability)
SELECT r.id, d.id, 4000, true
FROM restaurants r, dishes d
WHERE r.name IN ('Traditional Vendors')
AND d.name = 'Mpu Fish'
AND r.town = 'Buea'
AND NOT EXISTS (
    SELECT 1 FROM restaurant_menus rm 
    WHERE rm.restaurant_id = r.id AND rm.dish_id = d.id
);
