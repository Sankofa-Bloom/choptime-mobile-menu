-- Add payment fields to orders table for Fapshi integration
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Add payment fields to custom_orders table as well
ALTER TABLE custom_orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Create index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_custom_orders_payment_reference ON custom_orders(payment_reference);

-- Create index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_payment_status ON custom_orders(payment_status);

-- Add comments for documentation
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, paid, failed, cancelled';
COMMENT ON COLUMN orders.payment_reference IS 'Fapshi payment reference number';
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: fapshi, momo, email';

COMMENT ON COLUMN custom_orders.payment_status IS 'Payment status: pending, paid, failed, cancelled';
COMMENT ON COLUMN custom_orders.payment_reference IS 'Fapshi payment reference number';
COMMENT ON COLUMN custom_orders.payment_method IS 'Payment method used: fapshi, momo, email'; 