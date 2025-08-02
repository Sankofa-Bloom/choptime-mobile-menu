-- Add missing fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS delivery_zone_id UUID;

-- Add missing fields to custom_orders table
ALTER TABLE custom_orders 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Add comments for documentation
COMMENT ON COLUMN orders.user_email IS 'Customer email address for order notifications';
COMMENT ON COLUMN orders.delivery_zone_id IS 'Reference to delivery zone for fee calculation';
COMMENT ON COLUMN custom_orders.user_email IS 'Customer email address for order notifications'; 