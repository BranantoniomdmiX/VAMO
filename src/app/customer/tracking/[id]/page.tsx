'use client'

import React, { useState, useEffect } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Bike, Phone, Clock } from 'lucide-react'
import VamoMapLibre, { DriverMarkerData } from '@/components/map/VamoMapLibre'
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

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCustomerLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          })
        },
        (err) => {
          console.log('GPS del cliente usando ubicación de entrega registrada:', err)
        },
        { enableHighAccuracy: true, timeout: 6000 }
      )
    }
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
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm active:scale-95 transition-transform"
            >
              {theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
            </button>

            <a href="tel:5551234567" className="w-11 h-11 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-bold shadow-md active:scale-95 transition-transform">
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

        {/* Mapa Vectorial MapLibre GL JS Limpio (Sin líneas estorbosas + Ubicación de la Casa y la Moto) */}
        {isOrderPickedUp ? (
          <div className="h-72 rounded-[32px] overflow-hidden relative shadow-md">
            <VamoMapLibre
              center={[driverPos.lat, driverPos.lng]}
              zoom={15.5}
              theme={theme}
              mode3D={false}
              drivers={drivers}
              waypoints={customerWaypoints}
              enableGeolocate={true}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 p-8 rounded-[32px] text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#0056d2]/10 text-[#0056d2] flex items-center justify-center font-black mx-auto text-xl">
              🍳
            </div>
            <h3 className="text-sm font-extrabold text-[#1c1b1b] dark:text-white">Pedido en Preparación</h3>
            <p className="text-xs text-[#737785] max-w-xs mx-auto">
              El restaurante está empacando tus productos. En cuanto el repartidor recoja el paquete, verás su moto en el mapa en vivo.
            </p>
          </div>
        )}



        {/* Detalles del Conductor y Estado */}
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
            <span className="text-[#0056d2]">Monto en efectivo: $65.00</span>
          </div>
        </div>

      </div>
    </CustomerLayout>
  )
}
