-- =============================================================================
-- FIX FOREIGN KEY CONSTRAINTS FOR RESTAURANT DELETION
-- Add CASCADE DELETE to all tables that reference restaurants
-- =============================================================================

-- Fix foreign key constraint for orders table to allow restaurant deletion
-- Add CASCADE DELETE to orders table foreign key constraint for restaurant_id
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_restaurant_id_fkey,
ADD CONSTRAINT orders_restaurant_id_fkey
FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- Add CASCADE DELETE to dish_id foreign key as well for consistency
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_dish_id_fkey,
ADD CONSTRAINT orders_dish_id_fkey
FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;

-- Fix foreign key constraint for custom_orders table to allow restaurant deletion
-- Add CASCADE DELETE to custom_orders table foreign key constraint for restaurant_id
ALTER TABLE public.custom_orders
DROP CONSTRAINT IF EXISTS custom_orders_restaurant_id_fkey,
ADD CONSTRAINT custom_orders_restaurant_id_fkey
FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- This migration fixes foreign key constraints to allow proper cascading deletes
-- when restaurants or dishes are deleted, preventing orphaned order records.