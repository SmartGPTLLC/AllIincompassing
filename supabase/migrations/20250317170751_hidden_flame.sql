/*
  # Fix Foreign Key Relationships and Column References

  1. Changes
    - Drop existing foreign key constraints
    - Recreate foreign key constraints with proper references
    - Add indexes for better join performance
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing foreign key constraints
ALTER TABLE sessions 
DROP CONSTRAINT IF EXISTS sessions_client_id_fkey,
DROP CONSTRAINT IF EXISTS sessions_therapist_id_fkey;

-- Recreate foreign key constraints with proper references
ALTER TABLE sessions
ADD CONSTRAINT sessions_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES clients(id) 
  ON DELETE CASCADE,
ADD CONSTRAINT sessions_therapist_id_fkey 
  FOREIGN KEY (therapist_id) 
  REFERENCES therapists(id) 
  ON DELETE CASCADE;

-- Create indexes for better join performance
CREATE INDEX IF NOT EXISTS sessions_client_id_idx ON sessions(client_id);
CREATE INDEX IF NOT EXISTS sessions_therapist_id_idx ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS sessions_start_time_idx ON sessions(start_time);

-- Ensure proper column references
DO $$ 
BEGIN
  -- Add any missing columns that might be needed for joins
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE clients ADD COLUMN full_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'therapists' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE therapists ADD COLUMN full_name text;
  END IF;
END $$;