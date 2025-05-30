/*
  # Fix Admin User Management Function

  1. Changes
    - Drop all versions of manage_admin_users function
    - Create a single consolidated version with default parameters
    - Fix function overloading issues
    
  2. Security
    - Maintain existing security checks
    - Keep function as SECURITY DEFINER
*/

-- Drop all existing versions of the function to avoid overloading issues
DROP FUNCTION IF EXISTS manage_admin_users(text, uuid);
DROP FUNCTION IF EXISTS manage_admin_users(text, text);
DROP FUNCTION IF EXISTS manage_admin_users(text, text, jsonb);
DROP FUNCTION IF EXISTS manage_admin_users(text, text, jsonb, text);

-- Create a single consolidated version with optional parameters
CREATE OR REPLACE FUNCTION manage_admin_users(
  operation text,
  target_user_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role_id uuid;
  current_user_id uuid;
  target_id uuid;
  is_admin boolean;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Get admin role ID
  SELECT id INTO admin_role_id
  FROM roles
  WHERE name = 'admin';
  
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = current_user_id
    AND r.name = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only administrators can manage admin users';
  END IF;

  -- If target_user_id is a UUID, use it directly
  BEGIN
    target_id := target_user_id::uuid;
  EXCEPTION 
    WHEN OTHERS THEN
      -- If not a UUID, assume it's an email
      SELECT id INTO target_id
      FROM auth.users
      WHERE email = target_user_id;
      
      IF target_id IS NULL THEN
        RAISE EXCEPTION 'User with ID/email % not found', target_user_id;
      END IF;
  END;

  -- Perform the requested operation
  CASE operation
    WHEN 'add' THEN
      -- Add admin role
      INSERT INTO user_roles (user_id, role_id)
      VALUES (target_id, admin_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;

      -- Update user metadata to mark as admin
      UPDATE auth.users
      SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        '{"is_admin": true}'::jsonb
      WHERE id = target_id;

      RAISE NOTICE 'Admin role added to user %', target_id;

    WHEN 'remove' THEN
      -- Prevent removing the last admin
      IF (SELECT COUNT(*) FROM user_roles WHERE role_id = admin_role_id) <= 1 
         AND target_id = current_user_id THEN
        RAISE EXCEPTION 'Cannot remove the last administrator';
      END IF;

      -- Remove admin role
      DELETE FROM user_roles
      WHERE user_id = target_id
      AND role_id = admin_role_id;

      -- Update user metadata to remove admin flag
      UPDATE auth.users
      SET raw_user_meta_data = 
        raw_user_meta_data - 'is_admin'
      WHERE id = target_id;

      RAISE NOTICE 'Admin role removed from user %', target_id;

    ELSE
      RAISE EXCEPTION 'Invalid operation: %', operation;
  END CASE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION manage_admin_users(text, text) TO authenticated;