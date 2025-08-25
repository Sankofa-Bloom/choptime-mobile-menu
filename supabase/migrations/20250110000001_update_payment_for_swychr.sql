-- Update payment fields to reflect Swychr as the primary payment method
-- Update comments to reflect Swychr as primary payment method
COMMENT ON COLUMN orders.payment_reference IS 'Swychr payment transaction ID';
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: swychr (primary)';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, confirmed, completed, failed, cancelled';

COMMENT ON COLUMN custom_orders.payment_reference IS 'Swychr payment transaction ID';
COMMENT ON COLUMN custom_orders.payment_method IS 'Payment method used: swychr (primary)';
COMMENT ON COLUMN custom_orders.payment_status IS 'Payment status: pending, confirmed, completed, failed, cancelled';

-- Add customer_phone column if it doesn't exist (handles case where momo_phone never existed)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

ALTER TABLE custom_orders 
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- If momo_phone exists, rename it to customer_phone, otherwise skip
DO $$
BEGIN
  -- Check and rename in orders table
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'momo_phone') THEN
    ALTER TABLE orders RENAME COLUMN momo_phone TO customer_phone;
  END IF;
  
  -- Check and rename in custom_orders table  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_orders' AND column_name = 'momo_phone') THEN
    ALTER TABLE custom_orders RENAME COLUMN momo_phone TO customer_phone;
  END IF;
END $$;

-- Update comments for renamed fields
COMMENT ON COLUMN orders.customer_phone IS 'Customer phone number for payment and contact';
COMMENT ON COLUMN custom_orders.customer_phone IS 'Customer phone number for payment and contact';

-- Add email field for Swychr payments
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

ALTER TABLE custom_orders 
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Add comments for email fields
COMMENT ON COLUMN orders.customer_email IS 'Customer email address for payment notifications';
COMMENT ON COLUMN custom_orders.customer_email IS 'Customer email address for payment notifications';

-- Update indexes
DROP INDEX IF EXISTS idx_orders_momo_phone;
DROP INDEX IF EXISTS idx_custom_orders_momo_phone;

CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_custom_orders_customer_phone ON custom_orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_custom_orders_customer_email ON custom_orders(customer_email);
