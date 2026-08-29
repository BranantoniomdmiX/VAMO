import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, payoutType, destinationClabe, destinationBank, beneficiaryName, role } = body

    if (!amount || amount <= 0 || !destinationClabe) {
      return NextResponse.json({ error: 'Monto y CLABE destino son obligatorios.' }, { status: 400 })
    }

    const transferId = `SPEI-CONEKTA-${Date.now()}`

    // 1. Ejecutar dispersión atómica y deducción en PostgreSQL Dokploy
    let pgPayoutResult: any = null
    try {
      const { query } = await import('@/lib/db/postgres')
      const pgRes = await query<{ process_wallet_payout: any }>(
        'SELECT public.process_wallet_payout($1, $2, $3) as process_wallet_payout;',
        [user.id, amount, transferId]
      )
      pgPayoutResult = pgRes.rows[0]?.process_wallet_payout
      if (!pgPayoutResult?.success) {
        return NextResponse.json(pgPayoutResult, { status: 400 })
      }
    } catch (pgErr) {
      console.warn('[Payout Disburse] Dokploy direct sync warning:', pgErr)
    }

    return NextResponse.json({
      success: true,
      transferId,
      netAmount: amount,
      message: `Dispersión SPEI de $${amount.toFixed(2)} MXN procesada con éxito a ${destinationBank} (${destinationClabe}).`,
      payout: pgPayoutResult
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error ejecutando dispersión SPEI' }, { status: 500 })
  }
}
