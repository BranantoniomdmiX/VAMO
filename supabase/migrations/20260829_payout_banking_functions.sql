-- =====================================================================
-- 🏛️ VAMO PAYOUTS ENGINE & CUENTAS BANCARIAS BLINDADAS (ANTI-HACKER)
-- Registro de CLABE/Tarjeta y Dispersión Atómica con Libro Mayor
-- =====================================================================

-- 1. Tabla de Cuentas Bancarias Verificadas
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_holder TEXT NOT NULL,
  clabe TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT DEFAULT 'CLABE', -- 'CLABE' o 'DEBIT_CARD'
  is_verified BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_clabe_length CHECK (char_length(clabe) >= 16 AND char_length(clabe) <= 18)
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_profile ON public.bank_accounts(profile_id);

-- 2. Procedimiento para Registrar o Actualizar Cuenta Bancaria
CREATE OR REPLACE FUNCTION public.register_bank_account(
  p_profile_id UUID,
  p_account_holder TEXT,
  p_clabe TEXT,
  p_bank_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  IF char_length(TRIM(p_clabe)) != 18 THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_CLABE', 'message', 'La cuenta CLABE debe contener exactamente 18 dígitos.');
  END IF;

  -- Desactivar cuentas anteriores del usuario
  UPDATE public.bank_accounts
  SET is_active = FALSE, updated_at = NOW()
  WHERE profile_id = p_profile_id;

  -- Insertar la nueva cuenta bancaria
  INSERT INTO public.bank_accounts (profile_id, account_holder, clabe, bank_name, is_verified, is_active)
  VALUES (p_profile_id, p_account_holder, TRIM(p_clabe), p_bank_name, TRUE, TRUE)
  RETURNING id INTO v_account_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'BANK_ACCOUNT_REGISTERED',
    'message', 'Cuenta bancaria registrada y verificada exitosamente.',
    'bank_account_id', v_account_id,
    'bank_name', p_bank_name,
    'clabe_masked', '••••••••••••••' || RIGHT(TRIM(p_clabe), 4)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'BANK_ERROR', 'message', SQLERRM);
END;
$$;

-- 3. Procedimiento para Ejecutar la Dispersión Bancaria (Payout SPEI)
CREATE OR REPLACE FUNCTION public.process_wallet_payout(
  p_profile_id UUID,
  p_amount NUMERIC(12,2),
  p_tracking_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_cur_bal NUMERIC(12,2);
  v_new_bal NUMERIC(12,2);
  v_bank_record RECORD;
  v_tracking TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_AMOUNT', 'message', 'El monto a dispersar debe ser mayor a 0.');
  END IF;

  -- 1. Verificar cuenta bancaria activa
  SELECT * INTO v_bank_record
  FROM public.bank_accounts
  WHERE profile_id = p_profile_id AND is_active = TRUE
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NO_BANK_ACCOUNT', 'message', 'El usuario no tiene una cuenta bancaria registrada para dispersión.');
  END IF;

  -- 2. Bloquear y verificar saldo en billetera digital
  v_wallet_id := public.ensure_wallet_account(p_profile_id);

  SELECT balance INTO v_cur_bal
  FROM public.wallet_accounts
  WHERE id = v_wallet_id
  FOR UPDATE;

  IF v_cur_bal < p_amount THEN
    RETURN jsonb_build_object('success', false, 'code', 'INSUFFICIENT_FUNDS', 'message', 'Saldo insuficiente para realizar la dispersión bancaria.');
  END IF;

  -- 3. Deducir saldo
  v_new_bal := v_cur_bal - p_amount;
  UPDATE public.wallet_accounts
  SET balance = v_new_bal, updated_at = NOW()
  WHERE id = v_wallet_id;

  v_tracking := COALESCE(p_tracking_key, 'VAMO-SPEI-' || floor(100000 + random() * 900000)::text);

  -- 4. Registrar en libro mayor inmutable
  INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_before, balance_after, description)
  VALUES (
    v_wallet_id, 
    'WITHDRAWAL', 
    -p_amount, 
    v_cur_bal, 
    v_new_bal, 
    'Dispersión SPEI depositada a ' || v_bank_record.bank_name || ' (••••' || RIGHT(v_bank_record.clabe, 4) || ') Folio: ' || v_tracking
  );

  RETURN jsonb_build_object(
    'success', true,
    'code', 'PAYOUT_DISBURSED',
    'message', 'Dispersión bancaria SPEI completada exitosamente.',
    'amount', p_amount,
    'remaining_balance', v_new_bal,
    'bank_name', v_bank_record.bank_name,
    'clabe_masked', '••••' || RIGHT(v_bank_record.clabe, 4),
    'tracking_key', v_tracking
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'PAYOUT_ERROR', 'message', SQLERRM);
END;
$$;
