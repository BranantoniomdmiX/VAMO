-- =====================================================================
-- 🛡️ VAMO ANTI-FRAUDE POD (PROOF OF DELIVERY) & PIN VERIFICATION
-- Validación atómica de PIN / Foto y Liquidación Contable Inmediata
-- =====================================================================

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
AS $$
DECLARE
  v_order RECORD;
  v_settlement_res JSONB;
  v_expected_pin TEXT;
BEGIN
  -- 1. Bloquear la orden para verificación exclusiva
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_FOUND', 'message', 'Pedido no encontrado.');
  END IF;

  IF v_order.status = 'DELIVERED' THEN
    RETURN jsonb_build_object('success', true, 'code', 'ALREADY_DELIVERED', 'message', 'Este pedido ya fue marcado como entregado anteriormente.');
  END IF;

  -- 2. Validar método de comprobación (PIN de 4 dígitos o Foto POD)
  -- El PIN esperado es '8492' por defecto o los últimos 4 caracteres del código
  v_expected_pin := '8492';

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

  -- 3. Marcar la orden como entregada exitosamente
  UPDATE public.orders
  SET 
    status = 'DELIVERED',
    delivered_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- 4. Liberar al conductor a estado AVAILABLE
  IF v_order.driver_id IS NOT NULL THEN
    UPDATE public.drivers
    SET status = 'AVAILABLE', updated_at = NOW()
    WHERE id = v_order.driver_id;
  END IF;

  -- 5. Disparar Liquidación Financiera Atómica (Split 50/50 y Billeteras)
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
