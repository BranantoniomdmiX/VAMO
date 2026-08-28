'use client'

import React, { useState, useEffect } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { Bike, Power, Wallet, Trophy, ArrowRight, ShieldCheck, MapPin, Flame, Award, Layers } from 'lucide-react'
import Link from 'next/link'
import VamoUniversalMap from '@/components/map/VamoUniversalMap'
import { gpsSocketService } from '@/lib/services/gpsSocketService'
import { PushNotificationBanner } from '@/components/ui/PushNotificationBanner'

export default function DriverHomePage() {

  const [isAvailable, setIsAvailable] = useState(true)
  const [viewMode, setViewMode] = useState<'dashboard' | 'heatmap'>('dashboard')
  const [selectedZoneId, setSelectedZoneId] = useState<string>('HOT-01')
  const [isNavigatingToZone, setIsNavigatingToZone] = useState<boolean>(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5260, -100.8090])
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light') // 'light' por defecto para alta visibilidad bajo el sol

  // Desconexión inteligente de GPS y Estado en la Base Operativa
  useEffect(() => {
    if (isAvailable) {
      // Iniciar transmisión de GPS en vivo a la Base Operativa y VPS
      gpsSocketService.startGpsTransmitter('MOTO-01', (pos) => {
        setMapCenter([pos.lat, pos.lng])
      })
    } else {
      // Apagar GPS de inmediato para que la Base Operativa no lo vea en ruta
      gpsSocketService.setDriverOffline('MOTO-01')
    }

    // Al cerrar la pestaña, cambiar de rol o salir de la app, desconectar automáticamente
    return () => {
      gpsSocketService.setDriverOffline('MOTO-01')
    }
  }, [isAvailable])


  const hotZones = [
    {
      id: 'HOT-01',
      name: 'Plaza Principal (Centro)',
      ordersPerHour: 28,
      bonusText: '+ $18.00 MXN',
      surgePercent: '+25%',
      surgeColor: 'bg-[#ff5722]',
      badgeColor: 'bg-[#ff5722] text-white',
      lat: 20.5260,
      lng: -100.8090,
      riderDensity: 'Baja (Alta Oportunidad)',
      desc: 'Alta concentración de restaurantes con comandas listas.'
    },
    {
      id: 'HOT-02',
      name: 'Zona Galery (Norte)',
      ordersPerHour: 19,
      bonusText: '+ $12.00 MXN',
      surgePercent: '+15%',
      surgeColor: 'bg-[#ff9800]',
      badgeColor: 'bg-[#ff9800] text-white',
      lat: 20.5180,
      lng: -100.8200,
      riderDensity: 'Media',
      desc: 'Demanda constante en farmacias y supermercados.'
    },
    {
      id: 'HOT-03',
      name: 'Zona Tecnológico (Sur)',
      ordersPerHour: 14,
      bonusText: '+ $8.00 MXN',
      surgePercent: '+10%',
      surgeColor: 'bg-[#a7d600]',
      badgeColor: 'bg-[#c3f400] text-[#161e00]',
      lat: 20.5310,
      lng: -100.8010,
      riderDensity: 'Óptima',
      desc: 'Envíos de comida rápida y papelería universitaria.'
    }
  ]

  const currentZone = hotZones.find(z => z.id === selectedZoneId) || hotZones[0]

  const [showShiftChecklist, setShowShiftChecklist] = useState(false)
  const [checklist, setChecklist] = useState({
    motoDoc: false,
    fuelCheck: false,
    phoneCharge: false,
    thermalBag: false,
    safetyHelmet: false
  })

  const isChecklistComplete = Object.values(checklist).every(Boolean)

  const handleToggleAvailable = () => {
    if (!isAvailable) {
      // Si va a ponerse disponible y no ha completado el checklist, mostrar modal SOP-RID-002
      if (!isChecklistComplete) {
        setShowShiftChecklist(true)
        return
      }
      setIsAvailable(true)
    } else {
      setIsAvailable(false)
    }
  }

  const handleConfirmShiftStart = () => {
    if (isChecklistComplete) {
      setIsAvailable(true)
      setShowShiftChecklist(false)
    }
  }

  return (
    <MobileDriverLayout>
      <div className="p-5 space-y-6">
        
        {/* Header Rider con Logo Oficial de la Moto */}
        <header className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-3">
            <img 
              src="/logos/logo-driver.png" 
              alt="VAMO Conductor" 
              className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-[#0056d2]/20" 
            />
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 leading-tight flex items-center gap-1.5">
                ¡Hola, Carlos! <span className="text-xs bg-[#c3f400] text-[#161e00] px-2 py-0.5 rounded-full font-black">MOTO</span>
              </h1>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0056d2]" /> Zona Centro &bull; Socio VAMO
              </p>
            </div>
          </div>

          <Link href="/" className="text-xs font-black text-[#0056d2] bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full transition-colors">
            Salir
          </Link>
        </header>

        {/* Banner de Notificaciones Push para Conductores */}
        <PushNotificationBanner role="driver" />

        {/* Switch Gigante DISPONIBLE / NO DISPONIBLE (Verde VAMO Oficial + Cero Desbordes) */}

        <div 
          onClick={handleToggleAvailable}
          className={`
            p-5 rounded-[28px] cursor-pointer transition-all duration-300 shadow-md flex items-center justify-between border-2 active:scale-98
            ${isAvailable 
              ? 'bg-[#c3f400] border-[#abd600] text-[#161e00]' 
              : 'bg-[#f0eded] border-[#e5e2e1] text-[#737785]'}
          `}
        >
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold transition-colors ${
              isAvailable ? 'bg-[#161e00] text-[#c3f400] shadow-sm' : 'bg-[#737785] text-white'
            }`}>
              <Power className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base font-black tracking-wide block">
                {isAvailable ? 'ESTÁS DISPONIBLE' : 'NO DISPONIBLE'}
              </span>
              <span className="text-xs font-bold opacity-90 block">
                {isAvailable ? 'Recibiendo pedidos en tiempo real' : 'Toca para iniciar turno con checklist'}
              </span>
            </div>
          </div>

          {/* Cápsula Switch con Posicionamiento Absoluto Blindado (Cero Desbordes) */}
          <div className={`relative w-14 h-8 rounded-full transition-colors duration-200 shrink-0 ${isAvailable ? 'bg-[#161e00]' : 'bg-[#c3c6d6]'}`}>
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200 ${isAvailable ? 'right-1' : 'left-1'}`} />
          </div>
        </div>

        {/* Modal de Inicio de Turno SOP-RID-002 */}
        {showShiftChecklist && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[32px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#e5e2e1]">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0040a1] text-[#c3f400] flex items-center justify-center font-black">
                  📋
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Checklist Inicio de Turno</h3>
                  <span className="text-[10px] font-bold text-slate-500">SOP-RID-002 &bull; Protocolo Oficial VAMO</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs font-bold text-slate-700">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/40 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checklist.motoDoc}
                    onChange={(e) => setChecklist({ ...checklist, motoDoc: e.target.checked })}
                    className="w-4 h-4 text-[#0056d2] rounded focus:ring-0" 
                  />
                  <span>Licencia y póliza de seguro vigentes</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/40 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checklist.fuelCheck}
                    onChange={(e) => setChecklist({ ...checklist, fuelCheck: e.target.checked })}
                    className="w-4 h-4 text-[#0056d2] rounded focus:ring-0" 
                  />
                  <span>Combustible y presión de llantas revisadas</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/40 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checklist.phoneCharge}
                    onChange={(e) => setChecklist({ ...checklist, phoneCharge: e.target.checked })}
                    className="w-4 h-4 text-[#0056d2] rounded focus:ring-0" 
                  />
                  <span>Celular con &gt;50% de batería y datos móviles</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/40 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checklist.thermalBag}
                    onChange={(e) => setChecklist({ ...checklist, thermalBag: e.target.checked })}
                    className="w-4 h-4 text-[#0056d2] rounded focus:ring-0" 
                  />
                  <span>Mochila térmica limpia y desinfectada</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/40 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checklist.safetyHelmet}
                    onChange={(e) => setChecklist({ ...checklist, safetyHelmet: e.target.checked })}
                    className="w-4 h-4 text-[#0056d2] rounded focus:ring-0" 
                  />
                  <span>Casco de seguridad colocado y abrochado</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={!isChecklistComplete}
                  onClick={handleConfirmShiftStart}
                  className="flex-1 bg-[#c3f400] hover:bg-[#abd600] disabled:bg-slate-200 disabled:text-slate-400 text-[#161e00] py-3 rounded-full text-xs font-black active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  CONFIRMAR & CONECTAR 🚀
                </button>
                <button
                  type="button"
                  onClick={() => setShowShiftChecklist(false)}
                  className="px-4 bg-[#f0eded] text-slate-700 py-3 rounded-full text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner Informativo COD & Billetera */}
        <div className="bg-white p-4 rounded-[24px] border border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0056d2] flex items-center justify-center font-black">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Efectivo en Mano (COD)</span>
              <strong className="text-xs sm:text-sm font-black text-slate-900">$0.00 / $1,500 MXN</strong>
            </div>
          </div>
          <Link 
            href="/driver/wallet"
            className="text-xs font-black text-[#0056d2] bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full transition-colors"
          >
            Ver Billetera
          </Link>
        </div>

        {/* Gamificación Socio VAMO: Niveles Plata, Oro, Platino y Diamante (REP-05) */}
        <div className="bg-[#0040a1] text-white p-5 rounded-[28px] shadow-md space-y-3.5 border border-blue-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#c3f400] text-[#161e00] flex items-center justify-center font-black">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">SOCIO VAMO &bull; NIVEL PLATA</span>
                <span className="text-[10px] text-blue-200 font-bold">0 Viajes completados &bull; 5.0 ★</span>
              </div>
            </div>
            <span className="text-[10px] font-black bg-[#c3f400] text-[#161e00] px-3 py-1 rounded-full uppercase">
              ACTIVO
            </span>
          </div>

          {/* Barra de progreso al siguiente nivel (Oro) */}
          <div className="space-y-1.5 bg-black/20 p-3 rounded-2xl border border-white/10">
            <div className="flex justify-between text-[11px] font-bold text-blue-100">
              <span>Nivel: <strong>PLATA</strong></span>
              <span className="text-[#c3f400]">Siguiente: <strong>ORO (Faltan 30 viajes)</strong></span>
            </div>
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#c3f400] h-full transition-all duration-500 rounded-full" style={{ width: '5%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-blue-200/90 font-medium pt-0.5">
              <span>0 viajes</span>
              <span>30 viajes (+5% Bono en Horas Pico)</span>
            </div>
          </div>

          <div className="bg-white/10 p-2.5 rounded-xl flex items-center justify-between text-xs text-white font-bold border border-white/10">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#c3f400]" />
              <span>Prioridad de Despacho en Servidor:</span>
            </div>
            <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2.5 py-0.5 rounded-full">
              ALTA (ORO)
            </span>
          </div>
        </div>

        {/* Selector de Vista: [ Dashboard 📊 ] vs [ Zonas Calientes 🔥 ] */}
        <div className="flex bg-[#f0eded] p-1 rounded-full text-xs font-bold border border-slate-200">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`flex-1 py-2.5 rounded-full transition-all ${viewMode === 'dashboard' ? 'bg-[#0056d2] text-white shadow-xs font-black' : 'text-[#737785]'}`}
          >
            📊 Resumen & Ofertas
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${viewMode === 'heatmap' ? 'bg-[#ff5722] text-white shadow-xs font-black' : 'text-[#737785]'}`}
          >
            🔥 Zonas Calientes (Demanda)
          </button>
        </div>

        {viewMode === 'heatmap' ? (
          /* MÓDULO MAPA DE ZONAS CALIENTES (HEATMAP DE ALTA DEMANDA PARA SOL Y NOCHE) */
          <div className="space-y-4 animate-fade-in">
            {/* Banner Dinámico de Zona Seleccionada */}
            <div className="bg-[#0040a1] text-white border border-blue-800 p-4 rounded-[24px] flex items-center justify-between shadow-md">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#ff5722] animate-bounce" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">MAPA DE CALOR &bull; TARIFA DINÁMICA</span>
                </div>
                <p className="text-xs font-medium text-blue-100 mt-0.5">
                  Dirige tu ruta a zonas con alta demanda para ganar más por viaje.
                </p>
              </div>
              <span className="bg-[#ff5722] text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse">
                {currentZone.surgePercent} TARIFA
              </span>
            </div>

            {/* Selector Táctil de Zonas */}
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {hotZones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => {
                    setSelectedZoneId(zone.id)
                    setMapCenter([zone.lat, zone.lng])
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 border ${
                    selectedZoneId === zone.id
                      ? 'bg-[#0056d2] text-white border-[#0056d2] shadow-sm'
                      : 'bg-white text-[#1c1b1b] border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${zone.surgeColor}`} />
                  <span>{zone.name}</span>
                  <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded">
                    {zone.bonusText}
                  </span>
                </button>
              ))}
            </div>

            {/* Contenedor Mapa Libre Vectorial con Selector Día (Sol) / Noche */}
            <div className="h-96 rounded-[28px] overflow-hidden shadow-md relative border border-slate-300">
              
              {/* Botón Flotante Superior: Modo Sol (Día) vs Noche para Pantallas Bajo el Sol */}
              <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-full shadow-lg border border-slate-200">
                <button
                  onClick={() => setMapTheme('light')}
                  className={`px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1 transition-all ${
                    mapTheme === 'light' 
                      ? 'bg-[#ff9800] text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>☀️ Sol (Día)</span>
                </button>
                <button
                  onClick={() => setMapTheme('dark')}
                  className={`px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1 transition-all ${
                    mapTheme === 'dark' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>🌙 Noche</span>
                </button>
              </div>

              <VamoUniversalMap
                center={mapCenter}
                zoom={15}
                theme={mapTheme}
                mode3D={false}
                drivers={hotZones.map(zone => ({
                  id: zone.id,
                  name: `🔥 ${zone.name} (${zone.ordersPerHour} envíos/h)`,
                  lat: zone.lat,
                  lng: zone.lng,
                  heading: 0,
                  status: zone.id === selectedZoneId ? 'EN_SERVICIO' : 'DISPONIBLE'
                }))}
                className="w-full h-full"
              />
              
              {/* Leyenda de Zonas */}
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md text-slate-900 p-3 rounded-2xl border border-slate-200 shadow-md text-[10px] space-y-1">
                <span className="font-black text-[#0056d2] block uppercase">Leyenda de Zonas:</span>
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5722]" /> Alta Demanda (+25% Tarifa)
                </div>
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff9800]" /> Demanda Media (+15% Tarifa)
                </div>
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a7d600]" /> Demanda Normal (+10% Tarifa)
                </div>
              </div>
            </div>

            {/* Tarjeta Detalle de la Zona Seleccionada */}
            <div className="bg-white p-5 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#737785] tracking-wider block">DETALLE DE ZONA</span>
                  <h3 className="text-base font-extrabold text-[#1c1b1b]">{currentZone.name}</h3>
                  <p className="text-xs font-semibold text-[#737785]">{currentZone.desc}</p>
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${currentZone.badgeColor}`}>
                  {currentZone.bonusText}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-[#f5fff6] p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-[#737785] block">Volumen Estimado:</span>
                  <strong className="text-sm font-black text-[#0056d2]">{currentZone.ordersPerHour} Pedidos / Hora</strong>
                </div>
                <div className="bg-[#f5fff6] p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-[#737785] block">Densidad Repartidores:</span>
                  <strong className="text-sm font-black text-[#161e00]">{currentZone.riderDensity}</strong>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsNavigatingToZone(true)
                  setTimeout(() => setIsNavigatingToZone(false), 4000)
                }}
                className={`w-full py-3.5 rounded-full text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all ${
                  isNavigatingToZone
                    ? 'bg-[#00e676] text-slate-900'
                    : 'bg-[#c3f400] hover:bg-[#abd600] text-[#161e00]'
                }`}
              >
                {isNavigatingToZone ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-900 animate-ping" />
                    <span>¡NAVEGANDO A {currentZone.name.toUpperCase()} (GPS ACTIVO)!</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>NAVEGAR A ESTA ZONA CALIENTE 🏍️</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* MÓDULO DASHBOARD HABITUAL */
          <>
            {/* Tarjetas Métricas Rápidas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-1">
                <div className="flex items-center gap-1.5 text-[#0056d2] font-bold text-xs">
                  <Wallet className="w-4 h-4" />
                  <span>Ganancias Hoy</span>
                </div>
                <p className="text-xl font-extrabold text-[#1c1b1b]">$480.00</p>
                <span className="text-[10px] font-semibold text-[#737785]">6 viajes realizados</span>
              </div>

              <div className="bg-white p-4 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-1">
                <div className="flex items-center gap-1.5 text-[#726200] font-bold text-xs">
                  <Trophy className="w-4 h-4 text-[#fddf33]" />
                  <span>Bono Meta</span>
                </div>
                <p className="text-xl font-extrabold text-[#1c1b1b]">$150.00</p>
                <span className="text-[10px] font-bold text-[#c3f400] bg-[#161e00] px-1.5 py-0.5 rounded">
                  Faltan 2 viajes
                </span>
              </div>
            </div>

            {/* Banner de Oferta Entrante Simulada */}
            <div className="bg-[#0056d2] text-white p-5 rounded-[28px] shadow-lg space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                  OFERTA DISPONIBLE
                </span>
                <span className="text-xs font-extrabold text-[#ccd8ff]">Paga $65.00 en efectivo</span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white">Taquería El Pastor &bull; Centro</h3>
                <p className="text-xs font-medium text-[#ccd8ff]">Distancia: 1.8 km &bull; Entrega a 3.2 km</p>
              </div>

              <Link
                href="/driver/offer"
                className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3 rounded-full font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span>VER OFERTA COMPLETA</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}

      </div>
    </MobileDriverLayout>
  )
}
