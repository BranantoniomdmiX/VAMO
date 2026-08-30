-- ==============================================================================
-- MIGRACIÓN SPEC-010: AUTENTICACIÓN BIOMÉTRICA (PASSKEYS), RBAC CERRADO & INVITACIONES
-- Infraestructura: PostgreSQL 16 (Dokploy / Supabase)
-- ==============================================================================

-- 1. Ampliación de la tabla profiles para jerarquía, biometría y códigos de afiliación
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS passkey_credential_id TEXT,
  ADD COLUMN IF NOT EXISTS passkey_public_key TEXT;

-- Índice para búsquedas rápidas de plaza y códigos de referido
CREATE INDEX IF NOT EXISTS idx_profiles_owner_id ON public.profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- 2. Tabla de Invitaciones / Pre-altas (Control Estricto de Registro Operativo)
CREATE TABLE IF NOT EXISTS public.onboarding_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  target_role TEXT NOT NULL CHECK (target_role IN ('owner', 'driver', 'biz', 'base')),
  invite_token TEXT UNIQUE NOT NULL,
  phone_or_email TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id),
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_token ON public.onboarding_invites(invite_token);

-- 3. Habilitar Seguridad por Fila (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_invites ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para Profiles
DROP POLICY IF EXISTS "Superadmin acceso total profiles" ON public.profiles;
CREATE POLICY "Superadmin acceso total profiles" 
ON public.profiles 
FOR ALL 
USING (
  (auth.jwt() ->> 'role' = 'superadmin') OR 
  (auth.jwt() ->> 'is_master' = 'true') OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

DROP POLICY IF EXISTS "Socio administra su red" ON public.profiles;
CREATE POLICY "Socio administra su red" 
ON public.profiles 
FOR ALL 
USING (
  owner_id = auth.uid() OR id = auth.uid()
);

DROP POLICY IF EXISTS "Clientes lectura publica comercios verificados" ON public.profiles;
CREATE POLICY "Clientes lectura publica comercios verificados" 
ON public.profiles 
FOR SELECT 
USING (
  (role = 'biz' AND is_verified = TRUE) OR (id = auth.uid())
);

-- 5. Políticas RLS para Onboarding Invites
DROP POLICY IF EXISTS "Superadmin y Socios gestionan sus invitaciones" ON public.onboarding_invites;
CREATE POLICY "Superadmin y Socios gestionan sus invitaciones" 
ON public.onboarding_invites 
FOR ALL 
USING (
  (created_by = auth.uid()) OR 
  (auth.jwt() ->> 'role' = 'superadmin') OR 
  (auth.jwt() ->> 'is_master' = 'true')
);

DROP POLICY IF EXISTS "Invitaciones lectura publica de validacion de token" ON public.onboarding_invites;
CREATE POLICY "Invitaciones lectura publica de validacion de token" 
ON public.onboarding_invites 
FOR SELECT 
USING (
  is_used = FALSE AND expires_at > NOW()
);

-- 6. Función y Trigger para Consumir Invitación Automáticamente
CREATE OR REPLACE FUNCTION public.fn_process_invite_onboarding()
RETURNS TRIGGER AS $$
DECLARE
  v_invite RECORD;
BEGIN
  -- Si el nuevo usuario se registra con un código o token de referido
  IF NEW.referred_by IS NOT NULL THEN
    SELECT * INTO v_invite 
    FROM public.onboarding_invites 
    WHERE invite_token = NEW.referred_by AND is_used = FALSE AND expires_at > NOW()
    LIMIT 1;

    IF FOUND THEN
      -- Asignar rol verificado y vincular a la plaza del socio
      NEW.owner_id := v_invite.owner_id;
      NEW.role := v_invite.target_role;
      NEW.is_verified := TRUE;

      -- Marcar invitación como utilizada
      UPDATE public.onboarding_invites 
      SET is_used = TRUE, used_by = NEW.id, used_at = NOW() 
      WHERE id = v_invite.id;
    END IF;
  END IF;

  -- Generar referral_code único si no existe
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'VAMO-' || UPPER(SUBSTRING(NEW.role FROM 1 FOR 3)) || '-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_process_invite_onboarding ON public.profiles;
CREATE TRIGGER trg_process_invite_onboarding
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.fn_process_invite_onboarding();
