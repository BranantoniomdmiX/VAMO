-- =====================================================================
-- VAMO MIGRATION: 20261017_wave_a_canonical_order_convergence.sql
-- FASE: Ola A / Convergencia del Spine Canónico (Auditoría y Reconciliación Real)
-- AUTORIDAD: docs/research/VAMO_PRODUCT_BLUEPRINT_2026-10-15.md
--            docs/business/VAMO_BUSINESS_CONSTITUTION.md
--            docs/research/CURRENT_INFRASTRUCTURE_AUTHORITY_2026-10-15.md
--
-- PRINCIPIOS INMUTABLES:
-- 1. Idempotente (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, DO $$ blocks).
-- 2. No destructivo: preserva y reconcilia tablas existentes (profiles, drivers, merchants, pricing_rules, wallet_transactions, payment_intents).
-- 3. Máquina de estados: 10 estados exactos sin llegadas en enum principal.
-- 4. Tipos logísticos: DIRECT, PURCHASE, MULTI_STOP (sin categorías de negocio).
-- 5. Dimensión temporal: schedule_type = ASAP | SCHEDULED con ventanas TIMESTAMPTZ y constraints temporales.
-- 6. Modo de cumplimiento de red: fulfillment_mode = VAMO_NETWORK | OWN_FLEET | HYBRID_OVERFLOW.
-- 7. Modelo multiparada normalizado: public.order_stops.
-- 8. Auditoría inmutable de transiciones: public.order_status_history.
-- 9. Pago Conekta aditivo: public.payment_intents (order_id -> orders.id, customer_order_id nullable).
-- 10. Billeteras digitales: public.wallet_accounts y public.wallet_transactions reconciliadas de forma aditiva.
-- 11. Seguridad PIN: Eliminación absoluta de '8492' y RIGHT(code, 4). Geofence y POD real.
-- 12. RLS dual coherente: auth.uid() (Supabase) + withTrustedAuthContext (app.current_user_id) con privilegios mínimos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXTENSIÓN Y COMPONENTES BASE DE EXTENSIONES
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 2. RECONCILIACIÓN DE TABLAS BASE EXISTENTES (PROFILES, MERCHANTS, DRIVERS)
-- ---------------------------------------------------------------------

-- 2.1 public.profiles: Garantizar columnas que consume contextResolver.ts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'franchise_id') THEN
    ALTER TABLE public.profiles ADD COLUMN franchise_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'customer';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active') THEN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- 2.2 public.merchants: Garantizar profile_id y franchise_id con backfills seguros
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'profile_id') THEN
    ALTER TABLE public.merchants ADD COLUMN profile_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'franchise_id') THEN
    ALTER TABLE public.merchants ADD COLUMN franchise_id UUID;
  END IF;

  -- Backfill seguro de profile_id desde owner_user_id si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'owner_user_id') THEN
    UPDATE public.merchants
    SET profile_id = owner_user_id
    WHERE profile_id IS NULL AND owner_user_id IS NOT NULL;
  END IF;

  -- Backfill seguro de franchise_id desde commercial_franchise_id si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'commercial_franchise_id') THEN
    UPDATE public.merchants
    SET franchise_id = commercial_franchise_id
    WHERE franchise_id IS NULL AND commercial_franchise_id IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_merchants_profile_id ON public.merchants(profile_id);
CREATE INDEX IF NOT EXISTS idx_merchants_franchise_id ON public.merchants(franchise_id);

-- 2.3 public.drivers: Garantizar franchise_id, employer_merchant_id y reconciliar status CHECK
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'franchise_id') THEN
    ALTER TABLE public.drivers ADD COLUMN franchise_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'employer_merchant_id') THEN
    ALTER TABLE public.drivers ADD COLUMN employer_merchant_id UUID REFERENCES public.merchants(id);
  END IF;

  -- Garantizar columnas COD para conductores
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'cash_collected') THEN
    ALTER TABLE public.drivers ADD COLUMN cash_collected NUMERIC(10,2) NOT NULL DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'cash_limit') THEN
    ALTER TABLE public.drivers ADD COLUMN cash_limit NUMERIC(10,2) NOT NULL DEFAULT 1500.00;
  END IF;

  -- Reconciliar constraint de status para permitir tanto valores legacy (disponible, asignado, etc.)
  -- como canónicos (AVAILABLE, BUSY, PAUSED, OFFLINE) sin romper escrituras legacy
  ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS drivers_status_check;
  ALTER TABLE public.drivers ADD CONSTRAINT drivers_status_check
    CHECK (status IN (
      'AVAILABLE', 'BUSY', 'PAUSED', 'OFFLINE',
      'disponible', 'asignado', 'rumbo_comercio', 'esperando', 'recogido', 'rumbo_cliente', 'incidencia', 'pausa', 'offline'
    ));
END $$;

