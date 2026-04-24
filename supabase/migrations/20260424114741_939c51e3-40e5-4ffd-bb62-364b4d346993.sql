-- Criar usuário admin@admin.com com senha admin123 diretamente no auth.users
DO $$
DECLARE
  v_user_id UUID;
  v_existing_id UUID;
BEGIN
  -- Verifica se já existe
  SELECT id INTO v_existing_id FROM auth.users WHERE email = 'admin@admin.com';
  
  IF v_existing_id IS NOT NULL THEN
    -- Atualiza a senha caso já exista
    UPDATE auth.users
    SET encrypted_password = crypt('admin123', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = v_existing_id;
    RAISE NOTICE 'Admin user already existed, password updated. ID: %', v_existing_id;
  ELSE
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated',
      'admin@admin.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrador"}'::jsonb,
      NOW(), NOW(), '', '', '', ''
    );
    
    -- Identidade necessária para login com email
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'admin@admin.com', 'email_verified', true),
      'email', v_user_id::text,
      NOW(), NOW(), NOW()
    );
    
    RAISE NOTICE 'Admin user created. ID: %', v_user_id;
  END IF;
END $$;