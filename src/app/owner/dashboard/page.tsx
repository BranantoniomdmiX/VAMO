'use client'

import React, { useState, useEffect } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { TrendingUp, DollarSign, Wallet, ShieldCheck, ArrowUpRight, Bike, Store, Key, Check, Plus, Trash2 } from 'lucide-react'

interface DriverCode {
  code: string
  assignedTo?: string
  status: 'available' | 'used'
  createdAt: string
}

export default function OwnerDashboardPage() {
  const [driverCodes, setDriverCodes] = useState<DriverCode[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [flotaName, setFlotaName] = useState('Flotilla VAMO Centro')
  const [activeRidersCount, setActiveRidersCount] = useState(0)
  const [merchantsCount, setMerchantsCount] = useState(0)
  const [netProfit, setNetProfit] = useState(0.00)
  const [cashOnHand, setCashOnHand] = useState(0.00)

  useEffect(() => {
    try {
      // Cargar nombre de flota si existe
      const storedFleets = localStorage.getItem('vamo_fleets')
      if (storedFleets) {
        const parsed = JSON.parse(storedFleets)
        if (parsed.length > 0) {
          setFlotaName(parsed[0].name || 'Socio Comercial Local')
          setActiveRidersCount(parsed[0].riders || 0)
        }
      }

      // Cargar códigos de chofer generados
      const storedCodes = localStorage.getItem('vamo_driver_codes')
      if (storedCodes) {
        setDriverCodes(JSON.parse(storedCodes))
      } else {
        // Inicializar con 1 código listo para probar
        const initialCodes: DriverCode[] = [
          {
            code: 'VAMO-CHOFER-101',
            status: 'available',
            createdAt: new Date().toISOString()
          }
        ]
        setDriverCodes(initialCodes)
        localStorage.setItem('vamo_driver_codes', JSON.stringify(initialCodes))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const saveCodes = (updated: DriverCode[]) => {
    setDriverCodes(updated)
    try {
      localStorage.setItem('vamo_driver_codes', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
  }

  const handleGenerateCode = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const newCode = `VAMO-FLT-${randomDigits}`
    const newEntry: DriverCode = {
      code: newCode,
      status: 'available',
      createdAt: new Date().toISOString()
    }
    const updated = [newEntry, ...driverCodes]
    saveCodes(updated)

    navigator.clipboard?.writeText(newCode)
    setCopiedCode(newCode)
    setTimeout(() => setCopiedCode(null), 3000)
  }

  const handleDeleteCode = (codeToDelete: string) => {
    saveCodes(driverCodes.filter(c => c.code !== codeToDelete))
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="dashboard" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Dashboard Socio Operador 360°</h1>
            <p className="text-xs text-[#737785] font-semibold">Resumen ejecutivo y control de tu plaza operativa</p>
          </div>

          <span className="bg-[#0056d2] text-white px-4 py-1.5 rounded-full text-xs font-black shadow-sm">
            {flotaName} &bull; Activa
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Bento Grid Métricas Financieras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="md:col-span-2 bg-[#0056d2] text-white p-6 sm:p-8 rounded-[32px] space-y-4 shadow-lg">
              <span className="text-xs font-extrabold text-[#ccd8ff] uppercase">UTILIDAD ESTIMADA DE LA PLAZA</span>
              <p className="text-4xl sm:text-6xl font-black text-[#c3f400]">${netProfit.toFixed(2)} MXN</p>
              <div className="flex items-center gap-2 text-xs font-bold text-[#ccd8ff]">
                <ArrowUpRight className="w-4 h-4 text-[#c3f400]" />
                <span>Panel listo para registrar viajes y liquidación de cuotas</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#737785] block">Efectivo Circulante en Base</span>
                <p className="text-3xl font-extrabold text-[#1c1b1b] mt-1">${cashOnHand.toFixed(2)} MXN</p>
              </div>
              <span className="text-xs font-bold text-[#0056d2] bg-[#0056d2]/10 px-3 py-1 rounded-full w-fit">
                En caja lista para corte
              </span>
            </div>

          </div>

          {/* Tarjetas Secundarias: Motos y Comercios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-bold">
                    <Bike className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#1c1b1b]">Flota de Choferes</h3>
                </div>
                <span className="text-lg font-black text-[#0056d2]">{activeRidersCount} Conectados</span>
              </div>
              <p className="text-xs font-semibold text-[#737785]">Usa los códigos de alta abajo para vincular nuevos choferes</p>
            </div>

            <div className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#fddf33] text-[#726200] flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#1c1b1b]">Comercios Afiliados</h3>
                </div>
                <span className="text-lg font-black text-[#726200]">{merchantsCount} Locales</span>
              </div>
              <p className="text-xs font-semibold text-[#737785]">Comercios enlazados a tu base operativa</p>
            </div>
          </div>

          {/* MÓDULO SOCIO OPERADOR: GENERADOR DE LLAVES Y CÓDIGOS DE EQUIPO */}
          <div className="bg-[#0040a1] text-white p-6 sm:p-8 rounded-[32px] border border-blue-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-blue-700/60 pb-4">
              <div>
                <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                  CONTROL SOCIO OPERADOR &bull; EQUIPO
                </span>
                <h3 className="text-xl font-black text-white mt-1">Generador de Códigos de Alta para Choferes</h3>
                <p className="text-xs text-blue-200 font-semibold">
                  Genera códigos para que los nuevos conductores se den de alta en <code className="bg-blue-900 px-1.5 py-0.5 rounded text-[#c3f400]">/auth/register-driver</code>.
                </p>
              </div>

              <button
                onClick={handleGenerateCode}
                className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-5 py-3 rounded-full text-xs font-black shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ GENERAR CÓDIGO CHOFER 🔑</span>
              </button>
            </div>

            {copiedCode && (
              <div className="bg-[#c3f400] text-[#161e00] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4" />
                <span>¡Código {copiedCode} copiado al portapapeles! Compártelo con el chofer.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {driverCodes.map((item) => (
                <div key={item.code} className="bg-white/10 p-4 rounded-2xl border border-white/20 space-y-2 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-200 uppercase">
                      {item.status === 'available' ? 'Código Disponible:' : 'Código Asignado:'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        item.status === 'available' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/20 text-white'
                      }`}>
                        {item.status === 'available' ? 'LISTO PARA USAR' : item.assignedTo || 'ASIGNADO'}
                      </span>
                      <button
                        onClick={() => handleDeleteCode(item.code)}
                        className="text-white/40 hover:text-rose-300 p-0.5 rounded transition-colors"
                        title="Eliminar código"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <strong className="font-mono text-xl font-black text-[#c3f400] block">{item.code}</strong>
                  <p className="text-[11px] text-blue-200 font-semibold">
                    {item.status === 'available' ? 'Válido para 1 conductor nuevo' : 'Vinculado a conductor'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