CREATE INDEX IF NOT EXISTS idx_drivers_employer_merchant ON public.drivers(employer_merchant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_franchise_id ON public.drivers(franchise_id);

-- ---------------------------------------------------------------------
-- 3. TABLA CANÓNICA public.orders (EVOLUCIÓN ADITIVA CON fulfillment_mode)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID,
  driver_id UUID,
  merchant_id UUID,
  franchise_id UUID,
  territory_id UUID,
  status TEXT NOT NULL DEFAULT 'PENDING',
  order_type TEXT NOT NULL DEFAULT 'DIRECT',
  schedule_type TEXT NOT NULL DEFAULT 'ASAP',
  fulfillment_mode TEXT NOT NULL DEFAULT 'VAMO_NETWORK',
  origin_address TEXT NOT NULL,
  origin_lat NUMERIC(10,7),
  origin_lng NUMERIC(10,7),
  destination_address TEXT NOT NULL,
  destination_lat NUMERIC(10,7),
  destination_lng NUMERIC(10,7),
  distance_km NUMERIC(6,2),
  duration_minutes INT,
  subtotal NUMERIC(10,2),
  delivery_fee NUMERIC(10,2),
  discount NUMERIC(10,2) DEFAULT 0.00,
  total NUMERIC(10,2),
  payment_method TEXT NOT NULL DEFAULT 'CASH',
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  pin_code VARCHAR(10),
  pickup_window_start TIMESTAMPTZ,
  pickup_window_end TIMESTAMPTZ,
  delivery_window_start TIMESTAMPTZ,
  delivery_window_end TIMESTAMPTZ,
  dispatch_not_before TIMESTAMPTZ,
  dispatch_deadline TIMESTAMPTZ,
  overflow_after_at TIMESTAMPTZ,
  arrived_origin_at TIMESTAMPTZ,
  arrived_destination_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  pod_signature_url TEXT,
  pod_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evolución aditiva si public.orders ya existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_type') THEN
    ALTER TABLE public.orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'DIRECT';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'schedule_type') THEN
    ALTER TABLE public.orders ADD COLUMN schedule_type TEXT NOT NULL DEFAULT 'ASAP';
  END IF;

  -- Reconciliar fulfillment_mode (migrar desde fleet_mode si existía)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'fulfillment_mode') THEN
    ALTER TABLE public.orders ADD COLUMN fulfillment_mode TEXT NOT NULL DEFAULT 'VAMO_NETWORK';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'fleet_mode') THEN
    UPDATE public.orders
    SET fulfillment_mode = fleet_mode
    WHERE fulfillment_mode = 'VAMO_NETWORK' AND fleet_mode IS NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'territory_id') THEN
    ALTER TABLE public.orders ADD COLUMN territory_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'pickup_window_start') THEN
    ALTER TABLE public.orders ADD COLUMN pickup_window_start TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'pickup_window_end') THEN
    ALTER TABLE public.orders ADD COLUMN pickup_window_end TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivery_window_start') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_window_start TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivery_window_end') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_window_end TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'dispatch_not_before') THEN
    ALTER TABLE public.orders ADD COLUMN dispatch_not_before TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'dispatch_deadline') THEN
    ALTER TABLE public.orders ADD COLUMN dispatch_deadline TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'overflow_after_at') THEN
    ALTER TABLE public.orders ADD COLUMN overflow_after_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'arrived_origin_at') THEN
    ALTER TABLE public.orders ADD COLUMN arrived_origin_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'arrived_destination_at') THEN
    ALTER TABLE public.orders ADD COLUMN arrived_destination_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'pin_code') THEN
    ALTER TABLE public.orders ADD COLUMN pin_code VARCHAR(10);
  END IF;

  -- Separación canónica: payment_status vs settlement_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'settlement_status') THEN
    ALTER TABLE public.orders ADD COLUMN settlement_status TEXT NOT NULL DEFAULT 'PENDING';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'settlement_at') THEN
    ALTER TABLE public.orders ADD COLUMN settlement_at TIMESTAMPTZ;
  END IF;
END $$;

ALTER TABLE public.orders ALTER COLUMN distance_km DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN subtotal DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN delivery_fee DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN total DROP NOT NULL;

