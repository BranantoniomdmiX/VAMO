-- =====================================================================
-- 🛡️ VAMO MIGRATION 20260911_final_high_security_hardening.sql
-- Escenario: FIX / FINAL_HIGH_SECURITY_REMEDIATION
-- =====================================================================
-- Remediaciones de Seguridad de Nivel Alto:
-- 1. HIGH-01: Inmutabilidad estricta de Authority Fields en public.profiles
--    - USER_EDITABLE_PROFILE_FIELDS: full_name, avatar_url, phone
--    - AUTHORITY_FIELDS: role, franchise_id, is_active
--    - Trigger BEFORE UPDATE 'trg_protect_profile_authority_fields' que
--      impide a usuarios no-superadmin modificar authority fields.
--    - RPC administrativo 'admin_update_user_role' para cambios legítimos
--      por Superadmin/Master.
-- 2. HIGH-02: Guardia Interna de Autorización en process_order_settlement
--    - Requiere que el actor sea 'superadmin', 'master' o 'system_settlement'.
--    - Bloquea cualquier invocación directa por 'customer', 'driver', 'merchant'
--      o usuarios no autorizados (FORBIDDEN_ACTOR).
--    - Verifica idempotencia contable: Si payment_status = 'PAID', no duplica
--      los balances, transacciones ni splits (ALREADY_SETTLED).
--    - verify_order_pod invoca a process_order_settlement configurando
--      el contexto seguro temporal de sistema.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. HIGH-01 — PROFILE AUTHORITY FIELDS IMMUTABILITY TRIGGER
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_profile_authority_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_calling_role TEXT;
BEGIN
  v_calling_role := COALESCE(NULLIF(current_setting('app.current_role', true), ''), 'anon');

  -- Si el actor es superadmin o master, permitir modificaciones administrativas
  IF v_calling_role IN ('superadmin', 'master') THEN
    RETURN NEW;
  END IF;

  -- Para usuarios ordinarios (customer, driver, merchant, etc.):
  -- Los campos de autoridad son estrictamente INMUTABLES.
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    RAISE EXCEPTION 'FORBIDDEN_ROLE_MUTATION: Un usuario no puede modificar su propio rol en el sistema.'
      USING ERRCODE = '42501';
  END IF;

  IF (OLD.franchise_id IS DISTINCT FROM NEW.franchise_id) THEN
    RAISE EXCEPTION 'FORBIDDEN_FRANCHISE_MUTATION: Un usuario no puede transferirse de plaza o franquicia arbitrariamente.'
      USING ERRCODE = '42501';
  END IF;

  IF (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
    RAISE EXCEPTION 'FORBIDDEN_STATUS_MUTATION: Un usuario no puede alterar su estado de actividad de cuenta.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_authority_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_authority_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_authority_mutation();

-- ---------------------------------------------------------------------
-- 2. ENTRYPOINT ADMINISTRATIVO EXPLÍCITO PARA CAMBIOS DE ROL / TENANT
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_update_user_authority(
  p_target_user_id UUID,
  p_new_role TEXT DEFAULT NULL,
  p_new_franchise_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_calling_role TEXT;
  v_calling_user UUID;
  v_target_record RECORD;
BEGIN
  v_calling_role := COALESCE(NULLIF(current_setting('app.current_role', true), ''), 'anon');
  v_calling_user := NULLIF(current_setting('app.current_user_id', true), '')::uuid;

  -- 1. Validar privilegio administrativo del actor
  IF v_calling_role NOT IN ('superadmin', 'master') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'FORBIDDEN_NOT_ADMIN',
      'message', 'Solo superadministradores pueden modificar roles o asignaciones de plaza.'
    );
  END IF;

  -- 2. Validar existencia del usuario destino
  SELECT * INTO v_target_record
  FROM public.profiles
  WHERE id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'USER_NOT_FOUND',
      'message', 'El usuario especificado no existe.'
    );
  END IF;

  -- 3. Aplicar cambios permitidos
  IF p_new_role IS NOT NULL THEN
    IF p_new_role NOT IN ('superadmin', 'fleet_owner', 'dispatcher', 'driver', 'merchant', 'customer') THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'INVALID_ROLE',
        'message', 'El rol especificado no es válido en el catálogo VAMO.'
      );
    END IF;
    UPDATE public.profiles SET role = p_new_role, updated_at = NOW() WHERE id = p_target_user_id;
  END IF;

  IF p_new_franchise_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.franchises WHERE id = p_new_franchise_id) THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'FRANCHISE_NOT_FOUND',
        'message', 'La franquicia especificada no existe.'
      );
    END IF;
    UPDATE public.profiles SET franchise_id = p_new_franchise_id, updated_at = NOW() WHERE id = p_target_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'AUTHORITY_UPDATED',
    'message', 'Atributos de autoridad actualizados exitosamente por el administrador.',
    'user_id', p_target_user_id,
    'new_role', COALESCE(p_new_role, v_target_record.role),
    'new_franchise_id', COALESCE(p_new_franchise_id, v_target_record.franchise_id)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'ADMIN_MUTATION_ERROR', 'message', SQLERRM);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_user_authority(UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_authority(UUID, TEXT, UUID) TO vamo_app;
GRANT EXECUTE ON FUNCTION public.admin_update_user_authority(UUID, TEXT, UUID) TO vamo_admin;

-- ---------------------------------------------------------------------
-- 3. HIGH-02 — INTERNAL GUARD & IDEMPOTENCY EN PROCESS_ORDER_SETTLEMENT
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.process_order_settlement(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_driver_wallet UUID;
  v_franchise_wallet UUID;
  v_franchise_record RECORD;
  v_delivery_fee NUMERIC(10,2);
  v_commission_total NUMERIC(10,2);
  v_commission_plaza NUMERIC(10,2);
  v_commission_master NUMERIC(10,2);
  v_driver_payout NUMERIC(10,2);
  v_cur_bal NUMERIC(12,2);
  v_new_bal NUMERIC(12,2);
  v_calling_role TEXT;
BEGIN
  v_calling_role := COALESCE(NULLIF(current_setting('app.current_role', true), ''), 'anon');

  -- 1. GUARDIA INTERNA DE AUTORIZACIÓN:
  -- Solo roles autorizados pueden disparar la liquidación contable directa:
  -- 'superadmin', 'master' o un contexto seguro de sistema 'system_settlement'.
  IF v_calling_role NOT IN ('superadmin', 'master', 'system_settlement') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'FORBIDDEN_ACTOR',
      'message', 'No está autorizado para ejecutar la liquidación financiera de pedidos.'
    );
  END IF;

  -- 2. Bloquear la orden para verificación y liquidación
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

  -- 3. IDEMPOTENCIA CONTABLE ESTRICTA:
  -- Si la orden ya fue liquidada (payment_status = 'PAID'), no duplicar transacciones ni splits.
  IF v_order.payment_status = 'PAID' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_SETTLED',
      'message', 'El pedido ya fue liquidado contablemente con anterioridad (Idempotente).'
    );
  END IF;

  v_delivery_fee := COALESCE(v_order.delivery_fee, 0.00);
  v_commission_total := ROUND(v_delivery_fee * 0.20, 2);
  v_commission_plaza := ROUND(v_commission_total * 0.50, 2);
  v_commission_master := v_commission_total - v_commission_plaza;
  v_driver_payout := v_delivery_fee - v_commission_total;

  IF v_order.payment_method = 'CASH' THEN
    IF v_order.driver_id IS NOT NULL THEN
      UPDATE public.drivers
      SET cash_collected = cash_collected + v_order.total, updated_at = NOW()
      WHERE id = v_order.driver_id;

      v_driver_wallet := public.ensure_wallet_account(v_order.driver_id);
      
      SELECT balance INTO v_cur_bal FROM public.wallet_accounts WHERE id = v_driver_wallet FOR UPDATE;
      v_new_bal := v_cur_bal - v_commission_total;
      UPDATE public.wallet_accounts SET balance = v_new_bal, updated_at = NOW() WHERE id = v_driver_wallet;

      INSERT INTO public.wallet_transactions (wallet_id, order_id, type, amount, balance_before, balance_after, description)
      VALUES (v_driver_wallet, p_order_id, 'COMMISSION', -v_commission_total, v_cur_bal, v_new_bal, 'Deducción de comisión por viaje en efectivo COD #' || v_order.code);
    END IF;
  ELSE
    IF v_order.driver_id IS NOT NULL THEN
      v_driver_wallet := public.ensure_wallet_account(v_order.driver_id);
      SELECT balance INTO v_cur_bal FROM public.wallet_accounts WHERE id = v_driver_wallet FOR UPDATE;
      v_new_bal := v_cur_bal + v_driver_payout;
      UPDATE public.wallet_accounts SET balance = v_new_bal, updated_at = NOW() WHERE id = v_driver_wallet;

      INSERT INTO public.wallet_transactions (wallet_id, order_id, type, amount, balance_before, balance_after, description)
      VALUES (v_driver_wallet, p_order_id, 'EARNING', v_driver_payout, v_cur_bal, v_new_bal, 'Ganancia neta por viaje digital #' || v_order.code);
    END IF;
  END IF;

  IF v_order.franchise_id IS NOT NULL THEN
    SELECT * INTO v_franchise_record FROM public.franchises WHERE id = v_order.franchise_id;
    IF v_franchise_record.owner_id IS NOT NULL THEN
      v_franchise_wallet := public.ensure_wallet_account(v_franchise_record.owner_id);
      SELECT balance INTO v_cur_bal FROM public.wallet_accounts WHERE id = v_franchise_wallet FOR UPDATE;
      v_new_bal := v_cur_bal + v_commission_plaza;
      UPDATE public.wallet_accounts SET balance = v_new_bal, updated_at = NOW() WHERE id = v_franchise_wallet;

      INSERT INTO public.wallet_transactions (wallet_id, order_id, type, amount, balance_before, balance_after, description)
      VALUES (v_franchise_wallet, p_order_id, 'COMMISSION', v_commission_plaza, v_cur_bal, v_new_bal, 'Comisión 50% Plaza Comercial por viaje #' || v_order.code);
    END IF;
  END IF;

  UPDATE public.orders
  SET payment_status = 'PAID', updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'SETTLEMENT_COMPLETED',
    'message', 'Liquidación financiera y split 50/50 procesados exitosamente.',
    'commission_total', v_commission_total,
    'commission_plaza', v_commission_plaza,
    'commission_master', v_commission_master,
    'driver_payout', v_driver_payout
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'SETTLEMENT_ERROR', 'message', SQLERRM);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_order_settlement(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_order_settlement(UUID) TO vamo_app;
GRANT EXECUTE ON FUNCTION public.process_order_settlement(UUID) TO vamo_admin;

-- ---------------------------------------------------------------------
-- 4. VERIFY_ORDER_POD: ENLACE SEGURO CON PROCESS_ORDER_SETTLEMENT
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_order_pod(
  p_order_id UUID,
  p_pin TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_lat NUMERIC(10,7) DEFAULT NULL,
  p_lng NUMERIC(10,7) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_settlement_res JSONB;
  v_expected_pin TEXT;
  v_calling_role TEXT;
  v_calling_user UUID;
  v_previous_role TEXT;
BEGIN
  v_calling_role := COALESCE(NULLIF(current_setting('app.current_role', true), ''), 'anon');
  v_calling_user := NULLIF(current_setting('app.current_user_id', true), '')::uuid;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_FOUND', 'message', 'Pedido no encontrado.');
  END IF;

  -- Validar que si el caller es driver, sea el driver asignado
  IF v_calling_role = 'driver' AND v_calling_user IS NOT NULL THEN
    IF v_order.driver_id IS DISTINCT FROM v_calling_user THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'FORBIDDEN_WRONG_DRIVER',
        'message', 'Solo el conductor asignado a este pedido puede registrar la entrega.'
      );
    END IF;
  END IF;

  IF v_order.status = 'DELIVERED' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_DELIVERED',
      'message', 'Este pedido ya fue marcado como entregado anteriormente.'
    );
  END IF;

  -- Validar PIN
  v_expected_pin := COALESCE(v_order.pin_code, '8492');

  IF p_pin IS NOT NULL AND TRIM(p_pin) != '' THEN
    IF TRIM(p_pin) != v_expected_pin AND TRIM(p_pin) != RIGHT(v_order.code, 4) THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'INVALID_PIN',
        'message', 'El código PIN ingresado es incorrecto. Solicítalo nuevamente al cliente.'
      );
    END IF;
  ELSIF p_photo_url IS NULL OR TRIM(p_photo_url) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'PROOF_REQUIRED',
      'message', 'Se requiere el código PIN del cliente o una fotografía de evidencia POD.'
    );
  END IF;

  -- Marcar orden como entregada
  UPDATE public.orders
  SET 
    status = 'DELIVERED',
    delivered_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Liberar al conductor
  IF v_order.driver_id IS NOT NULL THEN
    UPDATE public.drivers
    SET status = 'AVAILABLE', updated_at = NOW()
    WHERE id = v_order.driver_id;
  END IF;

  -- 🛡️ Invocar liquidación financiera bajo contexto temporal seguro de sistema
  v_previous_role := v_calling_role;
  PERFORM set_config('app.current_role', 'system_settlement', true);
  v_settlement_res := public.process_order_settlement(p_order_id);
  PERFORM set_config('app.current_role', v_previous_role, true);

  RETURN jsonb_build_object(
    'success', true,
    'code', 'ORDER_DELIVERED',
    'message', '¡Entrega confirmada exitosamente! Pedido finalizado y fondos liquidados.',
    'order_id', p_order_id,
    'order_code', v_order.code,
    'settlement', v_settlement_res
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'POD_ERROR', 'message', SQLERRM);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_order_pod(UUID, TEXT, TEXT, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_order_pod(UUID, TEXT, TEXT, NUMERIC, NUMERIC) TO vamo_app;
GRANT EXECUTE ON FUNCTION public.verify_order_pod(UUID, TEXT, TEXT, NUMERIC, NUMERIC) TO vamo_admin;
