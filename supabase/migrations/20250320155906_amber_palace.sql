/*
  # Fix Admin Users Function Overloading

  1. Changes
    - Drop all versions of manage_admin_users function
    - Create single consolidated version
    - Handle both UUID and email inputs
    - Support optional metadata and password
    
  2. Security
    - Maintain existing security checks
    - Keep function as SECURITY DEFINER
*/

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS manage_admin_users(text, uuid);
DROP FUNCTION IF EXISTS manage_admin_users(text, text, jsonb);
DROP FUNCTION IF EXISTS manage_admin_users(text, text, jsonb, text);

-- Create single consolidated version
CREATE OR REPLACE FUNCTION manage_admin_users(
  operation text,
  target_user_id text,
  metadata jsonb DEFAULT NULL,
  password text DEFAULT NULL
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

  -- Handle target_user_id as either email or UUID
  IF target_user_id ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    -- Email provided - get or create user
    SELECT id INTO target_id
    FROM auth.users
    WHERE email = target_user_id;

    IF target_id IS NULL THEN
      -- Generate new UUID
      target_id := gen_random_uuid();
      
      -- Create new user
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        role,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change_token_current,
        aud,
        is_super_admin,
        is_sso_user
      ) VALUES (
        target_id,
        gen_random_uuid(),
        target_user_id,
        CASE 
          WHEN password IS NOT NULL THEN crypt(password, gen_salt('bf'))
          ELSE crypt(gen_random_uuid()::text, gen_salt('bf'))
        END,
        now(),
        'authenticated',
        '{"provider":"email","providers":["email"]}'::jsonb,
        COALESCE(metadata, '{}'::jsonb),
        now(),
        now(),
        '',
        '',
        '',
        '',
        'authenticated',
        false,
        false
      );

      -- Create identity
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        target_id,
        target_id,
        jsonb_build_object(
          'sub', target_id::text,
          'email', target_user_id
        ),
        'email',
        target_user_id,
        now(),
        now(),
        now()
      );
    ELSE
      -- Update existing user's metadata if provided
      IF metadata IS NOT NULL THEN
        UPDATE auth.users
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || metadata
        WHERE id = target_id;
      END IF;

      -- Update password if provided
      IF password IS NOT NULL THEN
        UPDATE auth.users
        SET encrypted_password = crypt(password, gen_salt('bf'))
        WHERE id = target_id;
      END IF;
    END IF;
  ELSE
    -- UUID provided
    BEGIN
      target_id := target_user_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Invalid user ID format';
    END;
  END IF;

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

    ELSE
      RAISE EXCEPTION 'Invalid operation: %', operation;
  END CASE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION manage_admin_users(text, text, jsonb, text) TO authenticated;