-- Constraints canónicos
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'PENDING',
    'ACCEPTED_BIZ',
    'CONFIRMED',
    'PREPARING',
    'READY_BIZ',
    'READY_FOR_PICKUP',
    'DRIVER_ASSIGNED',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED'
  ));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_check
  CHECK (order_type IN ('DIRECT', 'PURCHASE', 'MULTI_STOP'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_schedule_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_schedule_type_check
  CHECK (schedule_type IN ('ASAP', 'SCHEDULED'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_fulfillment_mode_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_fulfillment_mode_check
  CHECK (fulfillment_mode IN ('VAMO_NETWORK', 'OWN_FLEET', 'HYBRID_OVERFLOW'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_settlement_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_settlement_status_check
  CHECK (settlement_status IN ('PENDING', 'SETTLED', 'FAILED', 'EXEMPT'));

-- Constraints de Integridad Temporal
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_scheduled_window_exists;
ALTER TABLE public.orders ADD CONSTRAINT chk_orders_scheduled_window_exists
  CHECK (
    schedule_type != 'SCHEDULED' 
    OR pickup_window_start IS NOT NULL 
    OR delivery_window_start IS NOT NULL
  );

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_pickup_window_order;
ALTER TABLE public.orders ADD CONSTRAINT chk_orders_pickup_window_order
  CHECK (pickup_window_end IS NULL OR pickup_window_start IS NULL OR pickup_window_end >= pickup_window_start);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_delivery_window_order;
ALTER TABLE public.orders ADD CONSTRAINT chk_orders_delivery_window_order
  CHECK (delivery_window_end IS NULL OR delivery_window_start IS NULL OR delivery_window_end >= delivery_window_start);

-- ---------------------------------------------------------------------
-- 4. MODELO MULTIPARADA NORMALIZADO: public.order_stops
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sequence_index INT NOT NULL DEFAULT 1,
  stop_type TEXT NOT NULL CHECK (stop_type IN ('PICKUP', 'DROPOFF', 'WAYPOINT')),
  address TEXT NOT NULL,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  notes TEXT,
  scheduled_window_start TIMESTAMPTZ,
  scheduled_window_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ARRIVED', 'COMPLETED', 'FAILED', 'SKIPPED')),
  pod_pin_code VARCHAR(10),
  pod_signature_url TEXT,
  pod_photo_url TEXT,
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, sequence_index)
);

CREATE INDEX IF NOT EXISTS idx_order_stops_order_id ON public.order_stops(order_id);
CREATE INDEX IF NOT EXISTS idx_order_stops_coords ON public.order_stops(lat, lng);

-- ---------------------------------------------------------------------
-- 5. HISTORIAL INMUTABLE DE ESTADOS: public.order_status_history
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id UUID,
  actor_role TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at DESC);

CREATE OR REPLACE FUNCTION public.fn_track_order_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.order_status_history (
      order_id,
      from_status,
      to_status,
      actor_id,
      actor_role,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      NEW.status,
      COALESCE(auth.uid(), NULLIF(current_setting('app.current_user_id', true), '')::uuid),
      COALESCE(NULLIF(current_setting('app.current_role', true), ''), 'service_role'),
      'Transition: ' || NEW.status,
      jsonb_build_object(
        'fulfillment_mode', NEW.fulfillment_mode,
        'driver_id', NEW.driver_id,
        'updated_at', NEW.updated_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_order_status_history ON public.orders;
CREATE TRIGGER trg_track_order_status_history
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_track_order_status_history();

-- ---------------------------------------------------------------------
-- 6. RECONCILIACIÓN Y EVOLUCIÓN ADITIVA: public.payment_intents
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id     UUID,
  order_id              UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  gateway               TEXT NOT NULL DEFAULT 'conekta',
  gateway_order_id      TEXT NOT NULL,
  gateway_payment_url   TEXT,
  amount                NUMERIC(10,2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'MXN',
  status                TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'EXPIRED', 'DECLINED')),
  payment_method_type   TEXT CHECK (payment_method_type IN ('card', 'oxxo_cash', 'spei', 'cash', 'wallet')),
  card_last4            TEXT,
  card_brand            TEXT,
  card_bank             TEXT,
  payment_reference     TEXT,
  payment_expires_at    TIMESTAMPTZ,
  webhook_received_at   TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  failed_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payment_intents' 
      AND column_name = 'customer_order_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.payment_intents ALTER COLUMN customer_order_id DROP NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payment_intents' 
      AND column_name = 'order_id'
  ) THEN
    ALTER TABLE public.payment_intents ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_intents_canonical_order_id ON public.payment_intents(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_intents_gateway_order ON public.payment_intents(gateway_order_id);

-- ---------------------------------------------------------------------
-- 7. BILLETERAS DIGITALES: WALLET ACCOUNTS Y EVOLUCIÓN ADITIVA DE WALLET TRANSACTIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  held_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallet_accounts(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'wallet_id') THEN
    ALTER TABLE public.wallet_transactions ADD COLUMN wallet_id UUID REFERENCES public.wallet_accounts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'order_id') THEN
    ALTER TABLE public.wallet_transactions ADD COLUMN order_id UUID REFERENCES public.orders(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'balance_before') THEN
    ALTER TABLE public.wallet_transactions ADD COLUMN balance_before NUMERIC(12,2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'balance_after') THEN
    ALTER TABLE public.wallet_transactions ADD COLUMN balance_after NUMERIC(12,2) DEFAULT 0.00;
  END IF;

  -- 🛡️ REGLA: Reconciliar wallet_transactions con el esquema REAL legacy (tenant_id y user_id).
  -- Si existen como columnas NOT NULL en la base existente, asegurar que sean nullable para inserciones canónicas
  -- o mantener su soporte aditivo.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'tenant_id' AND is_nullable = 'NO') THEN
    ALTER TABLE public.wallet_transactions ALTER COLUMN tenant_id DROP NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'user_id' AND is_nullable = 'NO') THEN
    ALTER TABLE public.wallet_transactions ALTER COLUMN user_id DROP NOT NULL;
  END IF;

  -- Garantizar que existan las columnas si la tabla se crea de cero
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.wallet_transactions ADD COLUMN tenant_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'user_id') THEN
    ALTER TABLE public.wallet_transactions ADD COLUMN user_id UUID;
  END IF;

  -- Reconciliar CHECK de types para permitir todos los tipos canónicos y legacy sin conflicto
  ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
  ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check
    CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'EARNING', 'COMMISSION', 'CASH_CLEARING', 'REFUND', 'BONUS', 'WEEKLY_FEE', 'PAYOUT'));
END $$;

-- 🛡️ REGLA: Reconciliar financial_ledger existente agregando order_id aditivamente con FK e índice
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_ledger') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'financial_ledger' AND column_name = 'order_id') THEN
      ALTER TABLE public.financial_ledger ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
    END IF;
  ELSE
    CREATE TABLE public.financial_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
      customer_order_id UUID,
      entry_type TEXT NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      balance_before NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      balance_after NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_ledger_order_id ON public.financial_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_profile ON public.wallet_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order ON public.wallet_transactions(order_id);

