'use client'

import React, { useState, useEffect } from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { DollarSign, CheckCircle2, Wallet, ArrowDownRight, Printer, Receipt, ShieldCheck, Lock, Unlock, AlertCircle } from 'lucide-react'
import { WalletService, UserWallet } from '@/lib/services/walletService'

export default function BaseCashierPage() {
  const [processedDriver, setProcessedDriver] = useState<{ name: string; amount: number; receipt: string } | null>(null)
  const [totalBaseCash, setTotalBaseCash] = useState<number>(12450.00)
  const [driverWallet, setDriverWallet] = useState<UserWallet | null>(null)

  const [driversList, setDriversList] = useState([
    { id: 'driver-carlos-1', name: 'Carlos M. (Mochila #001)', codCash: 650.00, status: 'near_limit', isBlocked: false },
    { id: 'driver-ana-2', name: 'Ana P. (Mochila #014)', codCash: 1500.00, status: 'blocked', isBlocked: true },
    { id: 'driver-luis-3', name: 'Luis R. (Mochila #022)', codCash: 320.00, status: 'normal', isBlocked: false }
  ])

  useEffect(() => {
    loadDriverData()
  }, [])

  const loadDriverData = async () => {
    const w = await WalletService.getDriverWallet('driver-carlos-1')
    setDriverWallet(w)
    setDriversList(prev => prev.map(d => {
      if (d.id === 'driver-carlos-1') {
        return {
          ...d,
          codCash: w.codBalance,
          isBlocked: w.isCodBlocked,
          status: w.isCodBlocked ? 'blocked' : w.codBalance >= 1200 ? 'near_limit' : 'normal'
        }
      }
      return d
    }))
  }

  const handleProcessCut = async (driverId: string, driverName: string, amount: number) => {
    let receiptNum = `REC-${Math.floor(10000 + Math.random() * 90000)}`
    
    if (driverId === 'driver-carlos-1') {
      const res = await WalletService.settleCodAtBase(driverId, 'base-admin-1')
      receiptNum = res.receiptNumber
      setDriverWallet({ ...res.wallet })
    }

    setTotalBaseCash(prev => prev + amount)
    setProcessedDriver({ name: driverName, amount, receipt: receiptNum })

    // Remover o actualizar de la lista de cortes pendientes
    setDriversList(prev => prev.filter(d => d.id !== driverId))

    setTimeout(() => {
      setProcessedDriver(null)
    }, 6000)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="cashier" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-xs">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0040a1]">Caja Física y Arqueo COD</h1>
            <p className="text-xs text-slate-500 font-semibold">Recepción de efectivo recolectado y liberación de límites ($1,500 MXN)</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Toast de Recibo Digital Generado */}
          {processedDriver && (
            <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 p-5 rounded-[24px] flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-md animate-bounce gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black">¡Corte y Liberación Exitosa para {processedDriver.name}!</h4>
                  <p className="text-xs text-slate-700">
                    Se recibieron <strong>${processedDriver.amount.toFixed(2)} MXN</strong> en efectivo. Folio digital <strong>#{processedDriver.receipt}</strong>. Estatus de chofer: <span className="text-emerald-700 font-black">DESBLOQUEADO PARA EFECTIVO</span>.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => alert(`Re-imprimiendo comprobante digital #${processedDriver.receipt}...`)}
                className="bg-emerald-600 text-white text-xs font-black px-4 py-2.5 rounded-full hover:bg-emerald-700 shadow-xs shrink-0 cursor-pointer"
              >
                🖨️ Imprimir Comprobante Fiscal
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0040a1] text-white p-6 sm:p-8 rounded-[32px] space-y-2 shadow-md relative overflow-hidden border border-blue-800">
              <span className="text-xs font-black text-blue-200 uppercase tracking-wider block">TOTAL EFECTIVO EN CAJA BASE</span>
              <p className="text-4xl sm:text-5xl font-black text-white">${totalBaseCash.toFixed(2)} MXN</p>
              <span className="text-xs font-black text-[#161e00] bg-[#c3f400] px-3 py-1 rounded-full inline-block">
                Arqueo al Día &bull; 0 Diferencias
              </span>
            </div>

            <div className="bg-[#fddf33] text-[#726200] p-6 sm:p-8 rounded-[32px] space-y-2 shadow-md border border-[#e2c60f]">
              <span className="text-xs font-extrabold uppercase tracking-wider block">REGLA OPERATIVA COD</span>
              <p className="text-2xl sm:text-3xl font-black text-[#161e00]">Techo Máximo: $1,500.00</p>
              <span className="text-xs font-bold opacity-90 block">
                Los choferes que alcancen $1,500 MXN en mano son pausados de viajes en efectivo hasta liquidar aquí.
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-[#1c1b1b]">Repartidores con Efectivo Pendiente de Entrega</h2>
              <span className="text-xs font-bold text-[#737785] bg-white px-3 py-1 rounded-full border border-slate-200">
                {driversList.length} Choferes Activos
              </span>
            </div>

            {driversList.length === 0 ? (
              <div className="bg-white p-8 rounded-[24px] border border-[#e5e2e1] text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#34a853] mx-auto" />
                <h3 className="text-base font-extrabold text-[#1c1b1b]">¡Todos los choferes han liquidado su caja COD!</h3>
                <p className="text-xs text-[#737785]">No hay pendientes de retención de efectivo por el momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {driversList.map((d) => (
                  <div key={d.id} className={`bg-white p-5 rounded-[24px] border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                    d.isBlocked ? 'border-2 border-[#ba1a1a] bg-[#fff8f7]' : 'border-[#e5e2e1]'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-base font-extrabold text-[#1c1b1b]">{d.name}</strong>
                        {d.isBlocked ? (
                          <span className="bg-[#ba1a1a] text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" /> BLOQUEADO COD ($1,500 ALCANZADO)
                          </span>
                        ) : d.status === 'near_limit' ? (
                          <span className="bg-[#f59f00] text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> PRÓXIMO AL LÍMITE
                          </span>
                        ) : (
                          <span className="bg-[#34a853] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            NORMAL
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-[#737785]">
                        Efectivo en mano: <strong className="text-[#0056d2]">${d.codCash.toFixed(2)} MXN</strong> &bull; Límite de retención: $1,500.00 MXN
                      </p>
                    </div>

                    <button 
                      onClick={() => handleProcessCut(d.id, d.name, d.codCash)}
                      className={`px-6 py-3 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-2 ${
                        d.isBlocked 
                          ? 'bg-[#ba1a1a] hover:bg-[#93000a] text-white animate-pulse' 
                          : 'bg-[#c3f400] hover:bg-[#abd600] text-[#161e00]'
                      }`}
                    >
                      <Unlock className="w-4 h-4" />
                      <span>RECIBIR ${d.codCash.toFixed(2)} & DESBLOQUEAR</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
