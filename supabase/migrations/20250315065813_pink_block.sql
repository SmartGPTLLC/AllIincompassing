/*
  # Add scheduling and availability fields

  1. Changes
    - Add service_type to therapists table
    - Add weekly_hours to therapists table
    - Add availability_hours to therapists table
    - Add service_preference to clients table
    - Add authorized_hours to clients table
    - Add availability_hours to clients table

  2. Security
    - Maintain existing RLS policies
*/

-- Add new fields to therapists table
ALTER TABLE therapists 
ADD COLUMN service_type text[] DEFAULT '{}',
ADD COLUMN weekly_hours_min integer DEFAULT 0,
ADD COLUMN weekly_hours_max integer DEFAULT 40,
ADD COLUMN availability_hours jsonb DEFAULT '{
  "monday": {"start": null, "end": null},
  "tuesday": {"start": null, "end": null},
  "wednesday": {"start": null, "end": null},
  "thursday": {"start": null, "end": null},
  "friday": {"start": null, "end": null},
  "saturday": {"start": null, "end": null}
}'::jsonb;

-- Add new fields to clients table
ALTER TABLE clients 
ADD COLUMN service_preference text[] DEFAULT '{}',
ADD COLUMN authorized_hours integer DEFAULT 0,
ADD COLUMN availability_hours jsonb DEFAULT '{
  "monday": {"start": null, "end": null},
  "tuesday": {"start": null, "end": null},
  "wednesday": {"start": null, "end": null},
  "thursday": {"start": null, "end": null},
  "friday": {"start": null, "end": null},
  "saturday": {"start": null, "end": null}
}'::jsonb;