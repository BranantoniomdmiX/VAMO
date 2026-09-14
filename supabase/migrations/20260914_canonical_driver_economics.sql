-- =====================================================================
-- VAMO MIGRATION 20260914_canonical_driver_economics.sql
-- Autoridad: docs/business/VAMO_BUSINESS_CONSTITUTION.md
-- Objetivo:
--   - 0% comision porcentual por viaje.
--   - El conductor conserva 100% de la tarifa de entrega.
--   - No acreditar comisiones por viaje a Socio Comercial/VAMO.
--   - La cuota semanal de $100 MXN es un flujo separado y NO se liquida aqui.
--   - Mantener idempotencia y frontera de ejecucion privilegiada.
-- =====================================================================

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
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ORDER_NOT_FOUND',
      'message', 'Pedido no encontrado.'
    );
  END IF;

  IF v_order.status != 'DELIVERED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ORDER_NOT_DELIVERED',
      'message', 'El pedido aun no ha sido marcado como entregado.'
    );
  END IF;

  IF v_order.payment_status = 'PAID' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_SETTLED',
      'message', 'El pedido ya fue liquidado contablemente con anterioridad (idempotente).'
    );
  END IF;

  -- Economia canonica VAMO: 0% de comision por viaje.
  v_delivery_fee := COALESCE(v_order.delivery_fee, 0.00);
  v_driver_payout := v_delivery_fee;

  IF v_order.payment_method = 'CASH' THEN
    -- El conductor recauda el efectivo fisicamente.
    -- No se descuenta comision porcentual de su wallet.
    IF v_order.driver_id IS NOT NULL THEN
      UPDATE public.drivers
      SET cash_collected = cash_collected + v_order.total,
          updated_at = NOW()
      WHERE id = v_order.driver_id;
    END IF;
  ELSE
    -- Pago digital: acreditar al conductor el 100% de la tarifa de entrega.
    IF v_order.driver_id IS NOT NULL THEN
      v_driver_wallet := public.ensure_wallet_account(v_order.driver_id);

      SELECT balance INTO v_cur_bal
      FROM public.wallet_accounts
      WHERE id = v_driver_wallet
      FOR UPDATE;

      v_new_bal := v_cur_bal + v_driver_payout;

      UPDATE public.wallet_accounts
      SET balance = v_new_bal,
          updated_at = NOW()
      WHERE id = v_driver_wallet;

      INSERT INTO public.wallet_transactions (
        wallet_id,
        order_id,
        type,
        amount,
        balance_before,
        balance_after,
        description
      )
      VALUES (
        v_driver_wallet,
        p_order_id,
        'EARNING',
        v_driver_payout,
        v_cur_bal,
        v_new_bal,
        'Tarifa de entrega 100% conductor #' || v_order.code
      );
    END IF;
  END IF;

  UPDATE public.orders
  SET payment_status = 'PAID',
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'SETTLEMENT_COMPLETED',
    'message', 'Liquidacion completada con economia canonica VAMO: 0% comision por viaje.',
    -- Compatibilidad con consumidores antiguos: conservar campos, siempre en cero.
    'commission_total', 0.00,
    'commission_plaza', 0.00,
    'commission_master', 0.00,
    'driver_payout', v_driver_payout
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code', 'SETTLEMENT_ERROR',
    'message', SQLERRM
  );
END;
$$;

-- Frontera de privilegios: la funcion financiera no es invocable por runtime general.
REVOKE EXECUTE ON FUNCTION public.process_order_settlement(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_order_settlement(UUID) FROM vamo_app;
GRANT EXECUTE ON FUNCTION public.process_order_settlement(UUID) TO vamo_admin;

COMMENT ON FUNCTION public.process_order_settlement(UUID) IS
'Liquidacion canonica VAMO: 0% comision porcentual por viaje; 100% de delivery_fee para el conductor. La cuota semanal se procesa por flujo separado.';
