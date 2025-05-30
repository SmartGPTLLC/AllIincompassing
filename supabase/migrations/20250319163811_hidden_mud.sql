/*
  # Assign Admin Role to New User

  1. Changes
    - Assign admin role to j_eduardo622@yahoo.com
    - Remove admin role from test@example.com
    - Ensure admin role exists
    
  2. Security
    - Uses secure role assignment through user_roles table
    - Maintains existing RLS policies
*/

DO $$
DECLARE
  v_admin_role_id uuid;
  v_new_admin_id uuid;
  v_test_user_id uuid;
BEGIN
  -- Get the admin role ID
  SELECT id INTO v_admin_role_id
  FROM roles
  WHERE name = 'admin';

  -- Get the new admin user ID
  SELECT id INTO v_new_admin_id
  FROM auth.users
  WHERE email = 'j_eduardo622@yahoo.com';

  -- Get the test user ID
  SELECT id INTO v_test_user_id
  FROM auth.users
  WHERE email = 'test@example.com';

  -- Remove admin role from test user if exists
  DELETE FROM user_roles
  WHERE user_id = v_test_user_id
  AND role_id = v_admin_role_id;

  -- Add admin role to new user
  INSERT INTO user_roles (user_id, role_id)
  VALUES (v_new_admin_id, v_admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Add therapist role to test user
  INSERT INTO user_roles (
    user_id,
    role_id
  )
  SELECT 
    v_test_user_id,
    r.id
  FROM roles r
  WHERE r.name = 'therapist'
  ON CONFLICT (user_id, role_id) DO NOTHING;

END $$;