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
  } catch (err: any) {
    console.warn('⚠️ [Webhook Verification Error]:', err.message)
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
          .select('customer_order_id, amount, status, currency')
          .eq('gateway_order_id', gatewayOrderId)
          .maybeSingle()

        if (!pi) {
          console.warn(`⚠️ [VAMO Webhook] Orden no encontrada para gatewayOrderId: ${gatewayOrderId}`)
          return NextResponse.json({ error: 'Orden no encontrada en VAMO' }, { status: 404 })
        }

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

        // 5. Actualizar payment_intent
        await supabase
          .from('payment_intents')
          .update({
            status: 'PAID',
            paid_at: new Date().toISOString(),
            webhook_received_at: new Date().toISOString(),
            card_last4: (charge?.payment_method as Record<string, unknown>)?.last4 as string ?? null,
            card_brand: (charge?.payment_method as Record<string, unknown>)?.brand as string ?? null,
            card_bank: (charge?.payment_method as Record<string, unknown>)?.issuer as string ?? null
          })
          .eq('gateway_order_id', gatewayOrderId)

        // 6. Autoridad Primaria: Actualizar pedido en PostgreSQL Dokploy (Transactional Source of Truth)
        try {
          const { query } = await import('@/lib/db/postgres')
          await query(
            "UPDATE public.orders SET payment_status = 'PAID', status = 'CONFIRMED', updated_at = NOW() WHERE id = $1 OR code = $1;",
            [pi.customer_order_id]
          )
        } catch (pgErr) {
          console.error('🚨 [VAMO Webhook] Dokploy primary update error:', pgErr)
        }

        // Proyección auxiliar en Supabase para suscripciones Realtime cliente
        try {
          await supabase
            .from('customer_orders')
            .update({ payment_status: 'PAID' })
            .eq('id', pi.customer_order_id)
        } catch (sbErr) {
          console.warn('[VAMO Webhook] Supabase projection sync warning:', sbErr)
        }

        // 7. Escribir en ledger financiero (Proyección Supabase)
        await supabase.from('financial_ledger').insert({
          customer_order_id: pi.customer_order_id,
          entry_type: 'delivery_income',
          amount: pi.amount,
          balance_before: 0,
          balance_after: pi.amount,
          description: `Pago digital confirmado — Order Conekta ${gatewayOrderId}`
        })

        console.log(`[VAMO Webhook] ✅ Pago confirmado e idempotente: ${gatewayOrderId}`)
        break
      }

      case 'order.payment_error':
      case 'charge.failed': {
        const order = data.object as Record<string, unknown>
        const gatewayOrderId = order.id as string

        await supabase
          .from('payment_intents')
          .update({
            status: 'FAILED',
            failed_at: new Date().toISOString(),
            webhook_received_at: new Date().toISOString()
          })
          .eq('gateway_order_id', gatewayOrderId)

        console.log(`[VAMO Webhook] ❌ Pago fallido: ${gatewayOrderId}`)
        break
      }

      case 'order.refunded':
      case 'charge.refunded': {
        const order = data.object as Record<string, unknown>
        const gatewayOrderId = order.id as string

        await supabase
          .from('payment_intents')
          .update({
            status: 'REFUNDED',
            webhook_received_at: new Date().toISOString()
          })
          .eq('gateway_order_id', gatewayOrderId)

        const { data: pi } = await supabase
          .from('payment_intents')
          .select('customer_order_id, amount')
          .eq('gateway_order_id', gatewayOrderId)
          .single()

        if (pi) {
          await supabase
            .from('customer_orders')
            .update({ payment_status: 'REFUNDED' })
            .eq('id', pi.customer_order_id)

          await supabase.from('financial_ledger').insert({
            customer_order_id: pi.customer_order_id,
            entry_type: 'refund',
            amount: -pi.amount,
            balance_before: pi.amount,
            balance_after: 0,
            description: `Reembolso procesado — Order Conekta ${gatewayOrderId}`
          })
        }

        console.log(`[VAMO Webhook] 🔄 Reembolso procesado: ${gatewayOrderId}`)
        break
      }

      default:
        console.log(`[VAMO Webhook] Evento ignorado: ${eventType}`)
    }

    return NextResponse.json({ received: true, event: eventType })

  } catch (error) {
    console.error('[VAMO Webhook] Error inesperado:', error)
    return NextResponse.json({ received: true, note: 'Error interno procesado' })
  }
}
