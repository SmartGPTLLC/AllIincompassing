/*
  # Fix Time Intervals for 15-minute Scheduling

  1. Changes
    - Add validation function for 15-minute intervals
    - Add constraints to availability tables
    - Update default availability hours to use 15-minute intervals
    
  2. Security
    - Maintain existing RLS policies
*/

-- Create or replace function to validate 15-minute intervals
CREATE OR REPLACE FUNCTION validate_time_interval(time_value time)
RETURNS boolean AS $$
BEGIN
  RETURN EXTRACT(MINUTE FROM time_value) IN (0, 15, 30, 45);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraints to client_availability
ALTER TABLE client_availability
DROP CONSTRAINT IF EXISTS valid_time_interval_start,
DROP CONSTRAINT IF EXISTS valid_time_interval_end,
ADD CONSTRAINT valid_time_interval_start CHECK (validate_time_interval(start_time)),
ADD CONSTRAINT valid_time_interval_end CHECK (validate_time_interval(end_time));

-- Add check constraints to therapist_availability
ALTER TABLE therapist_availability
DROP CONSTRAINT IF EXISTS valid_time_interval_start,
DROP CONSTRAINT IF EXISTS valid_time_interval_end,
ADD CONSTRAINT valid_time_interval_start CHECK (validate_time_interval(start_time)),
ADD CONSTRAINT valid_time_interval_end CHECK (validate_time_interval(end_time));

-- Update existing records to conform to 15-minute intervals
UPDATE client_availability
SET 
  start_time = date_trunc('hour', start_time) + 
    INTERVAL '15 min' * ROUND(EXTRACT(MINUTE FROM start_time) / 15),
  end_time = date_trunc('hour', end_time) + 
    INTERVAL '15 min' * ROUND(EXTRACT(MINUTE FROM end_time) / 15);

UPDATE therapist_availability
SET 
  start_time = date_trunc('hour', start_time) + 
    INTERVAL '15 min' * ROUND(EXTRACT(MINUTE FROM start_time) / 15),
  end_time = date_trunc('hour', end_time) + 
    INTERVAL '15 min' * ROUND(EXTRACT(MINUTE FROM end_time) / 15);

-- Update default availability hours for clients and therapists
UPDATE clients
SET availability_hours = jsonb_build_object(
  'monday', jsonb_build_object('start', '06:00', 'end', '21:00'),
  'tuesday', jsonb_build_object('start', '06:00', 'end', '21:00'),
  'wednesday', jsonb_build_object('start', '06:00', 'end', '21:00'),
  'thursday', jsonb_build_object('start', '06:00', 'end', '21:00'),
  'friday', jsonb_build_object('start', '06:00', 'end', '21:00'),
  'saturday', jsonb_build_object('start', '06:00', 'end', '21:00')
);

UPDATE therapists
SET availability_hours = jsonb_build_object(
  'monday', jsonb_build_object('start', '06:00', 'end', '21:00'),
  'tuesday', jsonb_build_object('start', '06:00', 'end', '21:00'),
  'wednesday', jsonb_build_object('start', '06:00', 'end', '21:00'),
  'thursday', jsonb_build_object('start', '06:00', 'end', '21:00'),
  'friday', jsonb_build_object('start', '06:00', 'end', '21:00'),
  'saturday', jsonb_build_object('start', '06:00', 'end', '21:00')
);

-- Update default column definitions
ALTER TABLE clients 
ALTER COLUMN availability_hours SET DEFAULT '{
  "monday": {"start": "06:00", "end": "21:00"},
  "tuesday": {"start": "06:00", "end": "21:00"},
  "wednesday": {"start": "06:00", "end": "21:00"},
  "thursday": {"start": "06:00", "end": "21:00"},
  "friday": {"start": "06:00", "end": "21:00"},
  "saturday": {"start": "06:00", "end": "21:00"}
}'::jsonb;

ALTER TABLE therapists 
ALTER COLUMN availability_hours SET DEFAULT '{
  "monday": {"start": "06:00", "end": "21:00"},
  "tuesday": {"start": "06:00", "end": "21:00"},
  "wednesday": {"start": "06:00", "end": "21:00"},
  "thursday": {"start": "06:00", "end": "21:00"},
  "friday": {"start": "06:00", "end": "21:00"},
  "saturday": {"start": "06:00", "end": "21:00"}
}'::jsonb;