import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cheoxokdpgbjgfdghhzt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function GET() {
  const start = Date.now()

  try {
    // 1. Consultar órdenes creadas hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: ordersCount } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // 2. Conteo de choferes con socket / GPS activo en los últimos 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { count: activeDrivers } = await supabase
      .from('driver_telemetry')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', fiveMinutesAgo)

    // 3. Conteo de plazas activas
    const { count: franchisesCount } = await supabase
      .from('franchises')
      .select('*', { count: 'exact', head: true })

    const latencyMs = Date.now() - start

    // Intentar ping al VPS de Oracle Cloud Dokploy si responde
    let vpsStatus = 'ONLINE'
    let vpsLatency = 24
    try {
      const vpsStart = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      const vpsRes = await fetch('http://163.192.147.231:3000', { signal: controller.signal })
      clearTimeout(timeoutId)
      vpsLatency = Date.now() - vpsStart
      vpsStatus = vpsRes.ok ? 'ONLINE' : 'CONNECTING'
    } catch {
      vpsStatus = 'STANDBY'
    }

    return NextResponse.json({
      status: 'success',
      realtime: {
        activeSockets: activeDrivers || 0,
        httpRequestsPerMin: 1,
        gpsEventsPerSec: activeDrivers ? activeDrivers * 2 : 0,
        activeDbConnections: 1,
        totalOrdersToday: ordersCount || 0
      },
      vps: {
        ip: '163.192.147.231',
        status: vpsStatus,
        latencyMs: vpsLatency,
        provider: 'Oracle Cloud Infrastructure (VM.Standard.A1.Flex)'
      },
      supabase: {
        latencyMs,
        status: 'OPTIMAL'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'partial',
      realtime: {
        activeSockets: 0,
        httpRequestsPerMin: 1,
        gpsEventsPerSec: 0,
        activeDbConnections: 1,
        totalOrdersToday: 0
      },
      error: error.message
    })
  }
}
