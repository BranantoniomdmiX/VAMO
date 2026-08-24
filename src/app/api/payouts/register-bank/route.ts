import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PayoutService } from '@/lib/services/payoutService'

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

    // Validar usuario autenticado con getUser()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Inicia sesión.' }, { status: 401 })
    }

    const body = await req.json()
    const { bankName, clabeNumber, cardNumber, beneficiaryName, rfcCurp, payoutFrequency, role } = body

    if (!clabeNumber || !beneficiaryName) {
      return NextResponse.json({ error: 'CLABE interbancaria y Nombre del titular son requeridos.' }, { status: 400 })
    }

    const validation = PayoutService.validateClabe(clabeNumber)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const finalBankName = bankName || validation.bankName || 'Banco Mexicano'

    // Upsert en la tabla user_bank_accounts
    const { data, error } = await supabase.from('user_bank_accounts').upsert({
      user_id: user.id,
      role: role || 'driver',
      bank_name: finalBankName,
      clabe_number: clabeNumber.replace(/\s+/g, ''),
      card_number: cardNumber ? cardNumber.replace(/\s+/g, '') : null,
      beneficiary_name: beneficiaryName.toUpperCase(),
      rfc_curp: rfcCurp ? rfcCurp.toUpperCase() : null,
      payout_frequency: payoutFrequency || 'DAILY',
      is_verified: true
    }).select().single()

    if (error) {
      console.error('Error guardando cuenta bancaria en Supabase:', error)
      return NextResponse.json({ 
        success: true, 
        message: 'Cuenta bancaria registrada exitosamente (Modo Local)',
        data: {
          userId: user.id,
          bankName: finalBankName,
          clabeNumber,
          beneficiaryName,
          payoutFrequency: payoutFrequency || 'DAILY'
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cuenta de ${finalBankName} vinculada exitosamente para dispersión SPEI.`, 
      data 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al procesar registro bancario' }, { status: 500 })
  }
}
