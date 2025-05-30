/*
  # Add Client Onboarding Fields

  1. Changes
    - Add parent/guardian information fields to clients table
    - Add fields for tracking referral sources
    - Add fields for document storage
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add parent/guardian information fields to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS parent1_first_name text,
ADD COLUMN IF NOT EXISTS parent1_last_name text,
ADD COLUMN IF NOT EXISTS parent1_phone text,
ADD COLUMN IF NOT EXISTS parent1_email text,
ADD COLUMN IF NOT EXISTS parent1_relationship text,
ADD COLUMN IF NOT EXISTS parent2_first_name text,
ADD COLUMN IF NOT EXISTS parent2_last_name text,
ADD COLUMN IF NOT EXISTS parent2_phone text,
ADD COLUMN IF NOT EXISTS parent2_email text,
ADD COLUMN IF NOT EXISTS parent2_relationship text;

-- Add referral source tracking
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS referral_source text;

-- Add document tracking fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'documents'
  ) THEN
    ALTER TABLE clients ADD COLUMN documents jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN clients.parent1_first_name IS 'Primary parent/guardian first name';
COMMENT ON COLUMN clients.parent1_last_name IS 'Primary parent/guardian last name';
COMMENT ON COLUMN clients.parent1_phone IS 'Primary parent/guardian phone number';
COMMENT ON COLUMN clients.parent1_email IS 'Primary parent/guardian email';
COMMENT ON COLUMN clients.parent1_relationship IS 'Primary parent/guardian relationship to client';
COMMENT ON COLUMN clients.parent2_first_name IS 'Secondary parent/guardian first name';
COMMENT ON COLUMN clients.parent2_last_name IS 'Secondary parent/guardian last name';
COMMENT ON COLUMN clients.parent2_phone IS 'Secondary parent/guardian phone number';
COMMENT ON COLUMN clients.parent2_email IS 'Secondary parent/guardian email';
COMMENT ON COLUMN clients.parent2_relationship IS 'Secondary parent/guardian relationship to client';
COMMENT ON COLUMN clients.referral_source IS 'How the client was referred';
COMMENT ON COLUMN clients.documents IS 'Array of document metadata for client files';