/*
  # Enable RLS and add policies for clients table

  1. Security
    - Enable RLS on clients table
    - Add policies for authenticated users to:
      - Read all clients
      - Insert new clients
      - Update existing clients
      - Delete clients
*/

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all clients
CREATE POLICY "Allow authenticated users to read all clients"
ON clients
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert clients
CREATE POLICY "Allow authenticated users to insert clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update clients
CREATE POLICY "Allow authenticated users to update clients"
ON clients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete clients
CREATE POLICY "Allow authenticated users to delete clients"
ON clients
FOR DELETE
TO authenticated
USING (true);