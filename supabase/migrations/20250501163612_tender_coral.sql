/*
  # Add RBT and BCBA number fields to therapists table

  1. Changes
    - Add RBT number field to therapists table
    - Add BCBA number field to therapists table
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add new fields to therapists table
ALTER TABLE therapists 
ADD COLUMN IF NOT EXISTS rbt_number text,
ADD COLUMN IF NOT EXISTS bcba_number text;

-- Add comments
COMMENT ON COLUMN therapists.rbt_number IS 'Registered Behavior Technician certification number';
COMMENT ON COLUMN therapists.bcba_number IS 'Board Certified Behavior Analyst certification number';