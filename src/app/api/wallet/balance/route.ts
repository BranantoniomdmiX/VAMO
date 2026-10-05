import { NextResponse, type NextRequest } from 'next/server'
import { withTrustedAuthContext } from '@/lib/auth/contextResolver'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedProfileId = searchParams.get('profileId')

    const result = await withTrustedAuthContext(async (authContext, client) => {
      let effectiveProfileId = authContext.userId
      if (authContext.role !== 'superadmin' && authContext.role !== 'master') {
        if (requestedProfileId && requestedProfileId !== authContext.userId) {
          return {
            status: 403,
            payload: {
              success: false,
              code: 'FORBIDDEN_PROFILE_MISMATCH',
              message: 'No puede consultar la billetera de otro usuario.'
            }
          }
        }
        effectiveProfileId = authContext.userId
      } else if (requestedProfileId) {
        effectiveProfileId = requestedProfileId
      }

      // 1. Obtener cuenta de billetera bajo RLS
      const walletRes = await client.query<{
        id: string
        balance: string
        held_balance: string
        currency: string
        is_locked: boolean
      }>(
        'SELECT id, balance, held_balance, currency, is_locked FROM public.wallet_accounts WHERE profile_id = $1;',
        [effectiveProfileId]
      )

      const wallet = walletRes.rows[0]

      // 2. Si no tiene billetera, devolver saldo en 0
      if (!wallet) {
        return {
          status: 200,
          payload: {
            success: true,
            wallet: {
              balance: 0.00,
              held_balance: 0.00,
              currency: 'MXN',
              is_locked: false
            },
            transactions: []
          }
        }
      }

      // 3. Obtener últimas transacciones inmutables bajo RLS
      const txRes = await client.query<{
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

      return {
        status: 200,
        payload: {
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
        }
      }
    })

    if (!result) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'Sesión no válida o ausente.' },
        { status: 401 }
      )
    }

    return NextResponse.json(result.payload, { status: result.status })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: error.message || 'Error al consultar la billetera.' },
      { status: 500 }
    )
  }
}
