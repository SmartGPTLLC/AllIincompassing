/*
  # Add Admin Role for info@westcoast.org

  1. Changes
    - Check if user exists and add admin role if found
    - Maintain existing admin roles
    
  2. Security
    - Uses secure role assignment through user_roles table
    - Maintains existing RLS policies
*/

DO $$
DECLARE
  v_admin_role_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the admin role ID
  SELECT id INTO v_admin_role_id
  FROM roles
  WHERE name = 'admin';

  -- Get the user ID for info@westcoast.org
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'info@westcoast.org';

  -- If user exists, assign admin role
  IF v_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_user_id, v_admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;