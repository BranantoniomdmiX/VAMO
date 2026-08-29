import { NextResponse, type NextRequest } from 'next/server'
import { query } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

    if (!profileId) {
      return NextResponse.json(
        { success: false, code: 'INVALID_INPUT', message: 'Se requiere el parámetro profileId.' },
        { status: 400 }
      )
    }

    // 1. Obtener cuenta de billetera
    const walletRes = await query<{
      id: string
      balance: string
      held_balance: string
      currency: string
      is_locked: boolean
    }>(
      'SELECT id, balance, held_balance, currency, is_locked FROM public.wallet_accounts WHERE profile_id = $1;',
      [profileId]
    )

    const wallet = walletRes.rows[0]

    // 2. Si no tiene billetera, devolver saldo en 0
    if (!wallet) {
      return NextResponse.json({
        success: true,
        wallet: {
          balance: 0.00,
          held_balance: 0.00,
          currency: 'MXN',
          is_locked: false
        },
        transactions: []
      }, { status: 200 })
    }

    // 3. Obtener últimas transacciones inmutables
    const txRes = await query<{
      id: string
      type: string
      amount: string
      balance_before: string
      balance_after: string
      description: string
      created_at: string
    }>(
      'SELECT id, type, amount, balance_before, balance_after, description, created_at FROM public.wallet_transactions WHERE wallet_id = $1 ORDER BY created_at DESC LIMIT 20;',
      [wallet.id]
    )

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        balance: parseFloat(wallet.balance),
        held_balance: parseFloat(wallet.held_balance),
        currency: wallet.currency,
        is_locked: wallet.is_locked
      },
      transactions: txRes.rows.map(t => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        balance_before: parseFloat(t.balance_before),
        balance_after: parseFloat(t.balance_after),
        description: t.description,
        created_at: t.created_at
      }))
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: error.message || 'Error al consultar la billetera.' },
      { status: 500 }
    )
  }
}
