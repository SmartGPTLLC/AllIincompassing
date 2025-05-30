/*
  # Add Admin Role to Test User

  1. Changes
    - Assign admin role to test@example.com user
    
  2. Security
    - Uses secure role assignment through user_roles table
    - Maintains existing RLS policies
*/

DO $$
DECLARE
  v_user_id uuid;
  v_role_id uuid;
BEGIN
  -- Get the user ID for test@example.com
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'test@example.com';

  -- Get the admin role ID
  SELECT id INTO v_role_id
  FROM roles
  WHERE name = 'admin';

  -- Insert the user role if it doesn't exist
  INSERT INTO user_roles (user_id, role_id)
  VALUES (v_user_id, v_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
END $$;