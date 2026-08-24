-- ==============================================================================
-- VAMO SaaS — Módulo M16: Cuentas Bancarias CLABE & Dispersión SPEI Conekta
-- Permite a Motociclistas, Locales y Socios Operadores registrar su CLABE
-- y recibir transferencias SPEI automáticas (Diarias, Semanales o Bajo Demanda).
-- ==============================================================================

-- 1. Tabla de Cuentas Bancarias de Usuarios
CREATE TABLE IF NOT EXISTS public.user_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('driver', 'merchant', 'fleet_owner', 'dispatcher', 'superadmin')),
    bank_name VARCHAR(100) NOT NULL, -- BBVA, Santander, Banorte, Nu, Azteca, etc.
    clabe_number VARCHAR(18) NOT NULL, -- CLABE interbancaria estándar 18 dígitos
    card_number VARCHAR(16), -- Tarjeta de débito opcional 16 dígitos
    beneficiary_name VARCHAR(255) NOT NULL, -- Nombre del titular de la cuenta
    rfc_curp VARCHAR(20), -- RFC o CURP para timbrado fiscal
    payout_frequency VARCHAR(20) DEFAULT 'DAILY' CHECK (payout_frequency IN ('DAILY', 'WEEKLY', 'MANUAL')),
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Tabla de Dispersiones & Pagos SPEI (Auditoría Financiera)
CREATE TABLE IF NOT EXISTS public.payout_disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL,
    payout_type VARCHAR(50) NOT NULL CHECK (payout_type IN ('DRIVER_EARNINGS', 'MERCHANT_SALES', 'OWNER_PROFIT', 'VAMO_ROYALTY')),
    gross_amount DECIMAL(12, 2) NOT NULL,
    fee_deducted DECIMAL(12, 2) DEFAULT 0.00,
    net_amount DECIMAL(12, 2) NOT NULL,
    destination_bank VARCHAR(100) NOT NULL,
    destination_clabe VARCHAR(18) NOT NULL,
    beneficiary_name VARCHAR(255) NOT NULL,
    conekta_transfer_id VARCHAR(100), -- ID de transferencia SPEI devuelto por Conekta
    conekta_status VARCHAR(50) DEFAULT 'PENDING' CHECK (conekta_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED')),
    failure_reason TEXT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON public.user_bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON public.payout_disbursements(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payout_disbursements(conekta_status);
CREATE INDEX IF NOT EXISTS idx_payouts_created ON public.payout_disbursements(created_at DESC);

-- 4. Habilitar Seguridad por Fila (RLS)
ALTER TABLE public.user_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_disbursements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_bank_accounts
DROP POLICY IF EXISTS "Los usuarios pueden ver su propia cuenta bancaria" ON public.user_bank_accounts;
CREATE POLICY "Los usuarios pueden ver su propia cuenta bancaria"
ON public.user_bank_accounts FOR SELECT
USING (auth.uid() = user_id OR (auth.jwt() ->> 'is_master')::boolean = true);

DROP POLICY IF EXISTS "Los usuarios pueden registrar su propia cuenta bancaria" ON public.user_bank_accounts;
CREATE POLICY "Los usuarios pueden registrar su propia cuenta bancaria"
ON public.user_bank_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id OR (auth.jwt() ->> 'is_master')::boolean = true);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propia cuenta bancaria" ON public.user_bank_accounts;
CREATE POLICY "Los usuarios pueden actualizar su propia cuenta bancaria"
ON public.user_bank_accounts FOR UPDATE
USING (auth.uid() = user_id OR (auth.jwt() ->> 'is_master')::boolean = true);

-- Políticas RLS para payout_disbursements
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio historial de pagos" ON public.payout_disbursements;
CREATE POLICY "Los usuarios pueden ver su propio historial de pagos"
ON public.payout_disbursements FOR SELECT
USING (auth.uid() = user_id OR (auth.jwt() ->> 'is_master')::boolean = true);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_bank_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_bank_account_timestamp ON public.user_bank_accounts;
CREATE TRIGGER trg_update_bank_account_timestamp
BEFORE UPDATE ON public.user_bank_accounts
FOR EACH ROW EXECUTE FUNCTION update_bank_account_timestamp();
