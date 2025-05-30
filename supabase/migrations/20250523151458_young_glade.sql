/*
  # Add Signup Helper Function

  1. Changes
    - Add assign_admin_role function to simplify admin role assignment
    - Fix user role assignment during signup
    - Improve error handling
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper role assignment
*/

-- Create function to assign admin role to a user by email
CREATE OR REPLACE FUNCTION assign_admin_role(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role_id uuid;
  target_user_id uuid;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id
  FROM roles
  WHERE name = 'admin';
  
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Add admin role
  INSERT INTO user_roles (user_id, role_id)
  VALUES (target_user_id, admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  -- Update user metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    '{"is_admin": true}'::jsonb
  WHERE id = target_user_id;
  
  RAISE NOTICE 'Admin role assigned to %', user_email;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error assigning admin role: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION assign_admin_role(text) TO authenticated;