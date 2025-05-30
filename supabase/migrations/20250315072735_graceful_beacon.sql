/*
  # Enable RLS for therapists table

  1. Security
    - Enable RLS on therapists table
    - Add policies for authenticated users to:
      - Read all therapists
      - Insert new therapists
      - Update existing therapists
      - Delete therapists
*/

-- Enable RLS
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all therapists
CREATE POLICY "Allow authenticated users to read all therapists"
ON therapists
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert therapists
CREATE POLICY "Allow authenticated users to insert therapists"
ON therapists
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update therapists
CREATE POLICY "Allow authenticated users to update therapists"
ON therapists
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete therapists
CREATE POLICY "Allow authenticated users to delete therapists"
ON therapists
FOR DELETE
TO authenticated
USING (true);