-- ---------------------------------------------------------------------
-- 8. FUNCIONES FINANCIERAS CRÍTICAS (ensure_wallet_account, process_order_settlement, request_wallet_withdrawal)
-- ---------------------------------------------------------------------

-- 8.1 Helper para asegurar o inicializar la billetera digital
CREATE OR REPLACE FUNCTION public.ensure_wallet_account(p_profile_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet_id UUID;
  v_actor_user_id UUID;
  v_actor_role TEXT;
BEGIN
  v_actor_user_id := public.current_app_user_id();
  v_actor_role := public.current_app_role();

  -- Un usuario normal solo puede consultar/asegurar su propia billetera, a menos que sea rol administrativo o ejecucion interna
  IF v_actor_role NOT IN ('superadmin', 'master') AND v_actor_user_id IS NOT NULL AND v_actor_user_id != p_profile_id THEN
    RAISE EXCEPTION 'Acceso denegado a billetera ajena' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_wallet_id
  FROM public.wallet_accounts
  WHERE profile_id = p_profile_id;

  IF NOT FOUND THEN
    INSERT INTO public.wallet_accounts (profile_id, balance, held_balance, currency)
    VALUES (p_profile_id, 0.00, 0.00, 'MXN')
    ON CONFLICT (profile_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_wallet_id;
  END IF;

  RETURN v_wallet_id;
END;
$$;

-- 8.2 Liquidación Financiera Canónica (100% flete al conductor, 0% comisión por viaje)
CREATE OR REPLACE FUNCTION public.process_order_settlement(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_driver_wallet UUID;
  v_delivery_fee NUMERIC(10,2);
  v_driver_payout NUMERIC(10,2);
  v_cur_bal NUMERIC(12,2);
  v_new_bal NUMERIC(12,2);
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_FOUND', 'message', 'Pedido no encontrado.');
  END IF;

  IF v_order.status != 'DELIVERED' THEN
    RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_DELIVERED', 'message', 'El pedido aún no ha sido marcado como entregado.');
  END IF;

  -- 🛡️ REGLA: Separar por completo payment_status de settlement_status.
  -- Idempotencia financiera específica de settlement mediante settlement_status = 'SETTLED'
  IF v_order.settlement_status = 'SETTLED' THEN
    RETURN jsonb_build_object('success', true, 'code', 'ALREADY_SETTLED', 'message', 'El pedido ya fue liquidado contablemente con anterioridad (idempotente).');
  END IF;

  v_delivery_fee := COALESCE(v_order.delivery_fee, 0.00);
  v_driver_payout := v_delivery_fee;

  IF v_order.payment_method = 'CASH' THEN
    IF v_order.driver_id IS NOT NULL THEN
      UPDATE public.drivers
      SET cash_collected = cash_collected + v_order.total
      WHERE id = v_order.driver_id;
    END IF;
    -- Para efectivo al repartidor, marcar payment_status como PAID al entregar
    UPDATE public.orders
    SET payment_status = 'PAID'
    WHERE id = p_order_id AND payment_status != 'PAID';
  ELSE
    IF v_order.driver_id IS NOT NULL THEN
      v_driver_wallet := public.ensure_wallet_account(v_order.driver_id);

      SELECT balance INTO v_cur_bal
      FROM public.wallet_accounts
      WHERE id = v_driver_wallet
      FOR UPDATE;

      v_new_bal := v_cur_bal + v_driver_payout;

      UPDATE public.wallet_accounts
      SET balance = v_new_bal, updated_at = NOW()
      WHERE id = v_driver_wallet;

      -- Poblar wallet_id, order_id y campos de compatibilidad legacy tenant_id / user_id
      INSERT INTO public.wallet_transactions (
        wallet_id, order_id, tenant_id, user_id, type, amount, balance_before, balance_after, description
      ) VALUES (
        v_driver_wallet, p_order_id, v_order.franchise_id, v_order.driver_id, 'EARNING', v_driver_payout, v_cur_bal, v_new_bal,
        'Tarifa de entrega 100% conductor #' || v_order.code
      );
    END IF;
  END IF;

  -- Marcar liquidación como SETTLED
  UPDATE public.orders
  SET settlement_status = 'SETTLED', settlement_at = NOW(), updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'SETTLEMENT_COMPLETED',
    'message', 'Liquidación completada con economía canónica VAMO: 0% comisión por viaje.',
    'commission_total', 0.00,
    'commission_plaza', 0.00,
    'commission_master', 0.00,
    'driver_payout', v_driver_payout
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'SETTLEMENT_ERROR', 'message', SQLERRM);
END;
$$;

-- 8.3 Solicitud de Retiro de Billetera (SPEI) — Endurecida (🛡️ REGLA 11)
CREATE OR REPLACE FUNCTION public.request_wallet_withdrawal(
  p_profile_id UUID,
  p_amount NUMERIC(12,2),
  p_clabe TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet_id UUID;
  v_cur_bal NUMERIC(12,2);
  v_new_bal NUMERIC(12,2);
  v_new_held NUMERIC(12,2);
  v_actor_user_id UUID;
  v_actor_role TEXT;
  v_masked_clabe TEXT;
BEGIN
  -- 🛡️ REGLA 11: Validar actor autenticado. Un usuario normal sólo puede retirar de su propio profile_id.
  v_actor_user_id := public.current_app_user_id();
  v_actor_role := public.current_app_role();

  IF v_actor_role NOT IN ('superadmin', 'master') THEN
    IF v_actor_user_id IS NULL OR v_actor_user_id != p_profile_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'FORBIDDEN_WITHDRAWAL',
        'message', 'Solo el titular autenticado de la cuenta o un administrador puede solicitar un retiro.'
      );
    END IF;
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_AMOUNT', 'message', 'El monto a retirar debe ser mayor a 0.');
  END IF;

  IF p_clabe IS NULL OR LENGTH(TRIM(p_clabe)) != 18 THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_CLABE', 'message', 'La cuenta CLABE interbancaria debe ser de 18 dígitos.');
  END IF;

  -- Enmascarar CLABE (solo últimos 4 dígitos visibles)
  v_masked_clabe := '************' || RIGHT(TRIM(p_clabe), 4);

  v_wallet_id := public.ensure_wallet_account(p_profile_id);

  SELECT balance, held_balance INTO v_cur_bal, v_new_held
  FROM public.wallet_accounts
  WHERE id = v_wallet_id
  FOR UPDATE;

  IF v_cur_bal < p_amount THEN
    RETURN jsonb_build_object('success', false, 'code', 'INSUFFICIENT_FUNDS', 'message', 'Saldo insuficiente para realizar el retiro.');
  END IF;

  v_new_bal := v_cur_bal - p_amount;
  v_new_held := v_new_held + p_amount;

  UPDATE public.wallet_accounts
  SET balance = v_new_bal, held_balance = v_new_held, updated_at = NOW()
  WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, description)
  VALUES (v_wallet_id, p_profile_id, 'WITHDRAWAL', -p_amount, v_cur_bal, v_new_bal, 'Solicitud de retiro SPEI a cuenta CLABE: ' || v_masked_clabe);

  RETURN jsonb_build_object(
    'success', true,
    'code', 'WITHDRAWAL_REQUESTED',
    'message', 'Retiro solicitado con éxito. En proceso de dispersión.',
    'amount', p_amount,
    'remaining_balance', v_new_bal,
    'masked_clabe', v_masked_clabe
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'WITHDRAWAL_ERROR', 'message', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------
-- 9. PRICING RULES: PRESERVACIÓN DE COLUMNAS EXISTENTES Y ADICIONES
-- ---------------------------------------------------------------------
-- Columnas canónicas en BD existente: base_fare, included_km, price_per_extra_km, price_per_extra_stop
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID,
  city_id UUID,
  territory_id UUID,
  name TEXT NOT NULL,
  base_fare NUMERIC(10,2) NOT NULL DEFAULT 35.00,
  included_km NUMERIC(5,2) NOT NULL DEFAULT 2.00,
  price_per_extra_km NUMERIC(10,2) NOT NULL DEFAULT 8.00,
  price_per_extra_stop NUMERIC(10,2) NOT NULL DEFAULT 15.00,
  gateway_fee_percent NUMERIC(5,2) DEFAULT NULL,
  gateway_fixed_fee NUMERIC(10,2) DEFAULT NULL,
  operational_dispatch_buffer_minutes INT NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pricing_rules' AND column_name = 'franchise_id') THEN
    ALTER TABLE public.pricing_rules ADD COLUMN franchise_id UUID;
  END IF;

  -- 🛡️ REGLA 6: gateway_fee_percent y gateway_fixed_fee son configurables y nullable hasta contar con valor vigente aprobado.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pricing_rules' AND column_name = 'gateway_fee_percent') THEN
    ALTER TABLE public.pricing_rules ADD COLUMN gateway_fee_percent NUMERIC(5,2) DEFAULT NULL;
  ELSE
    ALTER TABLE public.pricing_rules ALTER COLUMN gateway_fee_percent DROP NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pricing_rules' AND column_name = 'gateway_fixed_fee') THEN
    ALTER TABLE public.pricing_rules ADD COLUMN gateway_fixed_fee NUMERIC(10,2) DEFAULT NULL;
  ELSE
    ALTER TABLE public.pricing_rules ALTER COLUMN gateway_fixed_fee DROP NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pricing_rules' AND column_name = 'operational_dispatch_buffer_minutes') THEN
    ALTER TABLE public.pricing_rules ADD COLUMN operational_dispatch_buffer_minutes INT NOT NULL DEFAULT 15;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pricing_rules' AND column_name = 'price_per_extra_stop') THEN
    ALTER TABLE public.pricing_rules ADD COLUMN price_per_extra_stop NUMERIC(10,2) NOT NULL DEFAULT 15.00;
  END IF;

  -- Compatibilidad con instalaciones previas: Si existía base_km_included, sincronizar con included_km
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pricing_rules' AND column_name = 'base_km_included') THEN
    UPDATE public.pricing_rules SET included_km = base_km_included WHERE included_km IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pricing_rules' AND column_name = 'per_km_rate') THEN
    UPDATE public.pricing_rules SET price_per_extra_km = per_km_rate WHERE price_per_extra_km IS NULL;
  END IF;
END $$;

INSERT INTO public.pricing_rules (
  name, base_fare, included_km, price_per_extra_km, price_per_extra_stop,
  operational_dispatch_buffer_minutes, is_active
)
SELECT 'Regla Piloto Base', 35.00, 2.00, 8.00, 15.00, 15, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE is_active = TRUE);

-- ---------------------------------------------------------------------
-- 10. VERIFICACIÓN ATÓMICA DE ENTREGA POD CON GEOFENCE REAL
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_order_pod(
  p_order_id UUID,
  p_pin TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_lat NUMERIC DEFAULT NULL,
  p_lng NUMERIC DEFAULT NULL,
  p_exception_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_actor_user_id UUID;
  v_actor_role TEXT;
  v_settlement_res JSONB;
  v_distance_meters NUMERIC;
BEGIN
  v_actor_user_id := COALESCE(auth.uid(), NULLIF(current_setting('app.current_user_id', true), '')::uuid);
  v_actor_role := COALESCE(NULLIF(current_setting('app.current_role', true), ''), 'anon');

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_FOUND', 'message', 'El pedido especificado no existe.');
  END IF;

  -- 1. Validar identidad del conductor
  IF v_actor_role NOT IN ('superadmin', 'master') THEN
    IF v_actor_user_id IS NULL OR v_order.driver_id IS NULL OR v_order.driver_id != v_actor_user_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'FORBIDDEN_WRONG_DRIVER',
        'message', 'Solo el conductor asignado a este pedido puede registrar la entrega.'
      );
    END IF;
  END IF;

  -- 2. Idempotencia: Si ya está DELIVERED, retornar éxito sin repetir liquidación
  IF v_order.status = 'DELIVERED' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_DELIVERED',
      'message', 'Este pedido ya fue marcado como entregado anteriormente.'
    );
  END IF;

  -- 3. Validación de PIN estricta (Eliminación absoluta de '8492' y RIGHT(code, 4))
  IF p_pin IS NULL OR TRIM(p_pin) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'PIN_REQUIRED',
      'message', 'El código PIN del cliente es obligatorio para confirmar la entrega.'
    );
  END IF;

  IF v_order.pin_code IS NULL OR TRIM(p_pin) != TRIM(v_order.pin_code) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_PIN',
      'message', 'El código PIN ingresado es incorrecto. Solicítalo nuevamente al cliente.'
    );
  END IF;

  -- 4. Geofence Real: Calcular distancia con destino de la orden
  IF v_order.destination_lat IS NOT NULL AND v_order.destination_lng IS NOT NULL AND p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    -- Fórmula de Haversine en metros
    v_distance_meters := 6371000 * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS(p_lat - v_order.destination_lat) / 2), 2) +
      COS(RADIANS(v_order.destination_lat)) * COS(RADIANS(p_lat)) *
      POWER(SIN(RADIANS(p_lng - v_order.destination_lng) / 2), 2)
    ));

    IF v_distance_meters > 50 THEN
      -- Excepción auditada por GPS de baja precisión: Exige PIN exacto + foto obligatoria + coordenadas + motivo registrado
      IF p_photo_url IS NULL OR TRIM(p_photo_url) = '' OR p_exception_reason IS NULL OR TRIM(p_exception_reason) = '' THEN
        RETURN jsonb_build_object(
          'success', false,
          'code', 'GEOFENCE_EXCEEDED',
          'message', 'Se encuentra a ' || ROUND(v_distance_meters) || 'm del destino. Para entrega fuera de rango se requiere foto POD obligatoria y motivo auditado.'
        );
      END IF;
    END IF;
  END IF;

  -- 5. Marcar orden como entregada
  UPDATE public.orders
  SET 
    status = 'DELIVERED',
    arrived_destination_at = COALESCE(arrived_destination_at, NOW()),
    delivered_at = NOW(),
    pod_photo_url = COALESCE(p_photo_url, pod_photo_url),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- 6. Liberar al conductor
  IF v_order.driver_id IS NOT NULL THEN
    UPDATE public.drivers
    SET status = 'AVAILABLE'
    WHERE id = v_order.driver_id;
  END IF;

  -- 7. Liquidación contable atómica (🛡️ REGLA 10: verify_order_pod NO puede devolver success:true si settlement falla)
  v_settlement_res := public.process_order_settlement(p_order_id);

  IF (v_settlement_res ->> 'success')::boolean IS NOT TRUE THEN
    -- Forzar fallo transaccional para que no quede como DELIVERED sin liquidación exitosa
    RAISE EXCEPTION 'Fallo crítico en liquidación financiera: % (Código: %)', 
      COALESCE(v_settlement_res ->> 'message', 'Error desconocido'),
      COALESCE(v_settlement_res ->> 'code', 'SETTLEMENT_FAILED');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'ORDER_DELIVERED',
    'message', '¡Entrega confirmada exitosamente! Pedido finalizado y fondos liquidados.',
    'order_id', p_order_id,
    'order_code', v_order.code,
    'settlement', v_settlement_res
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'SETTLEMENT_FAILED', 'message', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------
-- 11. ASIGNACIÓN ATÓMICA DE PEDIDOS (assign_order_atomic) CON VALIDACIÓN COMPLETA
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_order_atomic(
  p_order_id UUID,
  p_driver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_driver RECORD;
  v_actor_user_id UUID;
  v_actor_role TEXT;
  v_actor_franchise_id UUID;
  v_is_employer_driver BOOLEAN := false;
BEGIN
  v_actor_user_id := COALESCE(auth.uid(), NULLIF(current_setting('app.current_user_id', true), '')::uuid);
  v_actor_role := COALESCE(NULLIF(current_setting('app.current_role', true), ''), 'anon');
  v_actor_franchise_id := COALESCE(
    NULLIF(current_setting('app.current_franchise_id', true), '')::uuid,
    (auth.jwt() ->> 'franchise_id')::uuid
  );

  -- 1. Validación de Invocador y Autoridad
  IF v_actor_role = 'driver' THEN
    IF v_actor_user_id IS NULL OR v_actor_user_id != p_driver_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'FORBIDDEN_DRIVER_IMPERSONATION',
        'message', 'Un conductor solo puede aceptar pedidos para sí mismo.'
      );
    END IF;
  ELSIF v_actor_role NOT IN ('superadmin', 'master', 'dispatcher') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'FORBIDDEN_ROLE',
      'message', 'El rol actual no tiene autorización para asignar pedidos.'
    );
  END IF;

  -- 2. Bloqueo pesimista de la orden
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_FOUND', 'message', 'El pedido no existe.');
  END IF;

  -- Validar anti cross-franchise para despachadores o conductores de plaza
  IF v_actor_role NOT IN ('superadmin', 'master') THEN
    IF v_actor_franchise_id IS NOT NULL AND v_order.franchise_id IS NOT NULL AND v_actor_franchise_id != v_order.franchise_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'FORBIDDEN_FRANCHISE_MISMATCH',
        'message', 'No tiene autorización para operar pedidos de otra franquicia o plaza.'
      );
    END IF;
  END IF;

  -- Si ya está tomado por otro chofer
  IF v_order.driver_id IS NOT NULL AND v_order.driver_id != p_driver_id THEN
    RETURN jsonb_build_object('success', false, 'code', 'ORDER_ALREADY_TAKEN', 'message', 'Este pedido ya fue asignado a otro conductor.');
  END IF;

  -- Validar estados elegibles para asignación
  IF v_order.status NOT IN ('PENDING', 'ACCEPTED_BIZ', 'CONFIRMED', 'PREPARING', 'READY_BIZ', 'READY_FOR_PICKUP') THEN
    RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_DISPATCHABLE', 'message', 'El pedido ya no se encuentra disponible para despacho.');
  END IF;

  -- 🛡️ REGLA 3: Ninguna orden con distance_km IS NULL, delivery_fee IS NULL o total IS NULL puede ser aceptada
  IF v_order.distance_km IS NULL OR v_order.delivery_fee IS NULL OR v_order.total IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ORDER_PRICING_INCOMPLETE',
      'message', 'El pedido no cuenta con cálculo autoritativo de distancia y tarifa. No puede ser asignado.'
    );
  END IF;

  -- 🛡️ REGLA 2: Validación de horario SCHEDULED (Fail-closed si dispatch_not_before es NULL o futuro)
  IF v_order.schedule_type = 'SCHEDULED' THEN
    IF v_order.dispatch_not_before IS NULL OR NOW() < v_order.dispatch_not_before THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'ORDER_SCHEDULED_NOT_READY',
        'message', 'El pedido programado aún no alcanza su ventana de despacho autorizada o carece de dispatch_not_before.'
      );
    END IF;
  END IF;

  -- 3. Bloqueo del conductor y validación de disponibilidad
  SELECT * INTO v_driver
  FROM public.drivers
  WHERE id = p_driver_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'DRIVER_NOT_FOUND', 'message', 'El conductor no fue encontrado.');
  END IF;

  IF v_driver.status NOT IN ('AVAILABLE', 'BUSY') THEN
    RETURN jsonb_build_object('success', false, 'code', 'DRIVER_NOT_AVAILABLE', 'message', 'El conductor no está disponible para asignaciones.');
  END IF;

  -- Validar si el conductor pertenece a la flota privada del comercio
  IF v_order.merchant_id IS NOT NULL THEN
    v_is_employer_driver := (v_driver.employer_merchant_id = v_order.merchant_id);
  END IF;

  -- Validación de Regla de Cumplimiento (fulfillment_mode)
  IF v_order.fulfillment_mode = 'OWN_FLEET' THEN
    IF NOT v_is_employer_driver THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'FORBIDDEN_OWN_FLEET_ONLY',
        'message', 'Este pedido pertenece exclusivamente a la flota privada del comercio.'
      );
    END IF;
  ELSIF v_order.fulfillment_mode = 'HYBRID_OVERFLOW' THEN
    IF NOT v_is_employer_driver THEN
      IF v_order.overflow_after_at IS NOT NULL AND NOW() < v_order.overflow_after_at THEN
        RETURN jsonb_build_object(
          'success', false,
          'code', 'HYBRID_WAITING_FOR_OVERFLOW',
          'message', 'El pedido está reservado temporalmente para la flota del comercio antes de su desborde a la Red VAMO.'
        );
      END IF;
    END IF;
  END IF;

  -- 4. Actualizar estado y asignar orden
  UPDATE public.orders
  SET
    driver_id = p_driver_id,
    status = 'DRIVER_ASSIGNED',
    updated_at = NOW()
  WHERE id = p_order_id;

  UPDATE public.drivers
  SET
    status = 'BUSY'
  WHERE id = p_driver_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'ORDER_ASSIGNED',
    'message', 'Pedido asignado exitosamente al conductor.',
    'order_id', p_order_id,
    'driver_id', p_driver_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'INTERNAL_ERROR', 'message', SQLERRM);
