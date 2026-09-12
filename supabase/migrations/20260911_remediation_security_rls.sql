-- =====================================================================
-- 🛡️ VAMO SECURITY REMEDIATION: DOKPLOY & SUPABASE MULTI-TENANT RLS
-- Migración Aditiva: Habilita Row Level Security y Políticas Herméticas
-- =====================================================================

-- 0. Asegurar compatibilidad con auth.uid() y auth.jwt() en PostgreSQL nativo (Dokploy)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$ LANGUAGE sql STABLE;

-- 1. Habilitar RLS en tablas operativas y de negocio
ALTER TABLE IF EXISTS public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.operation_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.delivery_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.device_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Catálogos Geográficos (Lectura pública / Escritura Superadmin)
DROP POLICY IF EXISTS "cities_public_read" ON public.cities;
CREATE POLICY "cities_public_read" ON public.cities FOR SELECT USING (true);

DROP POLICY IF EXISTS "territories_public_read" ON public.territories;
CREATE POLICY "territories_public_read" ON public.territories FOR SELECT USING (true);

-- 3. Políticas para Franchises / Plazas Comerciales
DROP POLICY IF EXISTS "franchises_read_active" ON public.franchises;
CREATE POLICY "franchises_read_active" ON public.franchises FOR SELECT
  USING (status = 'active' OR owner_id = auth.uid() OR (auth.jwt() ->> 'role' IN ('superadmin', 'master')));

DROP POLICY IF EXISTS "franchises_write_owner" ON public.franchises;
CREATE POLICY "franchises_write_owner" ON public.franchises FOR ALL
  USING (owner_id = auth.uid() OR (auth.jwt() ->> 'role' IN ('superadmin', 'master')));

-- 4. Políticas para Drivers / Riders
DROP POLICY IF EXISTS "drivers_self_read_write" ON public.drivers;
CREATE POLICY "drivers_self_read_write" ON public.drivers FOR ALL
  USING (id = auth.uid() OR (auth.jwt() ->> 'role' IN ('superadmin', 'master')));

-- 5. Políticas para Orders (Aislamiento de Cliente, Chofer y Franquicia)
DROP POLICY IF EXISTS "orders_party_isolation" ON public.orders;
CREATE POLICY "orders_party_isolation" ON public.orders FOR SELECT
  USING (
    customer_id = auth.uid() 
    OR driver_id = auth.uid() 
    OR franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid())
    OR (auth.jwt() ->> 'role' IN ('superadmin', 'master'))
  );

-- 6. Políticas de Billeteras Digitales (Ledger Blindado)
DROP POLICY IF EXISTS "wallet_accounts_owner_only" ON public.wallet_accounts;
CREATE POLICY "wallet_accounts_owner_only" ON public.wallet_accounts FOR SELECT
  USING (profile_id = auth.uid() OR (auth.jwt() ->> 'role' IN ('superadmin', 'master')));

DROP POLICY IF EXISTS "wallet_transactions_owner_only" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_owner_only" ON public.wallet_transactions FOR SELECT
  USING (
    wallet_id IN (SELECT id FROM public.wallet_accounts WHERE profile_id = auth.uid())
    OR (auth.jwt() ->> 'role' IN ('superadmin', 'master'))
  );

-- 7. Cuentas Bancarias y Dispositivos Push
DROP POLICY IF EXISTS "bank_accounts_owner_only" ON public.bank_accounts;
CREATE POLICY "bank_accounts_owner_only" ON public.bank_accounts FOR ALL
  USING (profile_id = auth.uid() OR (auth.jwt() ->> 'role' IN ('superadmin', 'master')));

DROP POLICY IF EXISTS "device_tokens_owner_only" ON public.device_tokens;
CREATE POLICY "device_tokens_owner_only" ON public.device_tokens FOR ALL
  USING (profile_id = auth.uid() OR (auth.jwt() ->> 'role' IN ('superadmin', 'master')));
