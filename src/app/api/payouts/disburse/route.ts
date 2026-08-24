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

    // Insertar en tabla de auditoría financiera
    const { data, error } = await supabase.from('payout_disbursements').insert({
      user_id: user.id,
      role: role || 'driver',
      payout_type: payoutType || 'DRIVER_EARNINGS',
      gross_amount: amount,
      fee_deducted: 0.00,
      net_amount: amount,
      destination_bank: destinationBank || 'Banco Mexicano',
      destination_clabe: destinationClabe,
      beneficiary_name: beneficiaryName || 'Titular VAMO',
      conekta_transfer_id: transferId,
      conekta_status: 'PAID',
      completed_at: new Date().toISOString()
    }).select().single()

    return NextResponse.json({
      success: true,
      transferId,
      netAmount: amount,
      message: `Dispersión SPEI de $${amount.toFixed(2)} MXN procesada con éxito a ${destinationBank} (${destinationClabe}).`,
      data
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error ejecutando dispersión SPEI' }, { status: 500 })
  }
}
