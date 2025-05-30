/*
  # Add staff-specific fields to therapists table

  1. Changes
    - Add fields for staff management:
      - first_name
      - middle_name
      - last_name
      - title
      - facility
      - employee_type
      - staff_id
      - supervisor
      - status
      - npi_number
      - medicaid_id
      - practitioner_id
      - taxonomy_code
      - time_zone
      - phone
      - address fields (street, city, state, zip)

  2. Security
    - Maintain existing RLS policies
*/

-- Add new fields to therapists table
ALTER TABLE therapists 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS middle_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS facility text,
ADD COLUMN IF NOT EXISTS employee_type text,
ADD COLUMN IF NOT EXISTS staff_id text,
ADD COLUMN IF NOT EXISTS supervisor text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS npi_number text,
ADD COLUMN IF NOT EXISTS medicaid_id text,
ADD COLUMN IF NOT EXISTS practitioner_id text,
ADD COLUMN IF NOT EXISTS taxonomy_code text,
ADD COLUMN IF NOT EXISTS time_zone text DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text;