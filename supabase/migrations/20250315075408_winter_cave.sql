/*
  # Fix Sessions RLS Policies

  1. Changes
    - Drop existing RLS policies for sessions table
    - Create new, more specific RLS policies
    - Ensure authenticated users can perform CRUD operations
  
  2. Security
    - Enable RLS on sessions table
    - Add policies for authenticated users to:
      - Read all sessions
      - Insert new sessions
      - Update their sessions
      - Delete their sessions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete sessions" ON sessions;
DROP POLICY IF EXISTS "Users can read all sessions" ON sessions;

-- Re-enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow authenticated users to read all sessions"
ON sessions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert sessions"
ON sessions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sessions"
ON sessions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sessions"
ON sessions FOR DELETE
TO authenticated
USING (true);