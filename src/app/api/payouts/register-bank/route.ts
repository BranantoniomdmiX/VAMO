import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PayoutService } from '@/lib/services/payoutService'
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
      return NextResponse.json({ error: 'No autorizado. Inicia sesión.' }, { status: 401 })
    }

    const body = await req.json()
    const { bankName, clabeNumber, cardNumber, beneficiaryName, rfcCurp, payoutFrequency } = body

    if (!clabeNumber || !beneficiaryName) {
      return NextResponse.json({ error: 'CLABE interbancaria y Nombre del titular son requeridos.' }, { status: 400 })
    }

    const validation = PayoutService.validateClabe(clabeNumber)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const finalBankName = bankName || validation.bankName || 'Banco Mexicano'

    // Upsert en la tabla user_bank_accounts
    // NOTA: is_verified queda en false por defecto para requerir validación de titularidad real
    const { data, error } = await supabase.from('user_bank_accounts').upsert({
      user_id: authContext.userId,
      role: authContext.role,
      bank_name: finalBankName,
      clabe_number: clabeNumber.replace(/\s+/g, ''),
      card_number: cardNumber ? cardNumber.replace(/\s+/g, '') : null,
      beneficiary_name: beneficiaryName.toUpperCase(),
      rfc_curp: rfcCurp ? rfcCurp.toUpperCase() : null,
      payout_frequency: payoutFrequency || 'DAILY',
      is_verified: false // Requiere verificación de titularidad; no asumir verificado inmediatamente
    }).select().single()

    // Intentar registrar en PostgreSQL Dokploy si está habilitada la función para el rol o servicio
    try {
      const { query } = await import('@/lib/db/postgres')
      await query(
        'SELECT public.register_bank_account($1, $2, $3, $4);',
        [authContext.userId, beneficiaryName.toUpperCase(), clabeNumber.replace(/\s+/g, ''), finalBankName]
      )
    } catch (pgErr) {
      console.warn('[Register Bank] Dokploy direct sync notice:', pgErr)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cuenta de ${finalBankName} vinculada exitosamente (pendiente de validación SPEI).`,
      data: {
        userId: authContext.userId,
        bankName: finalBankName,
        beneficiaryName: beneficiaryName.toUpperCase(),
        clabeMasked: '••••••••••••••' + clabeNumber.slice(-4),
        isVerified: false
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al procesar registro bancario' }, { status: 500 })
  }
}
