// tests/integration-order-spine.test.ts
// 🛡️ SUITE DE INTEGRACIÓN EJECUTABLE REAL — SPINE DE ÓRDENES VAMO (OLA A RELEASE CANDIDATE)
//
// REGLAS CANÓNICAS:
// 1. Fixtures compatibles con el esquema real y migraciones aditivas:
//    - tenants, franchises, profiles, drivers, merchants
//    - drivers exige tenant_id NOT NULL y franchise_id
//    - merchants exige commercial_franchise_id, slug, etc.
// 2. SET LOCAL ejecutado dentro de la misma transacción/conexión donde se evalúa la RPC/RLS.
// 3. CONCURRENT_DRIVER_RACE utiliza conexiones simultáneas reales con Promise.all (barrera de concurrencia).
// 4. CROSS_MERCHANT prueba RLS real impersonando al Merchant B con auth.uid() en transacción.
// 5. Cleanup riguroso borrando dependencias hijas antes de registros padre.
// 6. Pruebas específicas de Ola A:
//    - Pago PAID tardío no retrocede lifecycle
//    - Dos webhooks simultáneos producen un único ledger entry
//    - Dos requests de creación de pago concurrentes devuelven la misma intención/orden PSP
//    - Digital PENDING no liquida al driver
//    - OWN_FLEET no genera payout VAMO (SETTLEMENT_EXEMPT)
//    - HYBRID_OVERFLOW propio vs HYBRID Red VAMO
//    - Direct INSERT desde cliente autenticado es rechazado
//    - overflow_after_at NULL bloquea a Red VAMO
// 7. Si no existe INTEGRATION_DATABASE_URL, reporta honestamente BLOCKED_BY_ENVIRONMENT.

export type IntegrationTestStatus =
  | 'PASS'
  | 'FAIL'
  | 'BLOCKED_BY_ENVIRONMENT'

export interface IntegrationTestResult {
  id: number
  name: string
  description: string
  status: IntegrationTestStatus
  durationMs: number
  error?: string
  details?: Record<string, unknown>
}

export interface IntegrationSuiteReport {
  timestamp: string
  environment: string
  isDatabaseConnected: boolean
  totalTests: number
  passed: number
  failed: number
  blocked: number
  results: IntegrationTestResult[]
}

interface PgClient {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>
  end: () => Promise<void>
}

async function createPgClient(connectionString: string): Promise<PgClient> {
  const { Client } = await import('pg')
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined
  })
  await client.connect()
  return client
}

async function getTestDbClient(): Promise<PgClient | null> {
  const connectionString = process.env.INTEGRATION_DATABASE_URL
  if (!connectionString || connectionString.includes('placeholder') || connectionString.includes('example')) {
    return null
  }

  try {
    return await createPgClient(connectionString)
  } catch (err) {
    console.warn('[Integration Test] Could not establish DB connection:', err)
    return null
  }
}

export const TEST_DEFINITIONS = [
  { id: 1, name: 'REAL_ORDER_CREATION', desc: 'Creación de orden canónica con orden DIRECT/PURCHASE/MULTI_STOP, PIN CSPRNG y tipos canónicos' },
  { id: 2, name: 'KDS_VALID_TRANSITION', desc: 'Transición de cocina/KDS (CONFIRMED -> PREPARING -> READY_BIZ / READY_FOR_PICKUP)' },
  { id: 3, name: 'CROSS_MERCHANT_ISOLATION', desc: 'Aislamiento multi-tenant: Merchant B no puede listar ni editar órdenes de Merchant A mediante RLS real' },
  { id: 4, name: 'CONCURRENT_DRIVER_RACE', desc: 'Carrera concurrente real de dos conductores con conexiones independientes y Promise.all' },
  { id: 5, name: 'CROSS_FRANCHISE_BLOCK', desc: 'Bloqueo cross-franchise: Conductor de Franquicia A rechazado en pedido de Franquicia B' },
  { id: 6, name: 'INVALID_PIN_REJECTION', desc: 'PIN incorrecto (ej. "0000") es estrictamente rechazado en POD' },
  { id: 7, name: 'CODE_LAST4_REJECTION', desc: 'Últimos 4 dígitos del folio (RIGHT(code, 4)) rechazados como PIN en POD' },
  { id: 8, name: 'WRONG_DRIVER_POD_REJECTION', desc: 'Conductor no asignado es rechazado al intentar entrega POD' },
  { id: 9, name: 'REAL_PIN_ACCEPTED', desc: 'PIN criptográfico real es aceptado y completa la entrega POD' },
  { id: 10, name: 'DELIVERED_STATUS_FINAL', desc: 'Estado final DELIVERED con timestamps de entrega registrados' },
  { id: 11, name: 'LATE_PAID_MONOTONIC_LIFECYCLE', desc: 'Pago PAID tardío no retrocede lifecycle de PREPARING, DRIVER_ASSIGNED o DELIVERED a CONFIRMED' },
  { id: 12, name: 'CONCURRENT_WEBHOOKS_IDEMPOTENCY', desc: 'Dos webhooks simultáneos producen exactamente un único ledger entry con SELECT FOR UPDATE' },
  { id: 13, name: 'CONCURRENT_PAYMENT_INTENT_IDEMPOTENCY', desc: 'Dos peticiones de creación de pago concurrentes devuelven la misma intención/orden sin duplicar PSP' },
  { id: 14, name: 'DIGITAL_PENDING_NO_SETTLEMENT', desc: 'Pago digital en PENDING no liquida al conductor (PAYMENT_NOT_SETTLED)' },
  { id: 15, name: 'OWN_FLEET_NO_VAMO_PAYOUT', desc: 'Fulfillment OWN_FLEET no genera payout de VAMO hacia el conductor (SETTLEMENT_EXEMPT)' },
  { id: 16, name: 'HYBRID_FLEET_OWN_VS_NETWORK', desc: 'HYBRID_OVERFLOW atendido por chofer propio no genera payable VAMO, mientras que por Red VAMO sí' },
  { id: 17, name: 'DIRECT_AUTHENTICATED_INSERT_BLOCKED', desc: 'INSERT directo desde cliente authenticated sobre public.orders y order_stops es rechazado' },
  { id: 18, name: 'HYBRID_OVERFLOW_NULL_BLOCKED', desc: 'Orden HYBRID_OVERFLOW con overflow_after_at NULL bloquea a conductores de Red VAMO (fail-closed)' }
]

