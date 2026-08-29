import { NextResponse, type NextRequest } from 'next/server'
import { query } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { profileId, amount, clabe } = await request.json()

    if (!profileId || !amount || !clabe) {
      return NextResponse.json(
        { success: false, code: 'INVALID_INPUT', message: 'Se requieren profileId, amount y clabe.' },
        { status: 400 }
      )
    }

    if (clabe.length !== 18) {
      return NextResponse.json(
        { success: false, code: 'INVALID_CLABE', message: 'La cuenta CLABE debe contener exactamente 18 dígitos.' },
        { status: 400 }
      )
    }

    const res = await query<{ request_wallet_withdrawal: any }>(
      'SELECT public.request_wallet_withdrawal($1, $2, $3) as request_wallet_withdrawal;',
      [profileId, amount, clabe]
    )

    const result = res.rows[0]?.request_wallet_withdrawal

    if (!result?.success) {
      return NextResponse.json(result || { success: false, message: 'Fondos insuficientes.' }, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: error.message || 'Error al solicitar el retiro.' },
      { status: 500 }
    )
  }
}
