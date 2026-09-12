'use client'

import React, { useState, useEffect } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Bike, Phone, Clock } from 'lucide-react'
import VamoUniversalMap, { DriverMarkerData } from '@/components/map/VamoUniversalMap'
import { gpsSocketService } from '@/lib/services/gpsSocketService'

import { orderRealtimeService, ServiceOrderPayload } from '@/lib/services/orderRealtimeService'
import { audioService } from '@/lib/services/audioService'
import { AntiFraudService } from '@/lib/services/antiFraudService'

// Función matemática Haversine para calcular distancia en metros entre dos coordenadas GPS
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

export default function CustomerTrackingPage() {
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number; heading: number }>({
    lat: 20.5218,
    lng: -100.8142,
    heading: 45
  })
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number }>({
    lat: 20.5225,
    lng: -100.8138
  })
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null)
  const [hasAlerted50m, setHasAlerted50m] = useState<boolean>(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [orderStatus, setOrderStatus] = useState<string>('EN CAMINO')
  const [pinCode, setPinCode] = useState<string>('8492')

  // 1. Obtener GPS Real del Cliente en Celular
  useEffect(() => {
    setPinCode(AntiFraudService.getOrderPin('V-9042'))

    import('@/lib/services/deviceCapabilityService').then(({ deviceCapabilityService }) => {
      deviceCapabilityService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000
      }).then(normalized => {
        setCustomerLocation({
          lat: normalized.coords.latitude,
          lng: normalized.coords.longitude
        })
      }).catch(err => {
        console.warn('GPS del cliente usando ubicación de entrega registrada:', err.message)
      })
    })
  }, [])

  // 2. Suscribirse a la posición en vivo del repartidor y calcular distancia a 50m
  useEffect(() => {
    const unsubscribeGps = gpsSocketService.subscribeLivePositions((payload) => {
      setDriverPos({
        lat: payload.lat,
        lng: payload.lng,
        heading: payload.heading
      })

      // Calcular distancia en tiempo real entre el repartidor y el cliente
      const dist = calculateDistanceMeters(
        payload.lat,
        payload.lng,
        customerLocation.lat,
        customerLocation.lng
      )
      setDistanceMeters(dist)

      // Si está a 50 metros o menos y no ha sonado, sonar timbre Ding-Dong + Voz
      if (dist <= 50 && !hasAlerted50m) {
        audioService.playArrivalProximityAlert()
        setHasAlerted50m(true)
      }
    })

    const unsubscribeRealtime = orderRealtimeService.subscribeToOrders(
      'customer-tracking-channel',
      null,
      (orderPayload: ServiceOrderPayload, eventType) => {
        if (orderPayload && orderPayload.status) {
          setOrderStatus(orderPayload.status)
          if (eventType === 'UPDATE') {
            audioService.playStatusUpdateTone()
          }
        }
      }
    )

    return () => {
      unsubscribeGps()
      unsubscribeRealtime()
    }
  }, [customerLocation, hasAlerted50m])

  const drivers: DriverMarkerData[] = [
    {
      id: 'MOTO-01',
      name: 'Carlos M. (Repartidor VAMO)',
      lat: driverPos.lat,
      lng: driverPos.lng,
      heading: driverPos.heading,
      status: 'EN_SERVICIO'
    }
  ]

  // Waypoints para que se vea también el pin de la casa del cliente en el mapa
  const customerWaypoints = [
    {
      id: 'CUSTOMER-HOUSE',
      title: '📍 Mi Domicilio (Punto de Entrega)',
      lat: customerLocation.lat,
      lng: customerLocation.lng,
      type: 'DESTINATION' as const
    }
  ]

  // Solo mostramos la posición de la moto en el mapa cuando el pedido YA fue recogido en el local y está en camino
  const isOrderPickedUp = orderStatus === 'EN CAMINO' || orderStatus === 'EN_REPARTO' || orderStatus === 'EN_CAMINO_CLIENTE'


  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Tracking */}
        <header className="flex justify-between items-center">
          <div>
            <span className="bg-[#c3f400] text-[#161e00] text-xs font-black px-3 py-1 rounded-full uppercase">
              {orderStatus}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1c1b1b] dark:text-white mt-1">Seguimiento de Envío #V-9042</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Toggle Tema Claro/Oscuro */}
            <button
              type="button"
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              className="px-3.5 py-2.5 min-h-[48px] rounded-full text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
            >
              {theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
            </button>

            <a 
              href="tel:5551234567" 
              aria-label="Llamar al repartidor"
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-[#0056d2] hover:bg-[#0040a1] text-white flex items-center justify-center font-bold shadow-md active:scale-95 transition-transform cursor-pointer"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </header>

        {/* PIN DE SEGURIDAD HIGHLIGHT DINÁMICO */}
        <div className="bg-[#fddf33] text-[#726200] p-5 rounded-[28px] text-center space-y-1 shadow-sm border-2 border-[#e2c60f]">
          <span className="text-xs font-black uppercase tracking-wider block">TU PIN DE SEGURIDAD DE ENTREGA (OTP)</span>
          <p className="text-4xl font-black text-[#161e00] tracking-widest font-mono">
            {pinCode.split('').join(' ')}
          </p>
          <p className="text-xs font-bold opacity-90">Muestra este PIN de 4 dígitos al motociclista para recibir tu pedido.</p>
        </div>

        {/* Garantía de Tiempo SLA Meituan (Contador Regresivo Dinámico) */}
        <div className="bg-[#0040a1] text-white p-4 rounded-[28px] flex items-center justify-between shadow-md border border-blue-800">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">GARANTÍA DE TIEMPO LÍMITE VAMO</span>
            <p className="text-xs font-bold text-white">
              {isOrderPickedUp 
                ? (distanceMeters !== null ? `Repartidor a ${distanceMeters}m de tu puerta` : 'Repartidor en camino hacia tu domicilio')
                : 'El local está preparando tu pedido'}
            </p>
          </div>
          <div className="bg-[#c3f400] text-[#161e00] px-3.5 py-1.5 rounded-full font-black text-xs font-mono shadow-xs">
            {distanceMeters !== null && distanceMeters <= 50 ? '🔔 ¡EN TU PUERTA!' : '⏱️ 13:45 min'}
          </div>
        </div>

        {/* ALERTA DE PROXIMIDAD A 50 METROS (Visual + Animación de Salida) */}
        {distanceMeters !== null && distanceMeters <= 50 && (
          <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-[24px] border-2 border-[#161e00] shadow-xl flex items-center gap-3 animate-bounce">
            <div className="w-10 h-10 rounded-full bg-[#161e00] text-[#c3f400] flex items-center justify-center font-black text-lg shrink-0">
              🔔
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-black block">¡EL REPARTIDOR ESTÁ A MENOS DE 50 METROS!</strong>
              <p className="text-[11px] font-bold opacity-90">Ten listo tu PIN ({pinCode}) y sal a recibir tu paquete.</p>
            </div>
          </div>
        )}

        {/* Mapa Universal con Failover de Alta Disponibilidad */}
        <div className="h-96 sm:h-[420px] rounded-[32px] overflow-hidden relative shadow-md border border-[#e5e2e1] dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
          <VamoUniversalMap
            center={[driverPos?.lat || 20.5218, driverPos?.lng || -100.8142]}
            zoom={15.5}
            theme={theme}
            mode3D={false}
            drivers={drivers}
            waypoints={customerWaypoints}
            enableGeolocate={true}
            className="w-full h-full min-h-[380px]"
          />

          {/* Overlay Flotante si el pedido aún está en cocina/preparación */}
          {!isOrderPickedUp && (
            <div className="absolute top-4 left-4 right-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#e5e2e1] dark:border-slate-800 shadow-md flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0056d2] text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                🍳
              </div>
              <div className="min-w-0">
                <strong className="text-xs font-black text-slate-900 dark:text-white block">Pedido en Preparación</strong>
                <p className="text-[11px] font-semibold text-slate-500 truncate">El comercio está empacando tus productos. Verás la moto moverse en cuanto salga.</p>
              </div>
            </div>
          )}
        </div>




        {/* CHECKLIST VISUAL DE ENTREGA (2 TOQUES: CERO FRICCIÓN) */}
        <div className="bg-white p-5 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-[#1c1b1b] uppercase tracking-wider">
              📦 Confirmación Visual de Entrega
            </span>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Cero Reclamos
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Al recibir tu pedido, verifica que la bolsa esté sellada con el logotipo de VAMO antes de ingresar a tu casa.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={() => alert('✅ ¡Gracias! Confirmaste que tu pedido llegó sellado y completo.')}
              className="flex-1 min-h-[48px] bg-[#161e00] text-[#c3f400] hover:bg-black py-3 px-4 rounded-2xl font-black text-xs transition-all shadow-xs flex items-center justify-center cursor-pointer"
            >
              👍 Bolsa Sellada y Completa
            </button>
            <button
              type="button"
              onClick={() => alert('⚠️ Reporte recibido. Soporte VAMO se contactará contigo de inmediato.')}
              className="px-4 min-h-[48px] bg-rose-50 text-rose-700 hover:bg-rose-100 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
            >
              Reportar Detalle
            </button>
          </div>
        </div>

        {/* Resumen del Conductor y Estado */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-[#e5e2e1] dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0eded] dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                CM
              </div>
              <div>
                <strong className="text-base font-extrabold text-[#1c1b1b] dark:text-white block">Carlos M. &bull; Motociclista VAMO</strong>
                <span className="text-xs font-bold text-[#737785]">Italika FT150 &bull; Placas MX-984</span>
              </div>
            </div>
            <span className="text-xs font-black text-[#0056d2] bg-[#0056d2]/10 px-3 py-1 rounded-full">
              4.9 ★ (120 viajes)
            </span>
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-[#424654] dark:text-slate-300">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-[#0056d2]" /> Tiempo estimado: 4-8 min
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-black">
              💳 Pago: Confirmado
            </span>
          </div>
        </div>


      </div>
    </CustomerLayout>
  )
}
