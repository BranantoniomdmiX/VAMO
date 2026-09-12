-- =====================================================================
-- 🛡️ VAMO ADAPTIVE RLS: TRANSACTION-SCOPED TENANT & ACTOR CONTEXT
-- Adaptación para Runtime Role con Mínimos Privilegios
-- =====================================================================

-- 1. Funciones Helper para Obtener Contexto de la Transacción Actual
CREATE OR REPLACE FUNCTION public.current_app_user_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.current_app_role() RETURNS TEXT AS $$
  SELECT COALESCE(NULLIF(current_setting('app.current_role', true), ''), 'anon');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.current_app_franchise_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_franchise_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- 2. Actualizar las Políticas RLS para Evaluar el Contexto de la Aplicación

-- 2.1 Franchises
DROP POLICY IF EXISTS "franchises_read_active" ON public.franchises;
CREATE POLICY "franchises_read_active" ON public.franchises FOR SELECT
  USING (
    status = 'active' 
    OR owner_id = public.current_app_user_id() 
    OR public.current_app_role() IN ('superadmin', 'master')
  );

DROP POLICY IF EXISTS "franchises_write_owner" ON public.franchises;
CREATE POLICY "franchises_write_owner" ON public.franchises FOR ALL
  USING (
    owner_id = public.current_app_user_id() 
    OR public.current_app_role() IN ('superadmin', 'master')
  );

-- 2.2 Drivers
DROP POLICY IF EXISTS "drivers_self_read_write" ON public.drivers;
CREATE POLICY "drivers_self_read_write" ON public.drivers FOR ALL
  USING (
    id = public.current_app_user_id() 
    OR franchise_id = public.current_app_franchise_id()
    OR public.current_app_role() IN ('superadmin', 'master')
  );

-- 2.3 Orders (Aislamiento de Orden por Cliente, Chofer o Franquicia)
DROP POLICY IF EXISTS "orders_party_isolation" ON public.orders;
CREATE POLICY "orders_party_isolation" ON public.orders FOR SELECT
  USING (
    customer_id = public.current_app_user_id() 
    OR driver_id = public.current_app_user_id() 
    OR franchise_id = public.current_app_franchise_id()
    OR public.current_app_role() IN ('superadmin', 'master')
  );

DROP POLICY IF EXISTS "orders_customer_insert" ON public.orders;
CREATE POLICY "orders_customer_insert" ON public.orders FOR INSERT
  WITH CHECK (
    customer_id = public.current_app_user_id() 
    OR public.current_app_role() IN ('superadmin', 'master')
  );

-- 2.4 Billeteras Digitales y Transacciones
DROP POLICY IF EXISTS "wallet_accounts_owner_only" ON public.wallet_accounts;
CREATE POLICY "wallet_accounts_owner_only" ON public.wallet_accounts FOR SELECT
  USING (
    profile_id = public.current_app_user_id() 
    OR public.current_app_role() IN ('superadmin', 'master')
  );

DROP POLICY IF EXISTS "wallet_transactions_owner_only" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_owner_only" ON public.wallet_transactions FOR SELECT
  USING (
    wallet_id IN (SELECT id FROM public.wallet_accounts WHERE profile_id = public.current_app_user_id())
    OR public.current_app_role() IN ('superadmin', 'master')
  );

-- 2.5 Cuentas Bancarias y Dispositivos Push
DROP POLICY IF EXISTS "bank_accounts_owner_only" ON public.bank_accounts;
CREATE POLICY "bank_accounts_owner_only" ON public.bank_accounts FOR ALL
  USING (
    profile_id = public.current_app_user_id() 
    OR public.current_app_role() IN ('superadmin', 'master')
  );

DROP POLICY IF EXISTS "device_tokens_owner_only" ON public.device_tokens;
CREATE POLICY "device_tokens_owner_only" ON public.device_tokens FOR ALL
  USING (
    profile_id = public.current_app_user_id() 
    OR public.current_app_role() IN ('superadmin', 'master')
  );
