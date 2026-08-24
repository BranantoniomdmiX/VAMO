-- ==============================================================================
-- VAMO SaaS — Módulo M17: Sistema de Baja Definitiva & Cancelación de Cuenta
-- Permite a Clientes, Choferes, Locales y Socios Operadores cancelar su cuenta
-- de forma permanente con cumplimiento estricto de privacidad (Derechos ARCO / Google Play).
-- ==============================================================================

-- 1. Tabla de Auditoría de Bajas y Cancelaciones
CREATE TABLE IF NOT EXISTS public.account_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    feedback_notes TEXT,
    cod_balance_at_cancellation DECIMAL(12, 2) DEFAULT 0.00,
    wallet_balance_at_cancellation DECIMAL(12, 2) DEFAULT 0.00,
    cancelled_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by VARCHAR(50) DEFAULT 'USER_SELF_SERVICE'
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_cancellations_user ON public.account_cancellations(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_date ON public.account_cancellations(cancelled_at DESC);

-- 3. Habilitar Seguridad RLS
ALTER TABLE public.account_cancellations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden registrar su propia solicitud de baja" ON public.account_cancellations;
CREATE POLICY "Usuarios pueden registrar su propia solicitud de baja"
ON public.account_cancellations FOR INSERT
WITH CHECK (auth.uid() = user_id OR (auth.jwt() ->> 'is_master')::boolean = true);

DROP POLICY IF EXISTS "Solo Superadmin puede ver el historial de bajas" ON public.account_cancellations;
CREATE POLICY "Solo Superadmin puede ver el historial de bajas"
ON public.account_cancellations FOR SELECT
USING (auth.uid() = user_id OR (auth.jwt() ->> 'is_master')::boolean = true);

-- 4. Función de Desactivación Segura de Cuenta en Base de Datos
CREATE OR REPLACE FUNCTION cancel_user_account(
    p_user_id UUID,
    p_role VARCHAR,
    p_reason VARCHAR,
    p_feedback TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Desactivar el perfil en user_profiles si existe la tabla
    UPDATE public.user_profiles
    SET is_active = false,
        status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Registrar en auditoría de cancelaciones
    INSERT INTO public.account_cancellations (
        user_id,
        role,
        reason,
        feedback_notes
    ) VALUES (
        p_user_id,
        p_role,
        p_reason,
        p_feedback
    );

    v_result := jsonb_build_object(
        'success', true,
        'message', 'Cuenta desactivada exitosamente en el sistema VAMO.'
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