END;
$$;

-- ---------------------------------------------------------------------
-- 12. RLS RECONCILIADO Y CIERRE DE SUPERFICIE DE ATAQUE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_app_user_id() RETURNS UUID AS $$
  SELECT COALESCE(
    auth.uid(),
    NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.current_app_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_role', true), ''),
    (auth.jwt() ->> 'user_role'),
    'anon'
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.current_app_franchise_id() RETURNS UUID AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_franchise_id', true), '')::uuid,
    (auth.jwt() ->> 'franchise_id')::uuid
  );
$$ LANGUAGE sql STABLE;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

-- 12.1 Políticas para public.orders
DROP POLICY IF EXISTS "orders_party_isolation" ON public.orders;
CREATE POLICY "orders_party_isolation" ON public.orders FOR SELECT
  USING (
    customer_id = public.current_app_user_id() 
    OR driver_id = public.current_app_user_id()
    OR (merchant_id IS NOT NULL AND merchant_id IN (
      SELECT id FROM public.merchants WHERE profile_id = public.current_app_user_id()
    ))
    OR franchise_id = public.current_app_franchise_id()
    OR public.current_app_role() IN ('superadmin', 'master', 'dispatcher')
  );

DROP POLICY IF EXISTS "orders_customer_insert" ON public.orders;
CREATE POLICY "orders_customer_insert" ON public.orders FOR INSERT
  WITH CHECK (
    customer_id = public.current_app_user_id() 
    OR public.current_app_role() IN ('superadmin', 'master')
  );

