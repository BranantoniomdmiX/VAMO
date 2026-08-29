-- =====================================================================
-- 🔔 VAMO PUSH NOTIFICATIONS ENGINE & DEVICE TOKENS (FCM / WEB PUSH)
-- Almacenamiento y Registro Atómico de Tokens de Notificación
-- =====================================================================

-- 1. Tabla de Tokens de Dispositivos (PWA / APK Android 16 / Web)
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web', -- 'android', 'ios', 'web'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_profile_token UNIQUE (profile_id, token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_profile ON public.device_tokens(profile_id);

-- 2. Procedimiento para Registrar o Actualizar Token de Dispositivo
CREATE OR REPLACE FUNCTION public.register_device_token(
  p_profile_id UUID,
  p_token TEXT,
  p_platform TEXT DEFAULT 'web'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_id UUID;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_TOKEN', 'message', 'El token no puede estar vacío.');
  END IF;

  INSERT INTO public.device_tokens (profile_id, token, platform, is_active, updated_at)
  VALUES (p_profile_id, TRIM(p_token), p_platform, TRUE, NOW())
  ON CONFLICT (profile_id, token)
  DO UPDATE SET
    platform = EXCLUDED.platform,
    is_active = TRUE,
    updated_at = NOW()
  RETURNING id INTO v_token_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'TOKEN_REGISTERED',
    'message', 'Token de dispositivo registrado exitosamente para notificaciones push.',
    'device_token_id', v_token_id,
    'platform', p_platform
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'TOKEN_ERROR', 'message', SQLERRM);
END;
$$;
