-- =====================================================================
-- 💳 VAMO FINANCIAL ENGINE: LIQUIDACIÓN CONTABLE Y LIBRO MAYOR (LEDGER)
-- Split 50/50, Retiros SPEI y Control de Efectivo COD
-- =====================================================================

-- 1. Helper para asegurar la existencia de una billetera
CREATE OR REPLACE FUNCTION public.ensure_wallet_account(p_profile_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  SELECT id INTO v_wallet_id
  FROM public.wallet_accounts
  WHERE profile_id = p_profile_id;

  IF NOT FOUND THEN
    INSERT INTO public.wallet_accounts (profile_id, balance, held_balance, currency)
    VALUES (p_profile_id, 0.00, 0.00, 'MXN')
    RETURNING id INTO v_wallet_id;
  END IF;

  RETURN v_wallet_id;
END;
$$;

-- 2. Liquidación Atómica de una Orden al Entregarse
CREATE OR REPLACE FUNCTION public.process_order_settlement(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_driver_wallet UUID;
  v_franchise_wallet UUID;
  v_master_wallet UUID;
  v_driver_profile RECORD;
  v_franchise_record RECORD;
  v_master_profile RECORD;
  
  v_delivery_fee NUMERIC(10,2);
  v_commission_total NUMERIC(10,2);
  v_commission_plaza NUMERIC(10,2);
  v_commission_master NUMERIC(10,2);
  v_driver_payout NUMERIC(10,2);
  
  v_cur_bal NUMERIC(12,2);
  v_new_bal NUMERIC(12,2);
BEGIN
  -- Bloquear la orden para liquidación
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

  v_delivery_fee := COALESCE(v_order.delivery_fee, 0.00);
  -- Comisión VAMO (Ej. 20% del costo de envío o micro-cuota estándar)
  v_commission_total := ROUND(v_delivery_fee * 0.20, 2);
  v_commission_plaza := ROUND(v_commission_total * 0.50, 2);
  v_commission_master := v_commission_total - v_commission_plaza;
  v_driver_payout := v_delivery_fee - v_commission_total;

  -- 1. Liquidar según método de pago
  IF v_order.payment_method = 'CASH' THEN
    -- El conductor retuvo el efectivo físico total
    IF v_order.driver_id IS NOT NULL THEN
      UPDATE public.drivers
      SET cash_collected = cash_collected + v_order.total
      WHERE id = v_order.driver_id;

      -- Descontar la comisión total de su billetera digital
      v_driver_wallet := public.ensure_wallet_account(v_order.driver_id);
      
      SELECT balance INTO v_cur_bal FROM public.wallet_accounts WHERE id = v_driver_wallet FOR UPDATE;
      v_new_bal := v_cur_bal - v_commission_total;
      UPDATE public.wallet_accounts SET balance = v_new_bal, updated_at = NOW() WHERE id = v_driver_wallet;

      INSERT INTO public.wallet_transactions (wallet_id, order_id, type, amount, balance_before, balance_after, description)
      VALUES (v_driver_wallet, p_order_id, 'COMMISSION', -v_commission_total, v_cur_bal, v_new_bal, 'Deducción de comisión por viaje en efectivo COD #' || v_order.code);
    END IF;

  ELSE
    -- Pago digital (Tarjeta / SPEI): Acreditar ganancia neta al chofer
    IF v_order.driver_id IS NOT NULL THEN
      v_driver_wallet := public.ensure_wallet_account(v_order.driver_id);
      SELECT balance INTO v_cur_bal FROM public.wallet_accounts WHERE id = v_driver_wallet FOR UPDATE;
      v_new_bal := v_cur_bal + v_driver_payout;
      UPDATE public.wallet_accounts SET balance = v_new_bal, updated_at = NOW() WHERE id = v_driver_wallet;

      INSERT INTO public.wallet_transactions (wallet_id, order_id, type, amount, balance_before, balance_after, description)
      VALUES (v_driver_wallet, p_order_id, 'EARNING', v_driver_payout, v_cur_bal, v_new_bal, 'Ganancia neta por viaje digital #' || v_order.code);
    END IF;
  END IF;

  -- 2. Distribuir Split 50/50 al Socio Comercial (Plaza)
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

  -- 3. Actualizar estado de pago en la orden
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

-- 3. Solicitud de Retiro SPEI Atómica
CREATE OR REPLACE FUNCTION public.request_wallet_withdrawal(
  p_profile_id UUID,
  p_amount NUMERIC(12,2),
  p_clabe TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_cur_bal NUMERIC(12,2);
  v_new_bal NUMERIC(12,2);
  v_new_held NUMERIC(12,2);
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_AMOUNT', 'message', 'El monto a retirar debe ser mayor a 0.');
  END IF;

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

  INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_before, balance_after, description)
  VALUES (v_wallet_id, 'WITHDRAWAL', -p_amount, v_cur_bal, v_new_bal, 'Solicitud de retiro SPEI a cuenta CLABE: ' || p_clabe);

  RETURN jsonb_build_object(
    'success', true,
    'code', 'WITHDRAWAL_REQUESTED',
    'message', 'Retiro solicitado con éxito. En proceso de dispersión.',
    'amount', p_amount,
    'remaining_balance', v_new_bal,
    'clabe', p_clabe
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'WITHDRAWAL_ERROR', 'message', SQLERRM);
END;
$$;
