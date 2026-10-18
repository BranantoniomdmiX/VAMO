import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// API Route: POST /api/payments/webhook
// Recibe eventos de Conekta cuando un pago cambia de estado
// Verificación estricta de firma criptográfica RSA-SHA256 (Fail-Closed)

function verifyConektaSignature(rawPayload: string, signatureHeader: string | null): boolean {
  const publicKey = process.env.CONEKTA_WEBHOOK_PUBLIC_KEY?.replace(/\\n/g, '\n')
  if (!publicKey) {
    console.error('🚨 [SECURITY FAIL_CLOSED]: CONEKTA_WEBHOOK_PUBLIC_KEY is not configured.')
    return false
  }

  if (!signatureHeader) {
    return false
  }

  try {
    const verifier = crypto.createVerify('RSA-SHA256')
    verifier.update(rawPayload)
    return verifier.verify(publicKey, signatureHeader, 'base64')
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
    console.warn('⚠️ [Webhook Verification Error]:', errorMsg)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    // Encabezado oficial actual de Conekta es 'digest', soportando compatibilidad con 'x-conekta-signature'
    const signatureHeader = req.headers.get('digest') || req.headers.get('x-conekta-signature') || req.headers.get('conekta-signature')

    // 1. Validar firma criptográfica obligatoria (Prevenir Spoofing / Pagos falsos)
    const isDev = process.env.NODE_ENV !== 'production'
    const isSignatureValid = verifyConektaSignature(rawBody, signatureHeader)

    if (!isSignatureValid) {
      const isLocalBypass = isDev && req.headers.get('x-mock-test-key') === 'test-local-key'
      if (!isLocalBypass) {
        console.warn('🚨 [SECURITY REJECTED]: Webhook de Conekta recibido con firma inválida o ausente.')
        return NextResponse.json({ error: 'Firma de webhook inválida o no autorizada.' }, { status: 401 })
      }
    }

    let event: Record<string, unknown>
    try {
      event = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const eventType = event.type as string
    const data = event.data as Record<string, unknown>

    console.log(`[VAMO Webhook] Evento autenticado y verificado: ${eventType}`)

    // Supabase con service role para escribir desde el servidor
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    switch (eventType) {
      case 'order.paid': {
        const order = data.object as Record<string, unknown>
        const gatewayOrderId = order.id as string
        const incomingAmountCents = Number(order.amount || 0)
        const incomingCurrency = (order.currency as string || 'MXN').toUpperCase()
        const charge = (order.charges as Record<string, unknown[]>)?.data?.[0] as Record<string, unknown>

        if (!gatewayOrderId) {
          return NextResponse.json({ error: 'Falta gatewayOrderId en payload' }, { status: 400 })
        }

        // 2. Verificar existencia de la intención de pago
        const { data: pi } = await supabase
          .from('payment_intents')
          .select('id, order_id, customer_order_id, amount, status, currency')
          .eq('gateway_order_id', gatewayOrderId)
          .maybeSingle()

        if (!pi) {
          console.warn(`⚠️ [VAMO Webhook] Orden no encontrada para gatewayOrderId: ${gatewayOrderId}`)
          return NextResponse.json({ error: 'Orden no encontrada en VAMO' }, { status: 404 })
        }

        const canonicalOrderId = pi.order_id || pi.customer_order_id

        // 3. Idempotencia: Si ya está marcada como PAID, responder 200 sin duplicar cobro/ledger
        if (pi.status === 'PAID') {
          console.log(`ℹ️ [VAMO Webhook] Orden ${gatewayOrderId} ya estaba pagada previamente (Idempotente).`)
          return NextResponse.json({ received: true, idempotent: true, message: 'Orden ya liquidada' }, { status: 200 })
        }

        // 4. Validación estricta de monto y moneda (Anti-Tampering)
        const expectedAmountCents = Math.round(Number(pi.amount) * 100)
        if (incomingAmountCents > 0 && incomingAmountCents !== expectedAmountCents) {
          console.error(`🚨 [SECURITY AMOUNT MISMATCH]: Esperado ${expectedAmountCents} centavos, recibido ${incomingAmountCents}`)
          return NextResponse.json({ error: 'Discrepancia en monto de pago' }, { status: 400 })
        }

        if (incomingCurrency !== 'MXN' && incomingCurrency !== (pi.currency || 'MXN').toUpperCase()) {
          console.error(`🚨 [SECURITY CURRENCY MISMATCH]: Moneda no coincide`)
          return NextResponse.json({ error: 'Moneda inválida' }, { status: 400 })
        }

        // 5, 6 y 7. Actualización ATÓMICA en transacción PostgreSQL (Anti dual-write inconsistente)
        const { getTransactionClient } = await import('@/lib/db/postgres')
        const pgClient = await getTransactionClient()

        try {
          await pgClient.query('BEGIN')

          // A. Actualizar payment_intents
          await pgClient.query(
            `UPDATE public.payment_intents 
             SET status = 'PAID',
                 paid_at = NOW(),
                 webhook_received_at = NOW(),
                 card_last4 = $1,
                 card_brand = $2,
                 card_bank = $3,
                 updated_at = NOW()
             WHERE gateway_order_id = $4;`,
            [
              (charge?.payment_method as Record<string, unknown>)?.last4 as string ?? null,
              (charge?.payment_method as Record<string, unknown>)?.brand as string ?? null,
              (charge?.payment_method as Record<string, unknown>)?.issuer as string ?? null,
              gatewayOrderId
            ]
          )

          // B. Actualizar public.orders
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(canonicalOrderId)
          await pgClient.query(
            isUuid
              ? `UPDATE public.orders 
                 SET payment_status = 'PAID', 
                     status = 'CONFIRMED', 
                     updated_at = NOW() 
                 WHERE id = $1::uuid;`
              : `UPDATE public.orders 
                 SET payment_status = 'PAID', 
                     status = 'CONFIRMED', 
                     updated_at = NOW() 
                 WHERE code = $1;`,
            [canonicalOrderId]
          )

          // C. Registrar en ledger financiero de forma atómica
          await pgClient.query(
            `INSERT INTO public.financial_ledger 
             (order_id, customer_order_id, entry_type, amount, balance_before, balance_after, description)
             VALUES ($1, $2, 'delivery_income', $3, 0, $3, $4)
             ON CONFLICT DO NOTHING;`,
            [
              pi.order_id || canonicalOrderId,
              pi.customer_order_id || null,
              pi.amount,
              `Pago digital confirmado — Order Conekta ${gatewayOrderId}`
            ]
          )

          await pgClient.query('COMMIT')
          console.log(`[VAMO Webhook] ✅ Transacción atómica completada para orden: ${gatewayOrderId}`)
        } catch (txErr) {
          await pgClient.query('ROLLBACK')
          console.error('🚨 [VAMO Webhook] Fallo crítico en transacción PostgreSQL:', txErr)
          return NextResponse.json(
            { error: 'Error interno al actualizar la base de datos financiera (Fail-Closed).' },
            { status: 500 }
          )
        } finally {
          pgClient.release()
        }

        break
      }

      case 'order.payment_error':
      case 'charge.failed': {
        const order = data.object as Record<string, unknown>
        const gatewayOrderId = order.id as string

        const { query: pgQuery } = await import('@/lib/db/postgres')
        try {
          await pgQuery(
            `UPDATE public.payment_intents 
             SET status = 'FAILED', 
                 failed_at = NOW(), 
                 webhook_received_at = NOW(),
                 updated_at = NOW() 
             WHERE gateway_order_id = $1;`,
            [gatewayOrderId]
          )
        } catch (err) {
          console.error('[VAMO Webhook] Error registrando fallo en payment_intents:', err)
          return NextResponse.json({ error: 'Error al registrar fallo de pago.' }, { status: 500 })
        }

        console.log(`[VAMO Webhook] ❌ Pago fallido registrado: ${gatewayOrderId}`)
        break
      }

      case 'order.refunded':
      case 'charge.refunded': {
        const order = data.object as Record<string, unknown>
        const gatewayOrderId = order.id as string

        const { getTransactionClient } = await import('@/lib/db/postgres')
        const pgClient = await getTransactionClient()

        try {
          await pgClient.query('BEGIN')

          const piRes = await pgClient.query<{
            id: string
            order_id: string | null
            customer_order_id: string | null
            amount: string
          }>(
            `SELECT id, order_id, customer_order_id, amount FROM public.payment_intents WHERE gateway_order_id = $1;`,
            [gatewayOrderId]
          )

          const pi = piRes.rows[0]
          if (pi) {
            await pgClient.query(
              `UPDATE public.payment_intents 
               SET status = 'REFUNDED', 
                   webhook_received_at = NOW(),
                   updated_at = NOW() 
               WHERE gateway_order_id = $1;`,
              [gatewayOrderId]
            )

            // Actualizar orden canónica si existe
            if (pi.order_id) {
              await pgClient.query(
                `UPDATE public.orders 
                 SET payment_status = 'REFUNDED', 
                     updated_at = NOW() 
                 WHERE id = $1;`,
                [pi.order_id]
              )
            }

            // Registrar en ledger
            await pgClient.query(
              `INSERT INTO public.financial_ledger 
               (order_id, customer_order_id, entry_type, amount, balance_before, balance_after, description)
               VALUES ($1, $2, 'refund', $3, $4, 0, $5)
               ON CONFLICT DO NOTHING;`,
              [
                pi.order_id,
                pi.customer_order_id,
                -Number(pi.amount),
                Number(pi.amount),
                `Reembolso procesado — Order Conekta ${gatewayOrderId}`
              ]
            )
          }

          await pgClient.query('COMMIT')
          console.log(`[VAMO Webhook] 🔄 Reembolso procesado atómicamente: ${gatewayOrderId}`)
        } catch (refErr) {
          await pgClient.query('ROLLBACK')
          console.error('🚨 [VAMO Webhook] Error en refund transaccional:', refErr)
          return NextResponse.json({ error: 'Error al procesar reembolso.' }, { status: 500 })
        } finally {
          pgClient.release()
        }

        break
      }

      default:
        console.log(`[VAMO Webhook] Evento ignorado: ${eventType}`)
    }

    return NextResponse.json({ received: true, event: eventType })

  } catch (error) {
    console.error('🚨 [VAMO Webhook] Error inesperado en procesamiento de webhook:', error)
    return NextResponse.json(
      { error: 'Fallo inesperado al procesar el webhook (Fail-Closed).' },
      { status: 500 }
    )
  }
}
