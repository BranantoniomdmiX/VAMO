'use client'

import React, { useState, useEffect } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { Navigation, Phone, CheckCircle2, ArrowLeft, ArrowRight, ArrowUpRight, ChevronUp, ChevronDown, Compass, LocateFixed } from 'lucide-react'
import { useRouter } from 'next/navigation'
import VamoMap from '@/components/map/VamoMap'
import { DriverMarkerData, MapWaypoint } from '@/components/map/VamoUniversalMap'
import { gpsSocketService, RouteNavigationDetails, LatLng } from '@/lib/services/gpsSocketService'

import { orderRealtimeService, ServiceOrderPayload } from '@/lib/services/orderRealtimeService'
import { audioService } from '@/lib/services/audioService'

export default function DriverNavigationPage() {
  const [step, setStep] = useState<'to_origin' | 'arrived_origin' | 'to_destination'>('to_origin')
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number; heading: number; isRealGps?: boolean }>({
    lat: 20.5218,
    lng: -100.8142,
    heading: 45,
    isRealGps: false
  })

  // Modo de Vista de Cámara: 'DRIVING' (Cámara de Conducción) o 'OVERVIEW' (Ruta Completa)
  const [cameraMode, setCameraMode] = useState<'DRIVING' | 'OVERVIEW'>('DRIVING')

  // Control de colapso de componentes: Guía descolapsada y Tarjeta de Orden COLAPSADA POR DEFECTO para liberar el mapa
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(false)
  const [isOrderCardCollapsed, setIsOrderCardCollapsed] = useState(true)

  // Puntos clave de la orden en formato UI LatLng [lat, lng]
  const originPos: LatLng = [20.5260, -100.8090]
  const destinationPos: LatLng = [20.5295, -100.8030]

  // Estado de navegación OSRM
  const [navDetails, setNavDetails] = useState<RouteNavigationDetails>({
    coordinates: [],
    distanceKm: '...',
    durationMin: 0,
    steps: []
  })

  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const router = useRouter()

  // 1. Transmisión y recepción GPS (Soporta GPS Real del Celular) y suscripción Realtime a órdenes
  useEffect(() => {
    gpsSocketService.startGpsTransmitter('MOTO-01', (payload) => {
      setDriverPos({
        lat: payload.lat,
        lng: payload.lng,
        heading: payload.heading,
        isRealGps: payload.isRealGps
      })
    })

    const unsubscribeRealtime = orderRealtimeService.subscribeToOrders(
      'driver-navigation-channel',
      null,
      (orderPayload: ServiceOrderPayload, eventType) => {
        if (eventType === 'INSERT') {
          audioService.playNewOrderChime()
        } else if (eventType === 'UPDATE') {
          audioService.playStatusUpdateTone()
        }
      }
    )

    return () => {
      gpsSocketService.stopGpsTransmitter()
      unsubscribeRealtime()
    }
  }, [])

  // Solicitar o recalcular ubicación GPS Real manualmente mediante DeviceCapabilityService
  const requestRealDeviceGps = async () => {
    try {
      const { deviceCapabilityService } = await import('@/lib/services/deviceCapabilityService')
      const normalized = await deviceCapabilityService.getCurrentPosition({ enableHighAccuracy: true })
      setDriverPos({
        lat: normalized.coords.latitude,
        lng: normalized.coords.longitude,
        heading: normalized.coords.heading || 0,
        isRealGps: true
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo obtener la ubicación.'
      alert(msg)
    }
  }

  // 2. Recalcular ruta OSRM al cambiar de etapa (step) o destino
  useEffect(() => {
    const startLatLng: LatLng = [driverPos.lat, driverPos.lng]
    const targetLatLng: LatLng = step === 'to_destination' ? destinationPos : originPos
    
    console.log(`[VAMO NAVIGATION] Consultando OSRM de [${startLatLng.join(', ')}] a [${targetLatLng.join(', ')}]`)
    
    gpsSocketService.fetchRouteDetails(startLatLng, targetLatLng)
      .then(details => {
        if (details && details.coordinates && details.coordinates.length > 0) {
          setNavDetails(details)
          setActiveStepIndex(0)
        }
      })
      .catch(err => console.warn('[VAMO NAVIGATION ERROR] Error al obtener ruta OSRM:', err))
  }, [step])

  const currentInstruction = navDetails.steps[activeStepIndex] || navDetails.steps[0] || {
    instruction: 'Iniciando navegación...',
    distanceMeters: 0,
    type: 'straight'
  }

  const driverData: DriverMarkerData[] = [
    {
      id: 'MOTO-01',
      name: driverPos.isRealGps ? 'Tú (GPS Celular Real)' : 'Tú en Ruta (MOTO-01)',
      lat: driverPos.lat,
      lng: driverPos.lng,
      heading: driverPos.heading,
      status: 'EN_SERVICIO'
    }
  ]

  const waypointsData: MapWaypoint[] = [
    {
      id: 'ORIGIN-STORE',
      title: 'Taquería El Pastor (Local)',
      lat: originPos[0],
      lng: originPos[1],
      type: 'ORIGIN'
    },
    {
      id: 'DESTINATION-HOME',
      title: 'Calle Juárez #452 (Cliente)',
      lat: destinationPos[0],
      lng: destinationPos[1],
      type: 'DESTINATION'
    }
  ]

  return (
    <MobileDriverLayout>
      <div className="flex flex-col h-full relative bg-[#f0eded]">
        
        {/* Mapa GPS ocupando el área principal despejada */}
        <div className="flex-1 relative overflow-hidden min-h-[500px]">
          
          {/* BARRA DE GUÍA COMPACTA SIN DEGRADADOS CON TRASLUCIDEZ DE ALTO CONTRASTE */}
          <div className="absolute top-2.5 left-2.5 max-w-[calc(100%-65px)] z-30 pointer-events-auto">
            {isGuideCollapsed ? (
              // Modo Badge Ultra-Compacto
              <div
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.90)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
                className="flex items-center gap-2 text-white px-3 py-1.5 rounded-xl shadow-2xl border border-white/20"
              >
                <div className="w-5 h-5 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black text-[10px] shrink-0">
                  {currentInstruction.type.includes('left') ? '⬅️' : currentInstruction.type.includes('right') ? '➡️' : '⬆️'}
                </div>
                <span className="text-[11px] font-black truncate">{currentInstruction.instruction}</span>
                <button
                  onClick={() => setIsGuideCollapsed(false)}
                  className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full ml-1"
                >
                  ⬇️
                </button>
              </div>
            ) : (
              // Modo Guía Delgado y Elegante sin Degradados
              <div
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.90)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
                className="text-white p-2.5 px-3 rounded-2xl shadow-2xl border border-white/25 flex items-center gap-2.5 animate-slide-down"
              >
                <div className="w-8 h-8 rounded-xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black shrink-0 shadow-sm">
                  {currentInstruction.type.includes('left') ? (
                    <ArrowLeft className="w-4 h-4" />
                  ) : currentInstruction.type.includes('right') ? (
                    <ArrowRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase text-[#c3f400]">
                      {currentInstruction.distanceMeters} M
                    </span>
                    <span className="text-[9px] font-bold text-slate-300">
                      {navDetails.distanceKm} km &bull; {navDetails.durationMin} min
                    </span>
                  </div>
                  <p className="text-xs font-black leading-tight truncate mt-0.5">
                    {currentInstruction.instruction}
                  </p>
                </div>

                <button
                  onClick={() => setIsGuideCollapsed(true)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <VamoMap
            center={[driverPos.lat, driverPos.lng]}
            zoom={cameraMode === 'DRIVING' ? 16.8 : 15}
            mode3D={cameraMode === 'DRIVING'}
            pitch={cameraMode === 'DRIVING' ? 55 : 0}
            bearing={cameraMode === 'DRIVING' ? driverPos.heading : 0}
            drivers={driverData}
            waypoints={waypointsData}
            routeCoordinates={navDetails.coordinates}
            className="w-full h-full rounded-none"
          />

          {/* Botones Flotantes de Control de Cámara, GPS Real y Botón de Auxilio SOS */}
          <div className="absolute top-16 left-2.5 z-20 flex flex-col gap-2">
            <button
              onClick={() => setCameraMode(cameraMode === 'DRIVING' ? 'OVERVIEW' : 'DRIVING')}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-1.5 rounded-xl font-black text-[10px] shadow-xl flex items-center gap-1.5 border-2 border-[#0056D2] active:scale-95 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-[#0056D2]" />
              <span>{cameraMode === 'DRIVING' ? 'CONDUCCIÓN 🏎️' : 'VISTA GLOBAL 🗺️'}</span>
            </button>

            {!driverPos.isRealGps && (
              <button
                onClick={requestRealDeviceGps}
                className="bg-[#0056D2] hover:bg-[#0040a1] text-white px-3 py-1.5 rounded-xl font-black text-[10px] shadow-xl flex items-center gap-1.5 active:scale-95 transition-all border border-white/30"
              >
                <LocateFixed className="w-3.5 h-3.5 text-[#c3f400] animate-spin" />
                <span>ACTIVAR GPS CELULAR 📍</span>
              </button>
            )}

            {/* BOTÓN SOS DE EMERGENCIA (SOP-SEG-003) */}
            <button
              onClick={() => {
                if (confirm('🚨 ¿DESEAS ACTIVAR LA ALERTA SOS DE EMERGENCIA A LA BASE? Se enviará tu ubicación GPS y orden en tiempo real.')) {
                  alert('🚨 ALERTA SOS ENVIADA A LA BASE OPERATIVA. Un operador te contactará de inmediato.')
                }
              }}
              className="bg-[#ba1a1a] hover:bg-[#93000a] text-white px-3 py-1.5 rounded-xl font-black text-[10px] shadow-xl flex items-center gap-1.5 active:scale-95 transition-all border border-white/40 animate-pulse cursor-pointer"
            >
              <span>🚨 BOTÓN SOS (AUXILIO)</span>
            </button>
          </div>
        </div>

        {/* TARJETA INFERIOR COLAPSADA POR DEFECTO CON BOTÓN GRUESO E INTUITIVO */}
        <div className="bg-white rounded-t-[32px] shadow-[0_-12px_30px_rgba(0,0,0,0.15)] relative z-20 transition-all duration-300">
          
          {/* Header/Manija Gruesa e Intuitiva para Descolapsar */}
          <div
            onClick={() => setIsOrderCardCollapsed(!isOrderCardCollapsed)}
            className="p-3.5 px-5 flex justify-between items-center cursor-pointer select-none border-b border-[#f0eded]"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 bg-[#0056d2] rounded-full" />
              <div>
                <span className="text-[10px] font-black text-[#0056d2] uppercase tracking-wider block">
                  {step === 'to_origin' && 'PASO 1: EN RUTA A RECOGER EN LOCAL'}
                  {step === 'arrived_origin' && 'PASO 2: EN LOCAL RECOGIENDO PEDIDO'}
                  {step === 'to_destination' && 'PASO 3: EN RUTA A ENTREGAR CON CLIENTE'}
                </span>
                <h2 className="text-sm font-black text-[#1c1b1b]">
                  {step === 'to_destination' ? 'Calle Juárez #452 (Cliente)' : 'Taquería El Pastor (Local)'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="tel:5551234567"
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-bold shadow-sm active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>

              {/* Botón Grueso de Descolapsar / Colapsar */}
              <button className="bg-[#0056d2] text-white px-3.5 py-1.5 rounded-full font-black text-xs flex items-center gap-1.5 shadow-md hover:bg-[#0040a1] active:scale-95 transition-all">
                <span>{isOrderCardCollapsed ? 'EXPANDIR' : 'OCULTAR'}</span>
                {isOrderCardCollapsed ? <ChevronUp className="w-4 h-4 text-[#c3f400]" /> : <ChevronDown className="w-4 h-4 text-[#c3f400]" />}
              </button>
            </div>
          </div>

          {/* Cuerpo de la Tarjeta (Visible solo si se expande) */}
          {!isOrderCardCollapsed && (
            <div className="p-4 pt-3 space-y-3 animate-fade-in">
              <div className="bg-[#f6f3f2] p-3 rounded-2xl space-y-0.5">
                <span className="text-[10px] font-bold text-[#737785] block">ORDEN #V-9042 &bull; 2 ARTÍCULOS</span>
                <p className="text-xs font-extrabold text-[#1c1b1b]">2x Combo Tacos al Pastor + 1x Agua de Horchata</p>
              </div>

              {step === 'to_origin' && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('arrived_origin')
                    setCameraMode('DRIVING')
                  }}
                  className="w-full min-h-[48px] bg-[#0056d2] hover:bg-[#0040a1] text-white py-3.5 px-4 rounded-full font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#c3f400]" />
                  <span>LLEGUÉ AL LOCAL ORIGEN</span>
                </button>
              )}

              {step === 'arrived_origin' && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('to_destination')
                    setCameraMode('DRIVING')
                  }}
                  className="w-full min-h-[48px] bg-[#fddf33] hover:bg-[#e2c60f] text-[#726200] py-3.5 px-4 rounded-full font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>INICIAR NAVEGACIÓN A CLIENTE 🏎️</span>
                </button>
              )}

              {step === 'to_destination' && (
                <button
                  type="button"
                  onClick={() => router.push('/driver/pod')}
                  className="w-full min-h-[48px] bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3.5 px-4 rounded-full font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>LLEGUÉ CON CLIENTE &bull; ENTREGAR</span>
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </MobileDriverLayout>
  )
}
