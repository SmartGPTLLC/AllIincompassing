/*
  # Add Additional Client Fields

  1. Changes
    - Add first_name, middle_name, last_name fields to clients table
    - Add gender field to clients table
    - Add client_id field to clients table
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add new fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS middle_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS client_id text;