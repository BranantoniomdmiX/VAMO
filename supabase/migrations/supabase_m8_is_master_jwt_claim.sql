-- M8 HARDENING: JWT CLAIM is_master para /admin
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.master_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.master_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo superadmin gestiona master_users" ON public.master_users;
CREATE POLICY "Solo superadmin gestiona master_users"
  ON public.master_users FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );
GRANT ALL ON TABLE public.master_users TO supabase_auth_admin;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_role_val text;
  user_roles_arr jsonb;
  is_master_val boolean := false;
BEGIN
  SELECT jsonb_agg(role) INTO user_roles_arr FROM public.user_roles WHERE user_id = (event->>'user_id')::uuid;
  SELECT role INTO user_role_val FROM public.user_roles WHERE user_id = (event->>'user_id')::uuid
  ORDER BY CASE role WHEN 'superadmin' THEN 1 WHEN 'fleet_owner' THEN 2 WHEN 'dispatcher' THEN 3 WHEN 'merchant' THEN 4 WHEN 'driver' THEN 5 ELSE 6 END LIMIT 1;
  IF user_role_val IS NULL THEN user_role_val := 'customer'; user_roles_arr := '["customer"]'::jsonb; END IF;
  SELECT EXISTS (SELECT 1 FROM public.master_users WHERE user_id = (event->>'user_id')::uuid) INTO is_master_val;
  claims := event->'claims';
  claims := jsonb_set(claims, '{app_metadata,user_role}',  to_jsonb(user_role_val));
  claims := jsonb_set(claims, '{app_metadata,user_roles}', user_roles_arr);
  claims := jsonb_set(claims, '{app_metadata,is_master}',  to_jsonb(is_master_val));
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- INSTRUCCIONES:
-- 1. Ejecutar este script completo en Supabase SQL Editor.
-- 2. Insertar a Branmix como master:
--    INSERT INTO public.master_users (user_id)
--    SELECT user_id FROM public.user_roles WHERE role = 'superadmin' LIMIT 1;
-- 3. El proximo login de Branmix tendra app_metadata.is_master = true en el JWT.