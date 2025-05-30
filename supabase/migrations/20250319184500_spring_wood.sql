/*
  # Add Password Management for Admins

  1. Changes
    - Add function to reset user password
    - Add function to create admin with password
    - Update manage_admin_users to handle passwords
    
  2. Security
    - Secure password handling
    - Only admins can manage passwords
*/

-- Create function to reset user password
CREATE OR REPLACE FUNCTION reset_user_password(
  target_email text,
  new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can reset passwords';
  END IF;

  -- Update user's password
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE email = target_email;
END;
$$;

-- Drop and recreate manage_admin_users with password support
CREATE OR REPLACE FUNCTION manage_admin_users(
  operation text,
  target_user_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
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

  -- If target_user_id is an email, get or create the user
  IF target_user_id ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    -- Check if user exists
    SELECT id INTO target_id
    FROM auth.users
    WHERE email = target_user_id;

    -- If user doesn't exist, create them
    IF target_id IS NULL THEN
      -- Generate new UUID
      target_id := gen_random_uuid();
      
      -- Create new user with password if provided
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
        metadata,
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
      -- Update existing user's metadata and password if provided
      UPDATE auth.users
      SET 
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || metadata,
        encrypted_password = CASE 
          WHEN password IS NOT NULL THEN crypt(password, gen_salt('bf'))
          ELSE encrypted_password
        END
      WHERE id = target_id;
    END IF;
  ELSE
    -- If not an email, assume it's already a UUID
    target_id := target_user_id::uuid;
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION reset_user_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION manage_admin_users(text, text, jsonb, text) TO authenticated;