'use client'

import React, { useState, useEffect } from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { UserCheck, Clock, Share2, AlertTriangle, ShieldCheck } from 'lucide-react'
import VamoMapLibre, { DriverMarkerData } from '@/components/map/VamoMapLibre'
import { gpsSocketService } from '@/lib/services/gpsSocketService'

import { orderRealtimeService, ServiceOrderPayload } from '@/lib/services/orderRealtimeService'
import { audioService } from '@/lib/services/audioService'
import { createClient } from '@/lib/supabase/client'
import { AntiFraudService, OVERFLOW_TIMEOUT_SECONDS, OVERFLOW_COMPENSATION_PERCENT } from '@/lib/services/antiFraudService'

export default function BaseDispatchPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [fleet, setFleet] = useState<DriverMarkerData[]>([])

  useEffect(() => {
    async function loadActiveServices() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .in('status', ['CREADO', 'CONFIRMADO', 'ASIGNADO', 'EN_CAMINO_RECOGER', 'RECOGIDO', 'EN_CAMINO_ENTREGA'])
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          setOrders(data.map(s => ({
            id: s.service_code || `#V-${s.id.slice(0, 4)}`,
            origin: s.origin_address || 'Origen',
            destination: s.destination_address || 'Destino',
            customer: s.customer_name || 'Cliente VAMO',
            status: s.status === 'ASIGNADO' || s.status === 'EN_CAMINO_RECOGER' || s.status === 'RECOGIDO' ? 'assigned' : 'unassigned',
            driver: s.driver_name || undefined,
            elapsedSeconds: Math.floor((Date.now() - new Date(s.created_at).getTime()) / 1000),
            primaryFleet: 'Flota Centro Titular',
            overflowFleet: 'Flota Galery Norte'
          })))
        }
      } catch (err) {
        console.warn('Error al cargar órdenes de despacho:', err)
      }
    }
    loadActiveServices()
  }, [])

  // Temporizador para simular incremento de segundos en órdenes pendientes
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders(prev => prev.map(o => {
        if (o.status === 'unassigned') {
          return { ...o, elapsedSeconds: o.elapsedSeconds + 1 }
        }
        return o
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Suscribirse a actualizaciones GPS en vivo de la flota y a Realtime de órdenes
  useEffect(() => {
    const unsubscribeGps = gpsSocketService.subscribeLivePositions((payload) => {
      setFleet(prev => prev.map(driver => {
        if (driver.id === payload.id_moto) {
          return {
            ...driver,
            lat: payload.lat,
            lng: payload.lng,
            heading: payload.heading
          }
        }
        return driver
      }))
    })

    const unsubscribeRealtime = orderRealtimeService.subscribeToOrders(
      'base-dispatch-channel',
      null,
      (orderPayload: ServiceOrderPayload, eventType) => {
        if (eventType === 'INSERT') {
          audioService.playNewOrderChime()
          setOrders(prev => [
            {
              id: orderPayload.tracking_number || `#V-${orderPayload.id.slice(0, 4)}`,
              origin: (orderPayload.customer_name as string) || 'Pedido Web',
              destination: 'Destino Configurado',
              customer: (orderPayload.customer_name as string) || 'Cliente VAMO',
              status: orderPayload.status === 'ASSIGNED' ? 'assigned' : 'unassigned',
              driver: (orderPayload.driver_name as string) || undefined,
              elapsedSeconds: 0,
              primaryFleet: 'Flota Centro Titular',
              overflowFleet: 'Flota Galery Norte'
            },
            ...prev
          ])
        } else if (eventType === 'UPDATE') {
          audioService.playStatusUpdateTone()
        }
      }
    )

    return () => {
      unsubscribeGps()
      unsubscribeRealtime()
    }
  }, [])

  const assignDriver = async (id: string, driverName: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'assigned', driver: driverName } : o))
    audioService.playStatusUpdateTone()

    try {
      const supabase = createClient()
      await supabase
        .from('services')
        .update({
          status: 'ASIGNADO',
          driver_name: driverName,
          updated_at: new Date().toISOString()
        })
        .neq('status', 'ENTREGADO')
    } catch (err) {
      console.warn('⚡ Fallback silencioso de asignación Realtime en Despacho:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] dark:bg-slate-950 text-[#1c1b1b] dark:text-white flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="dispatch" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-slate-900 border-b border-[#e5e2e1] dark:border-slate-800 px-4 md:px-8 py-4 flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-3">
            <img 
              src="/logos/logo-base-corporate.png" 
              alt="VAMO Base" 
              className="w-10 h-10 rounded-xl object-contain shadow-xs bg-slate-900 p-1 shrink-0" 
            />
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-[#0040a1]">Consola de Despacho & Desborde Inteligente</h1>
              <p className="text-xs text-slate-500 font-semibold">Supervisión en vivo, auto-despacho y desborde entre flotas (3 min)</p>
            </div>
          </div>

          <button
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs active:scale-95 transition-transform cursor-pointer"
          >
            {theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* BANNER DE AUTO-DESPACHO AGÉNTICO RECURSIVO Y DESBORDE (ADM-01) */}
          <div className="bg-[#0040a1] text-white p-5 rounded-[28px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-blue-800 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black text-xl shadow-xs">
                ⚡
              </div>
              <div>
                <strong className="text-sm font-extrabold text-white block">Algoritmo de Desborde Inteligente Activo (ADM-01)</strong>
                <p className="text-xs font-semibold text-blue-200">
                  Si la flota titular no toma la orden en 3 min (180s), se desborda automáticamente a la flota colindante con 3% de compensación.
                </p>
              </div>
            </div>
            <span className="bg-[#c3f400] text-[#161e00] text-xs font-black px-4 py-1.5 rounded-full shadow-xs shrink-0">
              3 MIN / 3% REGLA ACTIVA
            </span>
          </div>

          {/* Mapa Macro Operativo de Despacho (MapLibre GL JS Vectorial) */}
          <div className="h-80 rounded-[28px] overflow-hidden shadow-sm relative">
            <VamoMapLibre
              center={[20.5218, -100.8142]}
              zoom={13}
              theme={theme}
              drivers={fleet}
              className="w-full h-full"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-[#1c1b1b] dark:text-white">Pedidos por Asignar / En Ruta</h2>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[28px] border border-dashed border-[#c3c6d6] dark:border-slate-800 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-800 text-[#0056d2] flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Cola de Despacho al Día</h4>
                  <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto">
                    No hay viajes pendientes de asignación en este momento. Las nuevas solicitudes de clientes, llamadas o comercios aparecerán aquí automáticamente en tiempo real.
                  </p>
                </div>
              ) : (
                orders.map(o => {
                  const isOverflowed = o.elapsedSeconds >= OVERFLOW_TIMEOUT_SECONDS && o.status === 'unassigned'
                  
                  return (
                    <div key={o.id} className={`bg-white dark:bg-slate-900 p-5 rounded-[24px] border shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all ${
                      isOverflowed ? 'border-2 border-[#f59f00] bg-[#fffdf0]' : 'border-[#e5e2e1] dark:border-slate-800'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-base font-extrabold text-[#1c1b1b] dark:text-white">{o.id} &bull; {o.customer}</strong>
                          
                          {isOverflowed ? (
                            <span className="bg-[#f59f00] text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                              <Share2 className="w-3 h-3" /> DESBORDADO A: {o.overflowFleet.toUpperCase()} (+3% COMP.)
                            </span>
                          ) : o.status === 'unassigned' ? (
                            <span className="bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" /> SIN REPARTIDOR ({o.elapsedSeconds}s / 180s)
                            </span>
                          ) : (
                            <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2.5 py-0.5 rounded-full">
                              ASIGNADO A {o.driver}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs font-semibold text-[#737785]">
                          Origen: {o.origin} &bull; Destino: {o.destination} &bull; Flota Titular: {o.primaryFleet}
                        </p>
                      </div>

                      {o.status === 'unassigned' && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => assignDriver(o.id, isOverflowed ? 'Juan P. (Flota Norte)' : 'Roberto M.')}
                            className={`px-5 py-2.5 rounded-full text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 ${
                              isOverflowed
                                ? 'bg-[#f59f00] hover:bg-[#d97706] text-slate-950'
                                : 'bg-[#0056d2] hover:bg-[#0040a1] text-white'
                            }`}
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>{isOverflowed ? 'Asignar a Flota Colindante' : 'Asignar a Roberto M.'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
