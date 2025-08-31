-- Migration: Update Limbe delivery zones with specific localities
-- This migration replaces the old distance-based zones with locality-based zones for Limbe

-- First, remove existing Limbe zones
DELETE FROM public.delivery_zones WHERE town = 'Limbe';

-- Add new locality-based zones for Limbe
INSERT INTO public.delivery_zones (town, zone_name, distance_min, distance_max, fee, active) VALUES
-- Zone A - 1000 FCFA
('Limbe', 'Zone A (Ngueme, Isololo, Carata, Mile 4, Saker Junction, Down Beach)', 0, 10, 1000, true),
-- Zone B - 800 FCFA  
('Limbe', 'Zone B (Red Cross, Bundes, Middle Farms, Church Street, Busumbu, Behind GHS)', 0, 10, 800, true),
-- Zone C - 600 FCFA
('Limbe', 'Zone C (Mile 2)', 0, 10, 600, true);

-- Create or replace the delivery fee calculation function to handle locality-based matching
CREATE OR REPLACE FUNCTION calculate_delivery_fee(town_name TEXT, location_description TEXT)
RETURNS TABLE(zone_id UUID, zone_name TEXT, fee INTEGER) AS $$
DECLARE
  zone_record RECORD;
  locality_lower TEXT;
BEGIN
  -- Convert location description to lowercase for case-insensitive matching
  locality_lower := LOWER(TRIM(location_description));
  
  -- Handle Limbe with specific locality matching
  IF LOWER(town_name) = 'limbe' THEN
    -- Zone A localities (1000 FCFA)
    IF locality_lower = ANY(ARRAY['ngueme', 'isololo', 'carata', 'mile 4', 'mile4', 'saker junction', 'saker', 'down beach', 'downbeach']) THEN
      SELECT dz.id, dz.zone_name, dz.fee INTO zone_record
      FROM public.delivery_zones dz
      WHERE LOWER(dz.town) = 'limbe' AND dz.fee = 1000 AND dz.active = true
      LIMIT 1;
    
    -- Zone B localities (800 FCFA)
    ELSIF locality_lower = ANY(ARRAY['red cross', 'redcross', 'bundes', 'middle farms', 'middlefarms', 'church street', 'churchstreet', 'busumbu', 'behind ghs', 'behindghs', 'ghs']) THEN
      SELECT dz.id, dz.zone_name, dz.fee INTO zone_record
      FROM public.delivery_zones dz
      WHERE LOWER(dz.town) = 'limbe' AND dz.fee = 800 AND dz.active = true
      LIMIT 1;
    
    -- Zone C localities (600 FCFA)
    ELSIF locality_lower = ANY(ARRAY['mile 2', 'mile2']) THEN
      SELECT dz.id, dz.zone_name, dz.fee INTO zone_record
      FROM public.delivery_zones dz
      WHERE LOWER(dz.town) = 'limbe' AND dz.fee = 600 AND dz.active = true
      LIMIT 1;
    
    -- Default to cheapest zone if locality not found (Zone C)
    ELSE
      SELECT dz.id, dz.zone_name, dz.fee INTO zone_record
      FROM public.delivery_zones dz
      WHERE LOWER(dz.town) = 'limbe' AND dz.active = true
      ORDER BY dz.fee ASC
      LIMIT 1;
    END IF;
  
  -- Handle other towns (like Buea) with existing logic
  ELSE
    -- Simple text-based logic for other towns
    SELECT dz.id, dz.zone_name, dz.fee INTO zone_record
    FROM public.delivery_zones dz
    WHERE LOWER(dz.town) = LOWER(town_name) AND dz.active = true
    ORDER BY dz.distance_min
    LIMIT 1;
    
    -- Check for keywords that might indicate distance for other towns
    IF location_description ILIKE '%outskirt%' OR location_description ILIKE '%far%' OR 
       location_description ILIKE '%beyond%' OR location_description ILIKE '%distant%' THEN
      SELECT dz.id, dz.zone_name, dz.fee INTO zone_record
      FROM public.delivery_zones dz
      WHERE LOWER(dz.town) = LOWER(town_name) AND dz.active = true
      ORDER BY dz.distance_max DESC
      LIMIT 1;
    ELSIF location_description ILIKE '%center%' OR location_description ILIKE '%town%' OR
          location_description ILIKE '%main%' THEN
      SELECT dz.id, dz.zone_name, dz.fee INTO zone_record
      FROM public.delivery_zones dz
      WHERE LOWER(dz.town) = LOWER(town_name) AND dz.active = true
      ORDER BY dz.distance_min
      LIMIT 1;
    END IF;
  END IF;
  
  -- Return the zone information
  RETURN QUERY SELECT zone_record.id, zone_record.zone_name, zone_record.fee;
END;
$$ LANGUAGE plpgsql;

-- Create a helper function to get available localities for a town
CREATE OR REPLACE FUNCTION get_limbe_localities()
RETURNS TABLE(locality TEXT, zone_name TEXT, fee INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(ARRAY['Ngueme', 'Isololo', 'Carata', 'Mile 4', 'Saker Junction', 'Down Beach']) as locality,
    'Zone A' as zone_name,
    1000 as fee
  UNION ALL
  SELECT 
    unnest(ARRAY['Red Cross', 'Bundes', 'Middle Farms', 'Church Street', 'Busumbu', 'Behind GHS']) as locality,
    'Zone B' as zone_name,
    800 as fee
  UNION ALL
  SELECT 
    unnest(ARRAY['Mile 2']) as locality,
    'Zone C' as zone_name,
    600 as fee;
END;
$$ LANGUAGE plpgsql;

-- Update any existing orders with Limbe to use new zone structure
UPDATE public.orders 
SET delivery_zone_id = (
  SELECT id FROM public.delivery_zones 
  WHERE town = 'Limbe' AND fee = 800 AND active = true 
  LIMIT 1
)
WHERE delivery_zone_id IS NULL AND user_location ILIKE '%limbe%';

-- Update the updated_at timestamp for delivery_zones table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at on delivery_zones
CREATE TRIGGER update_delivery_zones_updated_at
BEFORE UPDATE ON public.delivery_zones
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
