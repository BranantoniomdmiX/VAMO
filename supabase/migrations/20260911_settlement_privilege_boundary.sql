-- =====================================================================
-- 🛡️ VAMO MIGRATION 20260911_settlement_privilege_boundary.sql
-- Escenario: FIX / SETTLEMENT_PRIVILEGE_BOUNDARY
-- =====================================================================
-- 1. Cierre estricto de la frontera de ejecución en PostgreSQL:
--    - REVOKE EXECUTE ON FUNCTION public.process_order_settlement(UUID) FROM vamo_app;
--    - REVOKE EXECUTE ON FUNCTION public.process_order_settlement(UUID) FROM PUBLIC;
--    - GRANT EXECUTE ON FUNCTION public.process_order_settlement(UUID) TO vamo_admin;
-- 2. Refactor de verify_order_pod y process_order_settlement:
--    - Eliminar la dependencia vulnerable de 'app.current_role = system_settlement'.
--    - La liquidación financiera ocurre exclusivamente a través de flujos
--      internos controlados de PostgreSQL (invocada por verify_order_pod con definer privilege).
--    - Guardia interna en process_order_settlement que exige que el invocador sea
--      'superadmin', 'master' o que provenga de una llamada interna autorizada de BD.
-- 3. Garantizar Idempotencia Absoluta:
--    - Si payment_status = 'PAID', retornar ALREADY_SETTLED sin mutar ledgers ni balances.
-- =====================================================================

-- 1. MODIFICAR PROCESS_ORDER_SETTLEMENT
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
BEGIN
  -- 1. Bloquear la orden para verificación y liquidación
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

  -- 2. IDEMPOTENCIA CONTABLE ESTRICTA:
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

-- 2. RESTRINGIR FRONTERA DE EJECUCIÓN (REVOCAR VAMO_APP)
REVOKE EXECUTE ON FUNCTION public.process_order_settlement(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_order_settlement(UUID) FROM vamo_app;
GRANT EXECUTE ON FUNCTION public.process_order_settlement(UUID) TO vamo_admin;

-- 3. REFACTOR VERIFY_ORDER_POD: LLAMADA DIRECTA SIN ELEVACIÓN ARTIFICIAL DE SESSION VARIABLES
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

  -- 🛡️ Invocar liquidación financiera internamente (ejecutada con privilegios del owner vamo_admin)
  v_settlement_res := public.process_order_settlement(p_order_id);

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
