/*
  # Fix Company Settings RLS Policies

  1. Security Changes
    - Enable RLS on company_settings table
    - Add policies for authenticated users to:
      - Read company settings
      - Insert company settings (if none exist)
      - Update existing company settings
    
  2. Notes
    - Only allow one company settings record
    - All authenticated users can read settings
    - All authenticated users can update settings
    - Insert only allowed when no settings exist
    - Check if policies exist before creating them
*/

-- Enable RLS (idempotent)
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop read policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_settings' 
    AND policyname = 'Allow authenticated users to read company settings'
  ) THEN
    DROP POLICY "Allow authenticated users to read company settings" ON company_settings;
  END IF;

  -- Drop insert policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_settings' 
    AND policyname = 'Allow authenticated users to insert company settings'
  ) THEN
    DROP POLICY "Allow authenticated users to insert company settings" ON company_settings;
  END IF;

  -- Drop update policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_settings' 
    AND policyname = 'Allow authenticated users to update company settings'
  ) THEN
    DROP POLICY "Allow authenticated users to update company settings" ON company_settings;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Allow authenticated users to read company settings"
ON company_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert company settings"
ON company_settings
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM company_settings
  )
);

CREATE POLICY "Allow authenticated users to update company settings"
ON company_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert default settings if none exist
INSERT INTO company_settings (
  company_name,
  legal_name,
  tax_id,
  npi_number,
  medicaid_provider_id,
  phone,
  fax,
  email,
  website,
  address_line1,
  address_line2,
  city,
  state,
  zip_code,
  time_zone,
  logo_url,
  primary_color,
  accent_color,
  date_format,
  time_format,
  default_currency,
  session_duration_default
)
SELECT
  'My Company' as company_name,
  NULL as legal_name,
  NULL as tax_id,
  NULL as npi_number,
  NULL as medicaid_provider_id,
  NULL as phone,
  NULL as fax,
  NULL as email,
  NULL as website,
  NULL as address_line1,
  NULL as address_line2,
  NULL as city,
  NULL as state,
  NULL as zip_code,
  'UTC' as time_zone,
  NULL as logo_url,
  '#2563eb' as primary_color,
  '#1d4ed8' as accent_color,
  'MM/dd/yyyy' as date_format,
  '12h' as time_format,
  'USD' as default_currency,
  60 as session_duration_default
WHERE NOT EXISTS (
  SELECT 1 FROM company_settings
);