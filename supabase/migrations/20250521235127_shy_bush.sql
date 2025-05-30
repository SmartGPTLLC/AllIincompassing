/*
  # Update Time Intervals for Scheduling

  1. Changes
    - Modify AvailabilityEditor to use 15-minute intervals
    - Update time selection options
    - Fix time validation in constraints
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add constraint validation function for 15-minute intervals
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