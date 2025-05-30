/*
  # Fix Admin User Management Function

  1. Changes
    - Update manage_admin_users function to properly check admin role
    - Add better error handling
    - Fix role checking logic
    
  2. Security
    - Maintain secure role-based access
    - Proper admin validation
*/

-- Drop and recreate the manage_admin_users function with fixed admin check
CREATE OR REPLACE FUNCTION manage_admin_users(operation text, target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role_id uuid;
  current_user_id uuid;
  is_admin boolean;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if current user is admin using a direct query
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

  -- Get admin role ID
  SELECT id INTO admin_role_id
  FROM roles
  WHERE name = 'admin';

  -- Perform the requested operation
  CASE operation
    WHEN 'add' THEN
      -- Add admin role
      INSERT INTO user_roles (user_id, role_id)
      VALUES (target_user_id, admin_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;

    WHEN 'remove' THEN
      -- Prevent removing the last admin
      IF (SELECT COUNT(*) FROM user_roles WHERE role_id = admin_role_id) <= 1 
         AND target_user_id = current_user_id THEN
        RAISE EXCEPTION 'Cannot remove the last administrator';
      END IF;

      -- Remove admin role
      DELETE FROM user_roles
      WHERE user_id = target_user_id
      AND role_id = admin_role_id;

    ELSE
      RAISE EXCEPTION 'Invalid operation: %', operation;
  END CASE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION manage_admin_users(text, uuid) TO authenticated;

-- Ensure admin view has proper permissions
GRANT SELECT ON admin_users TO authenticated;