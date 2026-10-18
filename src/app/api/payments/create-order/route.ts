import { NextRequest, NextResponse } from 'next/server'
import { withTrustedAuthContext } from '@/lib/auth/contextResolver'

// API Route: POST /api/payments/create-order
// Crea un Order en Conekta y devuelve la URL de pago al cliente
// La API Key NUNCA llega al browser — solo vive en el servidor

const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY!
const CONEKTA_API_BASE = 'https://api.conekta.io'

interface CreateOrderBody {
  orderId: string          // ID o código del pedido en VAMO
  amount?: number          // Monto enviado por cliente (NO CONFIABLE - SE RECALCULA)
  paymentMethod: 'card' | 'oxxo_cash' | 'spei' | 'cash'
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  description?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json().catch(() => ({}))
    const { orderId, paymentMethod, customerName, customerEmail, customerPhone, description } = body

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Se requieren orderId y paymentMethod obligatorios.' },
        { status: 400 }
      )
    }

    // 🛡️ Consultar el pedido y verificar permisos bajo la transacción con contexto RLS coherente
    const authOrderResult = await withTrustedAuthContext(async (authContext, client) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
      const orderRes = await client.query<{
        id: string
        code: string
        customer_id: string
        total: string
        delivery_fee: string
        subtotal: string
        status: string
      }>(
        isUuid
          ? 'SELECT id, code, customer_id, total, delivery_fee, subtotal, status FROM public.orders WHERE id = $1::uuid;'
          : 'SELECT id, code, customer_id, total, delivery_fee, subtotal, status FROM public.orders WHERE code = $1;',
        [orderId]
      )

      if (orderRes.rows.length === 0) {
        return {
          status: 404,
          error: 'Pedido no encontrado en la base de datos central.'
        }
      }

      const authoritativeOrder = orderRes.rows[0]

      // Validar que el cliente autenticado sea el dueño del pedido o superadmin
      if (authContext.role !== 'superadmin' && authContext.role !== 'master' && authoritativeOrder.customer_id !== authContext.userId) {
        return {
          status: 403,
          error: 'No está autorizado para pagar una orden de otro cliente.'
        }
      }

      const authoritativeTotal = parseFloat(authoritativeOrder.total)
      if (isNaN(authoritativeTotal) || authoritativeTotal <= 0) {
        return {
          status: 400,
          error: 'El monto de la orden es inválido o no ha sido tasado correctamente.'
        }
      }

      return {
        status: 200,
        authoritativeOrder,
        authoritativeTotal,
        authContext
      }
    })

    if (!authOrderResult) {
      return NextResponse.json(
        { error: 'Sesión no válida o ausente. Debe autenticarse para procesar pagos.' },
        { status: 401 }
      )
    }

    if (authOrderResult.error || !authOrderResult.authoritativeOrder) {
      return NextResponse.json(
        { error: authOrderResult.error },
        { status: authOrderResult.status }
      )
    }

    const { authoritativeOrder, authoritativeTotal, authContext } = authOrderResult

    // Si el método es efectivo, no necesitamos pasar por la pasarela digital
    if (paymentMethod === 'cash') {
      return NextResponse.json({
        success: true,
        paymentMethod: 'cash',
        amount: authoritativeTotal,
        redirectUrl: `/customer/tracking/${authoritativeOrder.id}`,
        message: 'Pedido confirmado — pago en efectivo al repartidor'
      })
    }

    // Si la clave de Conekta no está en el entorno:
    if (!CONEKTA_PRIVATE_KEY) {
      const isProduction = process.env.NODE_ENV === 'production'
      const isDemoMode = process.env.VAMO_DEMO_MODE === 'true'

      if (isProduction || !isDemoMode) {
        return NextResponse.json(
          { 
            error: 'Servicio de pasarela de pago no configurado o no disponible en este entorno (Fail-Closed).',
            code: 'GATEWAY_CONFIG_MISSING'
          },
          { status: 503 }
        )
      }

      if (paymentMethod === 'oxxo_cash') {
        return NextResponse.json({
          success: true,
          paymentMethod: 'oxxo_cash',
          amount: authoritativeTotal,
          gatewayOrderId: `ord_mock_${Date.now()}`,
          reference: '93481029384756',
          barcode: '93481029384756',
          expiresAt: Math.floor(Date.now() / 1000) + 259200,
          store: 'OXXO'
        })
      }
      if (paymentMethod === 'spei') {
        return NextResponse.json({
          success: true,
          paymentMethod: 'spei',
          amount: authoritativeTotal,
          gatewayOrderId: `ord_mock_${Date.now()}`,
          clabe: '646180111812345678',
          bank: 'STP / VAMO Pagos',
          reference: 'VAMO-9042',
          expiresAt: Math.floor(Date.now() / 1000) + 86400
        })
      }
      if (paymentMethod === 'card') {
        return NextResponse.json({
          success: true,
          paymentMethod: 'card',
          amount: authoritativeTotal,
          gatewayOrderId: `ord_mock_${Date.now()}`,
          checkoutUrl: `/customer/payment/${authoritativeOrder.id}/success`
        })
      }
    }

    // 🛡️ PUNTO I: Idempotencia real previa a pasarela
    // Crear/persistir una reserva local con idempotency_key antes de llamar a Conekta.
    // Dos requests concurrentes se resolverán atómicamente en PostgreSQL mediante constraint única.
    const idempotencyKey = `pi_${authoritativeOrder.id}_${paymentMethod}`
    const { getTransactionClient } = await import('@/lib/db/postgres')
    const pgClient = await getTransactionClient()

    let reservedIntentId: string | null = null

    try {
      await pgClient.query('BEGIN')

      // Bloquear o insertar reserva idempotente
      const checkRes = await pgClient.query<{
        id: string
        gateway_order_id: string | null
        gateway_payment_url: string | null
        payment_reference: string | null
        payment_expires_at: string | null
        status: string
      }>(
        `SELECT id, gateway_order_id, gateway_payment_url, payment_reference, payment_expires_at, status
         FROM public.payment_intents
         WHERE idempotency_key = $1
         FOR UPDATE;`,
        [idempotencyKey]
      )

      if (checkRes.rows.length > 0) {
        const existing = checkRes.rows[0]
        // Si ya cuenta con gateway_order_id y está PENDING, devolver la intención existente
        if (existing.gateway_order_id && existing.status === 'PENDING') {
          await pgClient.query('COMMIT')
          return NextResponse.json({
            success: true,
            paymentMethod,
            amount: authoritativeTotal,
            gatewayOrderId: existing.gateway_order_id,
            checkoutUrl: existing.gateway_payment_url,
            reference: existing.payment_reference,
            clabe: existing.payment_reference,
            expiresAt: existing.payment_expires_at ? Math.floor(new Date(existing.payment_expires_at).getTime() / 1000) : undefined,
            idempotentRetry: true
          })
        }
        reservedIntentId = existing.id
      } else {
        // Insertar reserva previa
        const insertRes = await pgClient.query<{ id: string }>(
          `INSERT INTO public.payment_intents (
            order_id, customer_order_id, idempotency_key, gateway, amount, currency, status, payment_method_type
          ) VALUES ($1, NULL, $2, 'conekta', $3, 'MXN', 'PENDING', $4)
          RETURNING id;`,
          [authoritativeOrder.id, idempotencyKey, authoritativeTotal, paymentMethod]
        )
        reservedIntentId = insertRes.rows[0].id
      }

      await pgClient.query('COMMIT')
    } catch (reserveErr) {
      await pgClient.query('ROLLBACK')
      console.error('🚨 [VAMO Payments] Error reservando intento de pago:', reserveErr)
      return NextResponse.json(
        { error: 'Error de concurrencia al reservar la intención de pago. Reintente.' },
        { status: 409 }
      )
    } finally {
      pgClient.release()
    }

    // Convertir total autoritativo en MXN a centavos para Conekta
    const amountCents = Math.round(authoritativeTotal * 100)
    const orderDescription = description || `Envío VAMO #${authoritativeOrder.code}`

    // Construir el body del Order de Conekta según su API v2.1
    const conektaOrderBody: Record<string, unknown> = {
      currency: 'MXN',
      customer_info: {
        name: customerName || 'Cliente VAMO',
        email: customerEmail || authContext.email || 'cliente@vamo.mx',
        phone: customerPhone || '4610000000'
      },
      line_items: [
        {
          name: orderDescription,
          unit_price: amountCents,
          quantity: 1
        }
      ],
      metadata: {
        vamo_order_id: authoritativeOrder.id,
        order_code: authoritativeOrder.code,
        customer_id: authContext.userId,
        platform: 'VAMO SaaS'
      }
    }

    // Configurar el método de pago según la selección
    if (paymentMethod === 'card') {
      conektaOrderBody.checkout = {
        type: 'Integration',
        allowed_payment_methods: ['card'],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333'}/customer/payment/${authoritativeOrder.id}/success`,
        failure_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333'}/customer/payment/${authoritativeOrder.id}/failed`,
        on_demand_enabled: false
      }
    } else if (paymentMethod === 'oxxo_cash') {
      conektaOrderBody.charges = [
        {
          payment_method: {
            type: 'cash',
            expires_at: Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60)
          }
        }
      ]
    } else if (paymentMethod === 'spei') {
      conektaOrderBody.charges = [
        {
          payment_method: {
            type: 'spei',
            expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
          }
        }
      ]
    }

    const conektaRes = await fetch(`${CONEKTA_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONEKTA_PRIVATE_KEY}`,
        'Accept': 'application/vnd.conekta-v2.1.0+json',
        'Accept-Language': 'es'
      },
      body: JSON.stringify(conektaOrderBody)
    })

    if (!conektaRes.ok) {
      const errorData = await conektaRes.json()
      console.error('[VAMO Payments] Error Conekta:', errorData)
      return NextResponse.json(
        { error: 'Error al procesar el pago con la pasarela. Intente de nuevo.' },
        { status: 400 }
      )
    }

    const conektaOrder = await conektaRes.json()

    const responseData: Record<string, unknown> = {
      success: true,
      paymentMethod,
      amount: authoritativeTotal,
      gatewayOrderId: conektaOrder.id
    }

    if (paymentMethod === 'card' && conektaOrder.checkout) {
      responseData.checkoutUrl = conektaOrder.checkout.url
      responseData.checkoutId = conektaOrder.checkout.id
    } else if (paymentMethod === 'oxxo_cash') {
      const charge = conektaOrder.charges?.data?.[0]
      responseData.reference = charge?.payment_method?.reference
      responseData.barcode = charge?.payment_method?.barcode
      responseData.barcodeUrl = charge?.payment_method?.barcode_url
      responseData.expiresAt = charge?.payment_method?.expires_at
      responseData.store = 'OXXO'
    } else if (paymentMethod === 'spei') {
      const charge = conektaOrder.charges?.data?.[0]
      responseData.clabe = charge?.payment_method?.clabe
      responseData.bank = charge?.payment_method?.bank
      responseData.reference = charge?.payment_method?.reference
      responseData.expiresAt = charge?.payment_method?.expires_at
    }

    // Actualizar la reserva confirmando los datos oficiales de Conekta
    try {
      const { query: pgQuery } = await import('@/lib/db/postgres')
      await pgQuery(
        `UPDATE public.payment_intents
         SET gateway_order_id = $1,
             gateway_payment_url = $2,
             payment_reference = $3,
             payment_expires_at = $4,
             updated_at = NOW()
         WHERE id = $5;`,
        [
          conektaOrder.id,
          (responseData.checkoutUrl as string) || null,
          (responseData.reference as string) || (responseData.clabe as string) || null,
          responseData.expiresAt ? new Date(Number(responseData.expiresAt) * 1000).toISOString() : null,
          reservedIntentId
        ]
      )
    } catch (piErr) {
      console.error('🚨 [VAMO Payments] Excepción al actualizar payment_intent con datos de Conekta:', piErr)
      return NextResponse.json(
        { error: 'Fallo al asegurar la persistencia del pago. Intente de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[VAMO Payments] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor de pagos.' },
      { status: 500 }
    )
  }
}
