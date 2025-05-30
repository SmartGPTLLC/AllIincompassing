/*
  # Create Admin User with Proper Identity

  1. Changes
    - Create admin user if not exists
    - Set up proper identity without generated columns
    - Assign admin role
    
  2. Security
    - Uses secure password hashing
    - Sets up proper authentication metadata
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

  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'lloyd.gilbert@example.com';

  IF v_user_id IS NULL THEN
    -- Generate a new UUID for the user
    v_user_id := gen_random_uuid();

    -- Create new user with proper UUID
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
      v_user_id,
      gen_random_uuid(),
      'lloyd.gilbert@example.com',
      crypt('temp-password-123', gen_salt('bf')),
      now(),
      'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Lloyd","last_name":"Gilbert","title":"System Administrator","is_admin":true}'::jsonb,
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

    -- Insert identity with proper provider_id
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
      v_user_id,
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'lloyd.gilbert@example.com'
      ),
      'email',
      'lloyd.gilbert@example.com',
      now(),
      now(),
      now()
    );
  END IF;

  -- Assign admin role
  INSERT INTO user_roles (user_id, role_id)
  VALUES (v_user_id, v_admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

END $$;