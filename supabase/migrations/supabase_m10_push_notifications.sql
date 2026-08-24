-- =====================================================================
-- VAMO M10 — Tabla de Tokens de Notificaciones Push (FCM / Web Push)
-- Ejecutar en: Supabase SQL Editor — proyecto cheoxokdpgbjgfdghhzt
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.device_push_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'customer' CHECK (
    role IN ('customer', 'driver', 'merchant', 'base', 'owner', 'admin')
  ),
  device_token    TEXT UNIQUE NOT NULL,
  platform        TEXT NOT NULL DEFAULT 'web' CHECK (
    platform IN ('android_apk', 'pwa_mobile', 'web_desktop', 'ios_pwa')
  ),
  device_info     JSONB DEFAULT '{}'::jsonb,
  is_active       BOOLEAN DEFAULT TRUE,
  last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida de tokens por usuario o rol
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.device_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_role ON public.device_push_tokens(role);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.device_push_tokens(is_active);

-- RLS: Habilitar Row Level Security
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden consultar y gestionar sus propios tokens
CREATE POLICY "users_manage_own_push_tokens" ON public.device_push_tokens
  FOR ALL USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Policy: Superadmin o roles operativos autorizados pueden leer tokens para despacho
CREATE POLICY "superadmin_read_all_push_tokens" ON public.device_push_tokens
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') IN ('superadmin', 'dispatcher', 'fleet_owner')
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON public.device_push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_push_tokens_updated_at();

-- Habilitar Supabase Realtime para la tabla de tokens
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_push_tokens;
