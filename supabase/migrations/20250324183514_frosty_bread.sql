/*
  # Add Authorization Fields

  1. Changes
    - Add CIN number to clients table
    - Add phone number to clients table
    - Add insurance provider relationship to authorizations
    - Add unique name constraint to insurance providers
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add CIN number and phone to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS cin_number text,
ADD COLUMN IF NOT EXISTS phone text;

-- Add insurance provider relationship to authorizations if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'authorizations'
    AND column_name = 'insurance_provider_id'
  ) THEN
    ALTER TABLE authorizations
    ADD COLUMN insurance_provider_id uuid REFERENCES insurance_providers(id);
  END IF;
END $$;

-- Add unique constraint to insurance_providers name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'insurance_providers_name_key'
  ) THEN
    ALTER TABLE insurance_providers
    ADD CONSTRAINT insurance_providers_name_key UNIQUE (name);
  END IF;
END $$;

-- Insert or update CalOptima provider
INSERT INTO insurance_providers (
  name,
  type,
  contact_phone,
  fax,
  website
)
SELECT
  'CalOptima Health',
  'Medicaid',
  '855-877-3885',
  '714-954-2300',
  'caloptima.org'
WHERE NOT EXISTS (
  SELECT 1 FROM insurance_providers WHERE name = 'CalOptima Health'
);

-- Update existing authorizations to use CalOptima
UPDATE authorizations a
SET insurance_provider_id = ip.id
FROM insurance_providers ip
WHERE ip.name = 'CalOptima Health'
AND a.insurance_provider_id IS NULL;