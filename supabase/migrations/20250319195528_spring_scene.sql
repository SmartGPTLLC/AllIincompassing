/*
  # Add Client Scheduling Columns

  1. Changes
    - Add columns for tracking service delivery locations
    - Add columns for authorized and provided hours
    - Add column for unscheduled hours
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS in_clinic boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS in_home boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS in_school boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS daycare_after_school boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS authorized_hours_per_month integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS hours_provided_per_month integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS unscheduled_hours integer
  GENERATED ALWAYS AS (authorized_hours_per_month - hours_provided_per_month) STORED;

-- Update existing clients to set service delivery locations based on service_preference
UPDATE clients
SET 
  in_clinic = service_preference @> ARRAY['In clinic'],
  in_home = service_preference @> ARRAY['In home'],
  in_school = service_preference @> ARRAY['In school'],
  daycare_after_school = service_preference @> ARRAY['Daycare/After School'];

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_clients_unscheduled_hours ON clients(unscheduled_hours);

-- Add comment explaining the columns
COMMENT ON COLUMN clients.in_clinic IS 'Whether client receives services in clinic';
COMMENT ON COLUMN clients.in_home IS 'Whether client receives services at home';
COMMENT ON COLUMN clients.in_school IS 'Whether client receives services in school';
COMMENT ON COLUMN clients.daycare_after_school IS 'Whether client receives services in daycare/after school program';
COMMENT ON COLUMN clients.authorized_hours_per_month IS 'Total authorized service hours per month';
COMMENT ON COLUMN clients.hours_provided_per_month IS 'Actual service hours provided this month';
COMMENT ON COLUMN clients.unscheduled_hours IS 'Remaining available hours (authorized - provided)';