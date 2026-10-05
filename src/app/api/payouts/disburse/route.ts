import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getTrustedAuthContext } from '@/lib/auth/contextResolver'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const authContext = await getTrustedAuthContext()
    if (!authContext) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    // Solo superadmin / master puede ordenar dispersiones masivas/directas de fondos de usuarios
    if (authContext.role !== 'superadmin' && authContext.role !== 'master') {
      return NextResponse.json(
        { error: 'Prohibido. La dispersión directa requiere permisos administrativos.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { targetUserId, amount, destinationClabe, destinationBank } = body

    const beneficiaryUserId = targetUserId || authContext.userId

    if (!amount || amount <= 0 || !destinationClabe) {
      return NextResponse.json({ error: 'Monto y CLABE destino son obligatorios.' }, { status: 400 })
    }

    const transferId = `SPEI-CONEKTA-${Date.now()}`

    // 1. Ejecutar dispersión atómica y deducción en PostgreSQL Dokploy
    // FAIL-CLOSED: Cualquier fallo en base de datos detiene la operación inmediatamente.
    const { query } = await import('@/lib/db/postgres')
    const pgRes = await query<{ process_wallet_payout: any }>(
      'SELECT public.process_wallet_payout($1, $2, $3) as process_wallet_payout;',
      [beneficiaryUserId, amount, transferId]
    )

    const pgPayoutResult = pgRes.rows[0]?.process_wallet_payout
    if (!pgPayoutResult?.success) {
      return NextResponse.json(
        pgPayoutResult || { success: false, error: 'Error al procesar deducción de dispersión en balance' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      transferId,
      netAmount: amount,
      message: `Dispersión SPEI de $${amount.toFixed(2)} MXN procesada con éxito a ${destinationBank || 'banco'} (${destinationClabe}).`,
      payout: pgPayoutResult
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error ejecutando dispersión SPEI' }, { status: 500 })
  }
}