-- Privilegios mínimos: Los roles operativos solo actualizan vía funciones RPC controladas o roles admin
DROP POLICY IF EXISTS "orders_admin_dispatcher_update" ON public.orders;
CREATE POLICY "orders_admin_dispatcher_update" ON public.orders FOR UPDATE
  USING (
    public.current_app_role() IN ('superadmin', 'master', 'dispatcher')
  );

-- 12.2 Políticas para public.order_stops
DROP POLICY IF EXISTS "order_stops_access_policy" ON public.order_stops;
CREATE POLICY "order_stops_access_policy" ON public.order_stops FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_stops.order_id
        AND (
          o.customer_id = public.current_app_user_id()
          OR o.driver_id = public.current_app_user_id()
          OR o.franchise_id = public.current_app_franchise_id()
          OR public.current_app_role() IN ('superadmin', 'master', 'dispatcher')
        )
    )
  );

-- 12.3 Políticas para public.wallet_accounts y wallet_transactions
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

-- 12.4 Políticas para public.payment_intents (🛡️ REGLA 13)
DROP POLICY IF EXISTS "customer_can_view_own_payment_intents" ON public.payment_intents;
CREATE POLICY "customer_can_view_own_payment_intents" ON public.payment_intents FOR SELECT
  USING (
    (order_id IS NOT NULL AND order_id IN (SELECT id FROM public.orders WHERE customer_id = public.current_app_user_id()))
    OR (customer_order_id IS NOT NULL AND customer_order_id IN (SELECT id FROM public.customer_orders WHERE customer_id = public.current_app_user_id()))
    OR public.current_app_role() IN ('superadmin', 'master')
  );

