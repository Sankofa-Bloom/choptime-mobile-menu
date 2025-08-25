-- Create payment_records table for tracking Swychr payments
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL,
  order_reference TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'XAF',
  payment_method TEXT DEFAULT 'swychr',
  status TEXT DEFAULT 'pending',
  description TEXT,
  order_data JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_records_transaction_id ON payment_records(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_order_reference ON payment_records(order_reference);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_created_at ON payment_records(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view all payment records
CREATE POLICY "Allow authenticated users to view payment records" ON payment_records
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for service role to insert payment records
CREATE POLICY "Allow service role to insert payment records" ON payment_records
  FOR INSERT WITH CHECK (true);

-- Policy for service role to update payment records
CREATE POLICY "Allow service role to update payment records" ON payment_records
  FOR UPDATE USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_payment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_records_updated_at
  BEFORE UPDATE ON payment_records
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_records_updated_at();
