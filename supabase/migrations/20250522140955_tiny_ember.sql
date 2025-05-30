/*
  # Add Stripe Customers Table

  1. New Tables
    - `stripe_customers`
      - Links Supabase clients to Stripe customers
      - Stores Stripe customer IDs
    
  2. Security
    - Enable RLS
    - Add policies for admin access
*/

-- Create stripe_customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  customer_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id),
  UNIQUE(customer_id)
);

-- Enable RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Stripe customers are viewable by admin"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (auth.user_has_role('admin'));

CREATE POLICY "Stripe customers can be managed by admin"
  ON stripe_customers
  FOR ALL
  TO authenticated
  USING (auth.user_has_role('admin'))
  WITH CHECK (auth.user_has_role('admin'));

-- Add updated_at trigger
CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_stripe_customers_client_id ON stripe_customers(client_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id ON stripe_customers(customer_id);