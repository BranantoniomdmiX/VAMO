-- =====================================================================
-- VAMO M13 — Matriz de Precios Territoriales y Split 50/50
-- Modelo: Micro-cuotas de alto volumen (Owner 50% / VAMO Master 50%)
-- Ejecutar en: Supabase SQL Editor — proyecto cheoxokdpgbjgfdghhzt
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.territorial_pricing_tiers (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name                   TEXT NOT NULL,
  city                        TEXT NOT NULL DEFAULT 'Celaya',
  state                       TEXT NOT NULL DEFAULT 'Guanajuato',
  
  -- Cuota Semanal por Motociclista (Base $50 Owner + $50 VAMO = $100)
  driver_weekly_owner_fee     NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  driver_weekly_platform_fee  NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  
  -- Cuota Mensual: Micro / Callejero / Taquero ($50 Owner + $50 VAMO = $100)
  micro_merchant_owner_fee    NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  micro_merchant_platform_fee NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  
  -- Cuota Mensual: Comercio Local / Farmacia / Ferretería ($150 Owner + $150 VAMO = $300)
  standard_merchant_owner_fee NUMERIC(10,2) NOT NULL DEFAULT 150.00,
  standard_merchant_platform_fee NUMERIC(10,2) NOT NULL DEFAULT 150.00,
  
  -- Cuota Mensual: Restaurante Alta Demanda ($200 a $500 Owner + $200 a $500 VAMO = $400 a $1,000)
  restaurant_owner_fee        NUMERIC(10,2) NOT NULL DEFAULT 350.00,
  restaurant_platform_fee     NUMERIC(10,2) NOT NULL DEFAULT 350.00,
  
  is_active                   BOOLEAN DEFAULT TRUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Liquidaciones y Cortes de Regalías 50/50
CREATE TABLE IF NOT EXISTS public.partner_split_settlements (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  period_type                 TEXT NOT NULL CHECK (period_type IN ('WEEKLY', 'MONTHLY')),
  period_start                DATE NOT NULL,
  period_end                  DATE NOT NULL,
  
  -- Totales recaudados
  total_drivers_collected     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_merchants_collected   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  gross_total_collected       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  
  -- Split 50/50
  owner_earnings              NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  platform_royalties_due      NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  
  payment_status              TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    payment_status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')
  ),
  payment_reference           TEXT,
  paid_at                     TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.territorial_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_split_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_pricing_tiers" ON public.territorial_pricing_tiers
  FOR SELECT USING (true);

CREATE POLICY "partners_view_own_settlements" ON public.partner_split_settlements
  FOR ALL USING (
    auth.uid() = partner_id OR (auth.jwt() ->> 'user_role') = 'superadmin'
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.territorial_pricing_tiers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_split_settlements;
