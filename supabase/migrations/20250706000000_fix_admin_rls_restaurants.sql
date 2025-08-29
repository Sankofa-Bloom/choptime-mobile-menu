-- =============================================================================
-- FIX ADMIN RLS POLICIES FOR RESTAURANTS
-- Add admin access policies to restaurants table to allow admins to manage all restaurants
-- =============================================================================

-- Drop the existing restrictive policy for restaurants
DROP POLICY IF EXISTS "Restaurants can manage their own data" ON public.restaurants;

-- Create new policies that allow both restaurant owners and admins to manage restaurants
DROP POLICY IF EXISTS "Restaurant owners and admins can manage restaurants" ON public.restaurants;
CREATE POLICY "Restaurant owners and admins can manage restaurants" ON public.restaurants
  FOR ALL USING (
    -- Restaurant owners can manage their own data
    auth.uid() = auth_id
    OR
    -- Admins can manage all restaurants
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email' AND active = true
    )
  );

-- Keep the existing policy for public read access (don't recreate if it exists)
-- CREATE POLICY "Anyone can view restaurants" ON public.restaurants
--   FOR SELECT USING (true);

-- Also add admin access to restaurant_menus if not already present
DROP POLICY IF EXISTS "Restaurants can manage their own menu" ON public.restaurant_menus;

DROP POLICY IF EXISTS "Restaurant owners and admins can manage restaurant menus" ON public.restaurant_menus;
CREATE POLICY "Restaurant owners and admins can manage restaurant menus" ON public.restaurant_menus
  FOR ALL USING (
    -- Restaurant owners can manage their own menu
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = restaurant_menus.restaurant_id
      AND restaurants.auth_id = auth.uid()
    )
    OR
    -- Admins can manage all restaurant menus
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = auth.jwt() ->> 'email' AND active = true
    )
  );

-- Keep the existing policy for public read access (don't recreate if it exists)
-- CREATE POLICY "Anyone can view restaurant menus" ON public.restaurant_menus
--   FOR SELECT USING (true);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- This migration adds admin access policies to the restaurants and restaurant_menus tables,
-- allowing admin users to perform CRUD operations on all restaurant data.