-- 12.5 Cierre estricto de public.merchant_orders (Aislamiento Multi-Tenant) (🛡️ REGLA 12)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_orders') THEN
    ALTER TABLE public.merchant_orders ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Lectura de pedidos por comercios y usuarios" ON public.merchant_orders;
    DROP POLICY IF EXISTS "Inserción y actualización de pedidos por gerencia y cocina" ON public.merchant_orders;
    DROP POLICY IF EXISTS "merchant_orders_isolated_select" ON public.merchant_orders;
    DROP POLICY IF EXISTS "merchant_orders_isolated_write" ON public.merchant_orders;
    
    CREATE POLICY "merchant_orders_isolated_select" ON public.merchant_orders FOR SELECT
      USING (
        public.current_app_role() IN ('superadmin', 'master')
        OR (tenant_id IS NOT NULL AND tenant_id = public.current_app_franchise_id())
        OR (tenant_id IS NOT NULL AND tenant_id IN (SELECT m.id FROM public.merchants m WHERE m.profile_id = public.current_app_user_id()))
      );

    CREATE POLICY "merchant_orders_isolated_write" ON public.merchant_orders FOR ALL
      USING (
        public.current_app_role() IN ('superadmin', 'master')
        OR (tenant_id IS NOT NULL AND tenant_id IN (SELECT m.id FROM public.merchants m WHERE m.profile_id = public.current_app_user_id()))
      );
  END IF;
END $$;

-- 12.6 Permisos y Grants Mínimos (🛡️ REGLA 11)
REVOKE EXECUTE ON FUNCTION public.process_order_settlement(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_order_atomic(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_order_pod(UUID, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.request_wallet_withdrawal(UUID, NUMERIC, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_wallet_account(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.assign_order_atomic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_order_pod(UUID, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_wallet_withdrawal(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_wallet_account(UUID) TO authenticated;

GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_stops TO authenticated;
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT SELECT ON public.pricing_rules TO anon, authenticated;