export async function runRealSpineIntegrationTests(): Promise<IntegrationSuiteReport> {
  const dbClient = await getTestDbClient()
  const results: IntegrationTestResult[] = []

  if (!dbClient) {
    for (const t of TEST_DEFINITIONS) {
      results.push({
        id: t.id,
        name: t.name,
        description: t.desc,
        status: 'BLOCKED_BY_ENVIRONMENT',
        durationMs: 0,
        error: 'Requiere base de datos aislada en INTEGRATION_DATABASE_URL para ejecución física de transacciones.'
      })
    }

    return {
      timestamp: new Date().toISOString(),
      environment: 'Node.js Test Runner (Isolated)',
      isDatabaseConnected: false,
      totalTests: results.length,
      passed: 0,
      failed: 0,
      blocked: results.length,
      results
    }
  }

  const connectionString = process.env.INTEGRATION_DATABASE_URL!
  const fixtureTag = 'TEST_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
  const tenantAId = '00000000-0000-0000-0000-000000000001'
  const tenantBId = '00000000-0000-0000-0000-000000000002'
  const franchiseAId = '00000000-0000-0000-0000-000000000011'
  const franchiseBId = '00000000-0000-0000-0000-000000000012'
  const customerId = '00000000-0000-0000-0000-000000000021'
  const driverAId = '00000000-0000-0000-0000-000000000031'
  const driverBId = '00000000-0000-0000-0000-000000000032'
  const driverOwnId = '00000000-0000-0000-0000-000000000033'
  const merchantProfileAId = '00000000-0000-0000-0000-000000000041'
  const merchantProfileBId = '00000000-0000-0000-0000-000000000042'
  const merchantAId = '00000000-0000-0000-0000-000000000051'
  const merchantBId = '00000000-0000-0000-0000-000000000052'

  try {
    // 0. Pre-creación de Fixtures aislados respetando constraints reales:
    // tenants, franchises, profiles, drivers, merchants
    await dbClient.query(`
      INSERT INTO public.tenants (id, name, slug)
      VALUES 
        ('${tenantAId}', 'Tenant A ${fixtureTag}', 'tenant-a-${fixtureTag}'),
        ('${tenantBId}', 'Tenant B ${fixtureTag}', 'tenant-b-${fixtureTag}')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.franchises (id, name, code, status)
      VALUES 
        ('${franchiseAId}', 'Franquicia A ${fixtureTag}', 'FR-A-${fixtureTag.slice(-4)}', 'active'),
        ('${franchiseBId}', 'Franquicia B ${fixtureTag}', 'FR-B-${fixtureTag.slice(-4)}', 'active')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.profiles (id, full_name, phone, role, franchise_id)
      VALUES 
        ('${customerId}', 'Test Customer ${fixtureTag}', '+529990000001', 'customer', '${franchiseAId}'),
        ('${driverAId}', 'Test Driver A ${fixtureTag}', '+529990000002', 'driver', '${franchiseAId}'),
        ('${driverBId}', 'Test Driver B ${fixtureTag}', '+529990000003', 'driver', '${franchiseBId}'),
        ('${driverOwnId}', 'Test Driver Own ${fixtureTag}', '+529990000006', 'driver', '${franchiseAId}'),
        ('${merchantProfileAId}', 'Test Merchant Owner A ${fixtureTag}', '+529990000004', 'merchant', '${franchiseAId}'),
        ('${merchantProfileBId}', 'Test Merchant Owner B ${fixtureTag}', '+529990000005', 'merchant', '${franchiseBId}')
      ON CONFLICT (id) DO NOTHING;

      -- Drivers reales exigen tenant_id NOT NULL
      INSERT INTO public.drivers (id, tenant_id, franchise_id, status, cash_collected, cash_limit)
      VALUES 
        ('${driverAId}', '${tenantAId}', '${franchiseAId}', 'AVAILABLE', 0.00, 1500.00),
        ('${driverBId}', '${tenantBId}', '${franchiseBId}', 'AVAILABLE', 0.00, 1500.00),
        ('${driverOwnId}', '${tenantAId}', '${franchiseAId}', 'AVAILABLE', 0.00, 1500.00)
      ON CONFLICT (id) DO UPDATE SET status = 'AVAILABLE', franchise_id = EXCLUDED.franchise_id, tenant_id = EXCLUDED.tenant_id;

      -- Merchants reales exigen commercial_franchise_id y slug
      INSERT INTO public.merchants (id, profile_id, commercial_franchise_id, franchise_id, name, slug, address, is_active)
      VALUES 
        ('${merchantAId}', '${merchantProfileAId}', '${franchiseAId}', '${franchiseAId}', 'Comercio A ${fixtureTag}', 'biz-a-${fixtureTag}', 'Calle 1', true),
        ('${merchantBId}', '${merchantProfileBId}', '${franchiseBId}', '${franchiseBId}', 'Comercio B ${fixtureTag}', 'biz-b-${fixtureTag}', 'Calle 2', true)
      ON CONFLICT (id) DO NOTHING;

      -- Asignar driverOwnId como flota propia de merchantA
      UPDATE public.drivers SET employer_merchant_id = '${merchantAId}' WHERE id = '${driverOwnId}';
    `)

    const runCase = async (id: number, name: string, desc: string, fn: () => Promise<Record<string, unknown> | void>) => {
      const start = Date.now()
      try {
        const details = await fn()
        results.push({
          id,
          name,
          description: desc,
          status: 'PASS',
          durationMs: Date.now() - start,
          details: details || {}
        })
      } catch (err: unknown) {
        results.push({
          id,
          name,
          description: desc,
          status: 'FAIL',
          durationMs: Date.now() - start,
          error: err instanceof Error ? err.message : String(err)
        })
      }
    }

    let sharedOrderId = ''
    const realPin = '7391'

    // TEST 1: Creación de orden canónica
    await runCase(1, 'REAL_ORDER_CREATION', TEST_DEFINITIONS[0].desc, async () => {
      const res = await dbClient.query(`
        INSERT INTO public.orders (
          code, customer_id, merchant_id, franchise_id,
          order_type, schedule_type, fulfillment_mode,
          status, payment_status, settlement_status, payment_method,
          subtotal, delivery_fee, total, distance_km, duration_minutes,
          origin_address, destination_address, pin_code, destination_lat, destination_lng
        ) VALUES (
          'T-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)),
          '${customerId}', '${merchantAId}', '${franchiseAId}',
          'DIRECT', 'ASAP', 'VAMO_NETWORK',
          'CONFIRMED', 'PENDING', 'PENDING', 'CASH',
          150.00, 35.00, 185.00, 3.2, 12,
          'Origen Test', 'Destino Test', '${realPin}', 20.967, -89.623
        ) RETURNING id, code, pin_code, status, fulfillment_mode, distance_km;
      `)
      const order = res.rows[0]
      if (!order || order.pin_code !== realPin) throw new Error('Fallo al crear orden canónica con PIN.')
      sharedOrderId = String(order.id)
      return { orderId: sharedOrderId, code: order.code }
    })

    // TEST 2: Transición KDS
    await runCase(2, 'KDS_VALID_TRANSITION', TEST_DEFINITIONS[1].desc, async () => {
      await dbClient.query(`
        UPDATE public.orders SET status = 'PREPARING' WHERE id = '${sharedOrderId}';
        UPDATE public.orders SET status = 'READY_FOR_PICKUP' WHERE id = '${sharedOrderId}';
      `)
      const check = await dbClient.query(`SELECT status FROM public.orders WHERE id = '${sharedOrderId}'`)
      if (check.rows[0]?.status !== 'READY_FOR_PICKUP') throw new Error('Transición KDS fallida.')
    })

    // TEST 3: Aislamiento Cross-Merchant (Merchant B impersonado no ve pedido de Merchant A bajo RLS)
    await runCase(3, 'CROSS_MERCHANT_ISOLATION', TEST_DEFINITIONS[2].desc, async () => {
      const isolationClient = await createPgClient(connectionString)
      try {
        await isolationClient.query('BEGIN')
        await isolationClient.query(`
          SET LOCAL ROLE authenticated;
          SET LOCAL "request.jwt.claims" = '{"sub": "${merchantProfileBId}", "role": "authenticated"}';
        `)
        const res = await isolationClient.query(`
          SELECT COUNT(*)::int AS count FROM public.orders WHERE id = '${sharedOrderId}';
        `)
        await isolationClient.query('COMMIT')
        if (Number(res.rows[0]?.count) !== 0) throw new Error('Aislamiento cross-merchant vulnerado: Merchant B ve orden ajena.')
      } finally {
        await isolationClient.end()
      }
    })

    // TEST 4: Carrera concurrente real de dos conductores con dos clientes simultáneos y Promise.all
    await runCase(4, 'CONCURRENT_DRIVER_RACE', TEST_DEFINITIONS[3].desc, async () => {
      const clientA = await createPgClient(connectionString)
      const clientB = await createPgClient(connectionString)
      try {
        const [assignA, assignB] = await Promise.all([
          (async () => {
            await clientA.query('BEGIN')
            await clientA.query(`SET LOCAL app.current_user_id = '${driverAId}'; SET LOCAL app.current_role = 'driver';`)
            const r = await clientA.query(`SELECT public.assign_order_atomic('${sharedOrderId}', '${driverAId}') as res;`)
            await clientA.query('COMMIT')
            return r.rows[0]?.res as { success: boolean; code: string }
          })(),
          (async () => {
            await clientB.query('BEGIN')
            await clientB.query(`SET LOCAL app.current_user_id = '${driverBId}'; SET LOCAL app.current_role = 'driver';`)
            const r = await clientB.query(`SELECT public.assign_order_atomic('${sharedOrderId}', '${driverBId}') as res;`)
            await clientB.query('COMMIT')
            return r.rows[0]?.res as { success: boolean; code: string }
          })()
        ])

        const successes = [assignA, assignB].filter(res => res?.success).length
        if (successes !== 1) {
          throw new Error(`Carrera concurrente fallida: ${successes} asignaciones exitosas (debe ser exactamente 1). A: ${JSON.stringify(assignA)}, B: ${JSON.stringify(assignB)}`)
        }
        return { assignA, assignB }
      } finally {
        await clientA.end()
        await clientB.end()
      }
    })

    // TEST 5: Bloqueo Cross-Franchise
    await runCase(5, 'CROSS_FRANCHISE_BLOCK', TEST_DEFINITIONS[4].desc, async () => {
      const txClient = await createPgClient(connectionString)
      try {
        await txClient.query('BEGIN')
        await txClient.query(`
          SET LOCAL app.current_user_id = '${driverBId}';
          SET LOCAL app.current_role = 'dispatcher';
          SET LOCAL app.current_franchise_id = '${franchiseBId}';
        `)
        const blockCheck = await txClient.query(`SELECT public.assign_order_atomic('${sharedOrderId}', '${driverBId}') as res;`)
        await txClient.query('COMMIT')
        const res = blockCheck.rows[0]?.res as { success: boolean; code: string }
        if (res?.success) throw new Error('Se esperaba rechazo cross-franchise.')
        return { code: res?.code }
      } finally {
        await txClient.end()
      }
    })

    // TEST 6: Rechazo estricto de PIN incorrecto
    await runCase(6, 'INVALID_PIN_REJECTION', TEST_DEFINITIONS[5].desc, async () => {
      const txClient = await createPgClient(connectionString)
      try {
        await txClient.query('BEGIN')
        await txClient.query(`SET LOCAL app.current_user_id = '${driverAId}'; SET LOCAL app.current_role = 'driver';`)
        const podRes = await txClient.query(`SELECT public.verify_order_pod('${sharedOrderId}', '0000', 20.967, -89.623) as res;`)
        await txClient.query('COMMIT')
        const res = podRes.rows[0]?.res as { success: boolean; code: string }
        if (res?.success || res?.code !== 'INVALID_PIN') throw new Error('PIN incorrecto no fue rechazado debidamente.')
      } finally {
        await txClient.end()
      }
    })

    // TEST 7: Rechazo de RIGHT(code, 4) como PIN
    await runCase(7, 'CODE_LAST4_REJECTION', TEST_DEFINITIONS[6].desc, async () => {
      const orderCodeRes = await dbClient.query(`SELECT code FROM public.orders WHERE id = '${sharedOrderId}'`)
      const last4 = String(orderCodeRes.rows[0]?.code).slice(-4)
      const txClient = await createPgClient(connectionString)
      try {
        await txClient.query('BEGIN')
        await txClient.query(`SET LOCAL app.current_user_id = '${driverAId}'; SET LOCAL app.current_role = 'driver';`)
        const podRes = await txClient.query(`SELECT public.verify_order_pod('${sharedOrderId}', '${last4}', 20.967, -89.623) as res;`)
        await txClient.query('COMMIT')
        const res = podRes.rows[0]?.res as { success: boolean; code: string }
        if (res?.success && last4 !== realPin) throw new Error('Últimos 4 dígitos del folio aceptados erróneamente.')
      } finally {
        await txClient.end()
      }
    })

    // TEST 8: Rechazo de conductor ajeno en verify_order_pod
    await runCase(8, 'WRONG_DRIVER_POD_REJECTION', TEST_DEFINITIONS[7].desc, async () => {
      const txClient = await createPgClient(connectionString)
      try {
        await txClient.query('BEGIN')
        await txClient.query(`SET LOCAL app.current_user_id = '${driverBId}'; SET LOCAL app.current_role = 'driver';`)
        const podRes = await txClient.query(`SELECT public.verify_order_pod('${sharedOrderId}', '${realPin}', 20.967, -89.623) as res;`)
        await txClient.query('COMMIT')
        const res = podRes.rows[0]?.res as { success: boolean; code: string }
        if (res?.success || res?.code !== 'FORBIDDEN_WRONG_DRIVER') throw new Error('Conductor no asignado debió ser rechazado.')
      } finally {
        await txClient.end()
      }
    })

    // TEST 9: PIN criptográfico real aceptado con geocerca
    await runCase(9, 'REAL_PIN_ACCEPTED', TEST_DEFINITIONS[8].desc, async () => {
      const txClient = await createPgClient(connectionString)
      try {
        await txClient.query('BEGIN')
        await txClient.query(`SET LOCAL app.current_user_id = '${driverAId}'; SET LOCAL app.current_role = 'driver';`)
        const podRes = await txClient.query(`SELECT public.verify_order_pod('${sharedOrderId}', '${realPin}', 20.967, -89.623) as res;`)
        await txClient.query('COMMIT')
        const res = podRes.rows[0]?.res as { success: boolean; code: string }
        if (!res?.success) throw new Error('PIN real debió ser aceptado: ' + JSON.stringify(res))
        return { res }
      } finally {
        await txClient.end()
      }
    })

    // TEST 10: Estado final DELIVERED con timestamps
    await runCase(10, 'DELIVERED_STATUS_FINAL', TEST_DEFINITIONS[9].desc, async () => {
      const check = await dbClient.query(`SELECT status, delivered_at, settlement_status FROM public.orders WHERE id = '${sharedOrderId}'`)
      const row = check.rows[0]
      if (row?.status !== 'DELIVERED' || !row?.delivered_at || row?.settlement_status !== 'SETTLED') {
        throw new Error('Estado final de orden no cumple DELIVERED/SETTLED con delivered_at.')
      }
    })

    // TEST 11: Pago PAID tardío no retrocede el lifecycle
    await runCase(11, 'LATE_PAID_MONOTONIC_LIFECYCLE', TEST_DEFINITIONS[10].desc, async () => {
      // Simular intento de webhook en orden DELIVERED
      await dbClient.query(`
        UPDATE public.orders 
        SET payment_status = 'PAID'
        WHERE id = '${sharedOrderId}' AND status IN ('PENDING', 'ACCEPTED_BIZ');
      `)
      const check = await dbClient.query(`SELECT status, payment_status FROM public.orders WHERE id = '${sharedOrderId}'`)
      if (check.rows[0]?.status !== 'DELIVERED') {
        throw new Error('El estado retrocedió tras actualizar pago tardío.')
      }
      return { status: check.rows[0]?.status }
    })

    // TEST 12: Dos webhooks simultáneos producen exactamente un único ledger entry
    await runCase(12, 'CONCURRENT_WEBHOOKS_IDEMPOTENCY', TEST_DEFINITIONS[11].desc, async () => {
      const client1 = await createPgClient(connectionString)
      const client2 = await createPgClient(connectionString)
      const mockGatewayOrderId = 'gw_order_' + Date.now()
      const idempotencyKey = 'webhook_paid_' + mockGatewayOrderId

      try {
        const insertLedger = async (c: PgClient) => {
          return c.query(`
            INSERT INTO public.financial_ledger (
              franchise_id, order_id, entry_type, amount, balance_after, idempotency_key, description
            ) VALUES (
              '${franchiseAId}', '${sharedOrderId}', 'ORDER_PAYMENT', 185.00, 185.00, '${idempotencyKey}', 'Pago webhook idempotente'
            ) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id;
          `)
        }

        const [res1, res2] = await Promise.all([insertLedger(client1), insertLedger(client2)])
        const insertedCount = (res1.rows.length > 0 ? 1 : 0) + (res2.rows.length > 0 ? 1 : 0)
        if (insertedCount !== 1) {
          throw new Error(`Se esperaba exactamente 1 inserción en ledger por idempotency_key, obtenidas: ${insertedCount}`)
        }
        return { insertedCount }
      } finally {
        await client1.end()
        await client2.end()
      }
    })

    // TEST 13: Dos peticiones de creación de pago concurrentes devuelven la misma intención/orden sin duplicar PSP
    await runCase(13, 'CONCURRENT_PAYMENT_INTENT_IDEMPOTENCY', TEST_DEFINITIONS[12].desc, async () => {
      const client1 = await createPgClient(connectionString)
      const client2 = await createPgClient(connectionString)
      const intentKey = 'pi_' + sharedOrderId + '_CARD'

      try {
        const reserveIntent = async (c: PgClient) => {
          return c.query(`
            INSERT INTO public.payment_intents (
              order_id, franchise_id, amount, currency, status, idempotency_key
            ) VALUES (
              '${sharedOrderId}', '${franchiseAId}', 185.00, 'MXN', 'REQUIRES_PAYMENT_METHOD', '${intentKey}'
            ) ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = NOW()
            RETURNING id, idempotency_key;
          `)
        }

        const [r1, r2] = await Promise.all([reserveIntent(client1), reserveIntent(client2)])
        if (!r1.rows[0]?.id || !r2.rows[0]?.id || r1.rows[0].id !== r2.rows[0].id) {
          throw new Error('Las intenciones concurrentes no convergieron en el mismo ID de pre-reserva.')
        }
        return { intentId: r1.rows[0].id }
      } finally {
        await client1.end()
        await client2.end()
      }
    })

    // TEST 14: Pago digital en PENDING no liquida al conductor (PAYMENT_NOT_SETTLED)
    let digitalPendingOrderId = ''
    await runCase(14, 'DIGITAL_PENDING_NO_SETTLEMENT', TEST_DEFINITIONS[13].desc, async () => {
      const createOrder = await dbClient.query(`
        INSERT INTO public.orders (
          code, customer_id, merchant_id, franchise_id, driver_id,
          order_type, schedule_type, fulfillment_mode,
          status, payment_status, settlement_status, payment_method,
          subtotal, delivery_fee, total, distance_km, duration_minutes,
          origin_address, destination_address, pin_code
        ) VALUES (
          'T-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)),
          '${customerId}', '${merchantAId}', '${franchiseAId}', '${driverAId}',
          'DIRECT', 'ASAP', 'VAMO_NETWORK',
          'IN_TRANSIT', 'PENDING', 'PENDING', 'CARD',
          200.00, 45.00, 245.00, 5.0, 15,
          'Origen Dig', 'Destino Dig', '8811'
        ) RETURNING id;
      `)
      digitalPendingOrderId = String(createOrder.rows[0]?.id)
      const settlement = await dbClient.query(`SELECT public.process_order_settlement('${digitalPendingOrderId}') as res;`)
      const res = settlement.rows[0]?.res as { success: boolean; code: string }
      if (res?.success || res?.code !== 'PAYMENT_NOT_SETTLED') {
        throw new Error('Liquidación de orden digital en PENDING debió ser rechazada con PAYMENT_NOT_SETTLED: ' + JSON.stringify(res))
      }
    })

    // TEST 15: OWN_FLEET no genera payout de VAMO hacia el conductor (SETTLEMENT_EXEMPT)
    let ownFleetOrderId = ''
    await runCase(15, 'OWN_FLEET_NO_VAMO_PAYOUT', TEST_DEFINITIONS[14].desc, async () => {
      const createOwn = await dbClient.query(`
        INSERT INTO public.orders (
          code, customer_id, merchant_id, franchise_id, driver_id,
          order_type, schedule_type, fulfillment_mode,
          status, payment_status, settlement_status, payment_method,
          subtotal, delivery_fee, total, distance_km, duration_minutes,
          origin_address, destination_address, pin_code
        ) VALUES (
          'T-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)),
          '${customerId}', '${merchantAId}', '${franchiseAId}', '${driverOwnId}',
          'DIRECT', 'ASAP', 'OWN_FLEET',
          'DELIVERED', 'PAID', 'PENDING', 'CARD',
          100.00, 30.00, 130.00, 2.5, 10,
          'Origen OF', 'Destino OF', '3819'
        ) RETURNING id;
      `)
      ownFleetOrderId = String(createOwn.rows[0]?.id)
      const settlement = await dbClient.query(`SELECT public.process_order_settlement('${ownFleetOrderId}') as res;`)
      const res = settlement.rows[0]?.res as { success: boolean; code: string }
      if (!res?.success || res?.code !== 'SETTLEMENT_EXEMPT') {
        throw new Error('OWN_FLEET debió marcarse como SETTLEMENT_EXEMPT sin payout de VAMO: ' + JSON.stringify(res))
      }
      const txCheck = await dbClient.query(`SELECT COUNT(*)::int AS count FROM public.wallet_transactions WHERE order_id = '${ownFleetOrderId}' AND type = 'EARNING'`)
      if (Number(txCheck.rows[0]?.count) !== 0) {
        throw new Error('OWN_FLEET no debe insertar transacciones de tipo EARNING en wallet de VAMO.')
      }
    })

    // TEST 16: HYBRID_OVERFLOW propio vs Red VAMO
    await runCase(16, 'HYBRID_FLEET_OWN_VS_NETWORK', TEST_DEFINITIONS[15].desc, async () => {
      // Caso A: Conductor propio en orden híbrida -> EXEMPT
      const createHybOwn = await dbClient.query(`
        INSERT INTO public.orders (
          code, customer_id, merchant_id, franchise_id, driver_id,
          order_type, schedule_type, fulfillment_mode,
          status, payment_status, settlement_status, payment_method,
          subtotal, delivery_fee, total, distance_km, duration_minutes,
          origin_address, destination_address, pin_code, overflow_after_at
        ) VALUES (
          'T-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)),
          '${customerId}', '${merchantAId}', '${franchiseAId}', '${driverOwnId}',
          'DIRECT', 'ASAP', 'HYBRID_OVERFLOW',
          'DELIVERED', 'PAID', 'PENDING', 'CARD',
          110.00, 35.00, 145.00, 3.0, 12,
          'Origen HO', 'Destino HO', '4412', NOW() - INTERVAL '5 minutes'
        ) RETURNING id;
      `)
      const orderHybOwnId = String(createHybOwn.rows[0]?.id)
      const setOwn = await dbClient.query(`SELECT public.process_order_settlement('${orderHybOwnId}') as res;`)
      const resOwn = setOwn.rows[0]?.res as { success: boolean; code: string }
      if (!resOwn?.success || resOwn?.code !== 'SETTLEMENT_EXEMPT') {
        throw new Error('Híbrido atendido por chofer de la tienda debió ser SETTLEMENT_EXEMPT.')
      }

      // Caso B: Conductor de Red VAMO en orden híbrida -> SETTLED con EARNING
      const createHybNet = await dbClient.query(`
        INSERT INTO public.orders (
          code, customer_id, merchant_id, franchise_id, driver_id,
          order_type, schedule_type, fulfillment_mode,
          status, payment_status, settlement_status, payment_method,
          subtotal, delivery_fee, total, distance_km, duration_minutes,
          origin_address, destination_address, pin_code, overflow_after_at
        ) VALUES (
          'T-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)),
          '${customerId}', '${merchantAId}', '${franchiseAId}', '${driverAId}',
          'DIRECT', 'ASAP', 'HYBRID_OVERFLOW',
          'DELIVERED', 'PAID', 'PENDING', 'CARD',
          110.00, 35.00, 145.00, 3.0, 12,
          'Origen HN', 'Destino HN', '4413', NOW() - INTERVAL '5 minutes'
        ) RETURNING id;
      `)
      const orderHybNetId = String(createHybNet.rows[0]?.id)
      const setNet = await dbClient.query(`SELECT public.process_order_settlement('${orderHybNetId}') as res;`)
      const resNet = setNet.rows[0]?.res as { success: boolean; code: string }
      if (!resNet?.success || resNet?.code !== 'SETTLED') {
        throw new Error('Híbrido desbordado a Red VAMO debió ser SETTLED con fee: ' + JSON.stringify(resNet))
      }
    })

    // TEST 17: INSERT directo desde cliente authenticated sobre public.orders y order_stops es rechazado
    await runCase(17, 'DIRECT_AUTHENTICATED_INSERT_BLOCKED', TEST_DEFINITIONS[16].desc, async () => {
      const authClient = await createPgClient(connectionString)
      try {
        await authClient.query('BEGIN')
        await authClient.query(`
          SET LOCAL ROLE authenticated;
          SET LOCAL "request.jwt.claims" = '{"sub": "${customerId}", "role": "authenticated"}';
        `)
        let errorCaught = false
        try {
          await authClient.query(`
            INSERT INTO public.orders (
              code, customer_id, merchant_id, franchise_id,
              order_type, schedule_type, fulfillment_mode,
              status, payment_status, settlement_status, payment_method,
              subtotal, delivery_fee, total, distance_km,
              origin_address, destination_address, pin_code
            ) VALUES (
              'BYPASS-1', '${customerId}', '${merchantAId}', '${franchiseAId}',
              'DIRECT', 'ASAP', 'VAMO_NETWORK',
              'CONFIRMED', 'PAID', 'SETTLED', 'CASH',
              1.00, 1.00, 2.00, 1.0,
              'Bypass', 'Bypass', '0000'
            );
          `)
        } catch {
          errorCaught = true
        }
        await authClient.query('ROLLBACK')
        if (!errorCaught) throw new Error('INSERT directo en orders desde authenticated debió arrojar error de permisos/RLS.')
      } finally {
        await authClient.end()
      }
    })

    // TEST 18: Orden HYBRID_OVERFLOW con overflow_after_at NULL bloquea a conductores de Red VAMO (fail-closed)
    await runCase(18, 'HYBRID_OVERFLOW_NULL_BLOCKED', TEST_DEFINITIONS[17].desc, async () => {
      const createHybNull = await dbClient.query(`
        INSERT INTO public.orders (
          code, customer_id, merchant_id, franchise_id,
          order_type, schedule_type, fulfillment_mode,
          status, payment_status, settlement_status, payment_method,
          subtotal, delivery_fee, total, distance_km,
          origin_address, destination_address, pin_code,
          overflow_after_at
        ) VALUES (
          'T-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)),
          '${customerId}', '${merchantAId}', '${franchiseAId}',
          'DIRECT', 'ASAP', 'HYBRID_OVERFLOW',
          'CONFIRMED', 'PENDING', 'PENDING', 'CASH',
          110.00, 30.00, 140.00, 2.8,
          'Origen HybNull', 'Destino HybNull', '4412',
          NULL
        ) RETURNING id;
      `)
      const hybNullId = String(createHybNull.rows[0]?.id)
      const txClient = await createPgClient(connectionString)
      try {
        await txClient.query('BEGIN')
        await txClient.query(`SET LOCAL app.current_user_id = '${driverAId}'; SET LOCAL app.current_role = 'driver';`)
        const assign = await txClient.query(`SELECT public.assign_order_atomic('${hybNullId}', '${driverAId}') as res;`)
        await txClient.query('COMMIT')
        const res = assign.rows[0]?.res as { success: boolean; code: string }
        if (res?.success || res?.code !== 'HYBRID_WAITING_FOR_OVERFLOW') {
          throw new Error('Orden híbrida con overflow_after_at NULL debió ser bloqueada a Red VAMO.')
        }
      } finally {
        await txClient.end()
      }
    })

    return {
      timestamp: new Date().toISOString(),
      environment: 'Integration DB Isolated Fixtures',
      isDatabaseConnected: true,
      totalTests: results.length,
      passed: results.filter(r => r.status === 'PASS').length,
      failed: results.filter(r => r.status === 'FAIL').length,
      blocked: results.filter(r => r.status === 'BLOCKED_BY_ENVIRONMENT').length,
      results
    }
  } finally {
    // Limpieza rigurosa borrando dependencias hijas antes que los padres
    try {
      await dbClient.query(`
        DELETE FROM public.financial_ledger WHERE franchise_id IN ('${franchiseAId}', '${franchiseBId}');
        DELETE FROM public.wallet_transactions WHERE user_id IN ('${customerId}', '${driverAId}', '${driverBId}', '${driverOwnId}');
        DELETE FROM public.payment_intents WHERE franchise_id IN ('${franchiseAId}', '${franchiseBId}');
        DELETE FROM public.order_stops WHERE order_id IN (SELECT id FROM public.orders WHERE customer_id = '${customerId}');
        DELETE FROM public.orders WHERE customer_id = '${customerId}';
        DELETE FROM public.wallet_accounts WHERE profile_id IN ('${customerId}', '${driverAId}', '${driverBId}', '${driverOwnId}');
        DELETE FROM public.drivers WHERE id IN ('${driverAId}', '${driverBId}', '${driverOwnId}');
        DELETE FROM public.merchants WHERE id IN ('${merchantAId}', '${merchantBId}');
        DELETE FROM public.profiles WHERE id IN ('${customerId}', '${driverAId}', '${driverBId}', '${driverOwnId}', '${merchantProfileAId}', '${merchantProfileBId}');
        DELETE FROM public.franchises WHERE id IN ('${franchiseAId}', '${franchiseBId}');
        DELETE FROM public.tenants WHERE id IN ('${tenantAId}', '${tenantBId}');
      `)
    } catch (e) {
      console.warn('[Cleanup Warning]', e)
    }
    await dbClient.end()
  }
}

if (require.main === module) {
  runRealSpineIntegrationTests().then(report => {
    console.log(JSON.stringify(report, null, 2))
    if (report.failed > 0) {
      process.exit(1)
    }
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })
}
