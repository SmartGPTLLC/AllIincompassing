/*
  # Add Company Settings Tables

  1. New Tables
    - `company_settings`
      - Basic company information
      - Contact details
      - System preferences
    
    - `locations`
      - Office/clinic locations
      - Service delivery sites
    
    - `service_lines`
      - Available service types
      - Service configurations
    
    - `referring_providers`
      - Provider information
      - Contact details
    
    - `file_cabinet_settings`
      - Document categories
      - File storage preferences

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  legal_name text,
  tax_id text,
  npi_number text,
  medicaid_provider_id text,
  phone text,
  fax text,
  email text,
  website text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip_code text,
  time_zone text DEFAULT 'UTC',
  logo_url text,
  primary_color text DEFAULT '#2563eb',
  accent_color text DEFAULT '#1d4ed8',
  date_format text DEFAULT 'MM/dd/yyyy',
  time_format text DEFAULT '12h',
  default_currency text DEFAULT 'USD',
  session_duration_default integer DEFAULT 60,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL, -- clinic, home, telehealth
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip_code text,
  phone text,
  fax text,
  email text,
  is_active boolean DEFAULT true,
  operating_hours jsonb DEFAULT '{
    "monday": {"start": "09:00", "end": "17:00"},
    "tuesday": {"start": "09:00", "end": "17:00"},
    "wednesday": {"start": "09:00", "end": "17:00"},
    "thursday": {"start": "09:00", "end": "17:00"},
    "friday": {"start": "09:00", "end": "17:00"}
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_lines table
CREATE TABLE IF NOT EXISTS service_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  description text,
  rate_per_hour numeric(10,2),
  billable boolean DEFAULT true,
  requires_authorization boolean DEFAULT true,
  documentation_required boolean DEFAULT true,
  available_locations uuid[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referring_providers table
CREATE TABLE IF NOT EXISTS referring_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  credentials text[],
  npi_number text,
  facility_name text,
  specialty text,
  phone text,
  fax text,
  email text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip_code text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create file_cabinet_settings table
CREATE TABLE IF NOT EXISTS file_cabinet_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL,
  description text,
  allowed_file_types text[] DEFAULT '{".pdf",".doc",".docx",".jpg",".jpeg",".png"}',
  max_file_size_mb integer DEFAULT 10,
  retention_period_days integer,
  requires_signature boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS and create policies
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE referring_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_cabinet_settings ENABLE ROW LEVEL SECURITY;

-- Company Settings Policies
CREATE POLICY "Allow authenticated users to read company settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update company settings"
  ON company_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Locations Policies
CREATE POLICY "Allow authenticated users to read locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert locations"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update locations"
  ON locations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service Lines Policies
CREATE POLICY "Allow authenticated users to read service lines"
  ON service_lines
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert service lines"
  ON service_lines
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update service lines"
  ON service_lines
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Referring Providers Policies
CREATE POLICY "Allow authenticated users to read referring providers"
  ON referring_providers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert referring providers"
  ON referring_providers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update referring providers"
  ON referring_providers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- File Cabinet Settings Policies
CREATE POLICY "Allow authenticated users to read file cabinet settings"
  ON file_cabinet_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert file cabinet settings"
  ON file_cabinet_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update file cabinet settings"
  ON file_cabinet_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS locations_name_idx ON locations(name);
CREATE INDEX IF NOT EXISTS service_lines_name_idx ON service_lines(name);
CREATE INDEX IF NOT EXISTS referring_providers_name_idx ON referring_providers((first_name || ' ' || last_name));
CREATE INDEX IF NOT EXISTS file_cabinet_settings_category_idx ON file_cabinet_settings(category_name);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_lines_updated_at
    BEFORE UPDATE ON service_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referring_providers_updated_at
    BEFORE UPDATE ON referring_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_cabinet_settings_updated_at
    BEFORE UPDATE ON file_cabinet_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();