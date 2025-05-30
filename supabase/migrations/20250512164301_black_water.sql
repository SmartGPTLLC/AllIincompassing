/*
  # Update Default Availability Hours

  1. Changes
    - Update default availability hours for clients and therapists
    - Set start time to 6am and end time to 9pm
    - Update existing records with new hours
    
  2. Security
    - Maintain existing RLS policies
*/

-- Update default availability hours for new clients
ALTER TABLE clients 
ALTER COLUMN availability_hours SET DEFAULT '{
  "monday": {"start": "06:00", "end": "21:00"},
  "tuesday": {"start": "06:00", "end": "21:00"},
  "wednesday": {"start": "06:00", "end": "21:00"},
  "thursday": {"start": "06:00", "end": "21:00"},
  "friday": {"start": "06:00", "end": "21:00"},
  "saturday": {"start": "06:00", "end": "21:00"}
}'::jsonb;

-- Update default availability hours for new therapists
ALTER TABLE therapists 
ALTER COLUMN availability_hours SET DEFAULT '{
  "monday": {"start": "06:00", "end": "21:00"},
  "tuesday": {"start": "06:00", "end": "21:00"},
  "wednesday": {"start": "06:00", "end": "21:00"},
  "thursday": {"start": "06:00", "end": "21:00"},
  "friday": {"start": "06:00", "end": "21:00"},
  "saturday": {"start": "06:00", "end": "21:00"}
}'::jsonb;

-- Update existing client records
UPDATE clients
SET availability_hours = '{
  "monday": {"start": "06:00", "end": "21:00"},
  "tuesday": {"start": "06:00", "end": "21:00"},
  "wednesday": {"start": "06:00", "end": "21:00"},
  "thursday": {"start": "06:00", "end": "21:00"},
  "friday": {"start": "06:00", "end": "21:00"},
  "saturday": {"start": "06:00", "end": "21:00"}
}'::jsonb
WHERE availability_hours IS NOT NULL;

-- Update existing therapist records
UPDATE therapists
SET availability_hours = '{
  "monday": {"start": "06:00", "end": "21:00"},
  "tuesday": {"start": "06:00", "end": "21:00"},
  "wednesday": {"start": "06:00", "end": "21:00"},
  "thursday": {"start": "06:00", "end": "21:00"},
  "friday": {"start": "06:00", "end": "21:00"},
  "saturday": {"start": "06:00", "end": "21:00"}
}'::jsonb
WHERE availability_hours IS NOT NULL;