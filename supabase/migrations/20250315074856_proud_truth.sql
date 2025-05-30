/*
  # Add RLS policies for sessions table

  1. Security Changes
    - Enable RLS on sessions table
    - Add policies for authenticated users to:
      - Insert new sessions
      - Update existing sessions
      - Delete sessions
      - Read all sessions
*/

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert sessions
CREATE POLICY "Users can insert sessions"
ON sessions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update sessions
CREATE POLICY "Users can update sessions"
ON sessions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete sessions
CREATE POLICY "Users can delete sessions"
ON sessions
FOR DELETE
TO authenticated
USING (true);

-- Allow authenticated users to read all sessions
CREATE POLICY "Users can read all sessions"
ON sessions
FOR SELECT
TO authenticated
USING (true);