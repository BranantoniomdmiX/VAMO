-- ====================================================================
-- ARQUITECTURA DE ROLES MÚLTIPLES Y SEPARACIÓN DE SUPERUSUARIO (VAMO)
-- ====================================================================
-- Este script crea la tabla de roles y la función de Custom Claims JWT.
-- Ejecutar en el SQL Editor del Dashboard de Supabase.

-- 1. CREAR TABLA PUBLIC.USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'fleet_owner', 'dispatcher', 'merchant', 'driver', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Los usuarios autenticados pueden ver solo sus propios roles
DROP POLICY IF EXISTS "Usuarios ven sus propios roles" ON public.user_roles;
CREATE POLICY "Usuarios ven sus propios roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Política de RLS: Solo Superadmin puede insertar/modificar roles de usuario
DROP POLICY IF EXISTS "Superadmin gestiona roles" ON public.user_roles;
CREATE POLICY "Superadmin gestiona roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
    )
  );

-- 3. FUNCIÓN CUSTOM ACCESS TOKEN HOOK (INYECCIÓN DE ROLES EN EL JWT)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_role_val text;
  user_roles_arr jsonb;
BEGIN
  -- Obtener todos los roles del usuario desde public.user_roles
  SELECT jsonb_agg(role) INTO user_roles_arr
  FROM public.user_roles
  WHERE user_id = (event->>'user_id')::uuid;

  -- Seleccionar el rol principal (o 'customer' por defecto)
  SELECT role INTO user_role_val
  FROM public.user_roles
  WHERE user_id = (event->>'user_id')::uuid
  ORDER BY 
    CASE role
      WHEN 'superadmin' THEN 1
      WHEN 'fleet_owner' THEN 2
      WHEN 'dispatcher' THEN 3
      WHEN 'merchant' THEN 4
      WHEN 'driver' THEN 5
      ELSE 6
    END
  LIMIT 1;

  IF user_role_val IS NULL THEN
    user_role_val := 'customer';
    user_roles_arr := '["customer"]'::jsonb;
  END IF;

  claims := event->'claims';

  -- Inyectar claims de rol en app_metadata del JWT
  claims := jsonb_set(claims, '{app_metadata, user_role}', to_jsonb(user_role_val));
  claims := jsonb_set(claims, '{app_metadata, user_roles}', user_roles_arr);

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Otorgar permisos al rol de autenticación de Supabase
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT ALL ON TABLE public.user_roles TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ====================================================================
-- INSTRUCCIONES DE USO:
-- 1. Ejecuta este script completo en el SQL Editor de Supabase.
-- 2. Para asignar a un usuario como Superadmin ejecútalo así:
--    INSERT INTO public.user_roles (user_id, role) VALUES ('TU_USER_UUID', 'superadmin');
-- ====================================================================
