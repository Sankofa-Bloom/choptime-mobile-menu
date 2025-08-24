-- Update payment fields to reflect MTN MoMo as the primary payment method
-- Update comments to reflect MTN MoMo as primary payment method
COMMENT ON COLUMN orders.payment_reference IS 'MTN MoMo payment reference number';
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: mtn_momo (primary)';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, confirmed, completed, failed, cancelled';

COMMENT ON COLUMN custom_orders.payment_reference IS 'MTN MoMo payment reference number';
COMMENT ON COLUMN custom_orders.payment_method IS 'Payment method used: mtn_momo (primary)';
COMMENT ON COLUMN custom_orders.payment_status IS 'Payment status: pending, confirmed, completed, failed, cancelled';

-- Add additional fields that might be useful for MTN MoMo
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS momo_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_initiated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE custom_orders 
ADD COLUMN IF NOT EXISTS momo_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_initiated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_orders_momo_phone ON orders(momo_phone);
CREATE INDEX IF NOT EXISTS idx_custom_orders_momo_phone ON custom_orders(momo_phone);
CREATE INDEX IF NOT EXISTS idx_orders_payment_initiated ON orders(payment_initiated_at);
CREATE INDEX IF NOT EXISTS idx_custom_orders_payment_initiated ON custom_orders(payment_initiated_at);

-- Add comments for new fields
COMMENT ON COLUMN orders.momo_phone IS 'MTN MoMo phone number used for payment';
COMMENT ON COLUMN orders.payment_initiated_at IS 'Timestamp when payment was initiated';
COMMENT ON COLUMN orders.payment_completed_at IS 'Timestamp when payment was completed';

COMMENT ON COLUMN custom_orders.momo_phone IS 'MTN MoMo phone number used for payment';
COMMENT ON COLUMN custom_orders.payment_initiated_at IS 'Timestamp when payment was initiated';
COMMENT ON COLUMN custom_orders.payment_completed_at IS 'Timestamp when payment was completed';
