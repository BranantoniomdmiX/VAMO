'use client'

import React, { useState, useEffect } from 'react'
import { SidebarBase } from '@/components/layout/SidebarBase'
import { VamoPageHeader } from '@/components/ui/VamoPageHeader'
import { DollarSign, CheckCircle2, Wallet, ArrowDownRight, Printer, Receipt, ShieldCheck, Lock, Unlock, AlertCircle } from 'lucide-react'
import { WalletService, UserWallet } from '@/lib/services/walletService'

export default function BaseCashierPage() {
  const [processedDriver, setProcessedDriver] = useState<{ name: string; amount: number; receipt: string } | null>(null)
  const [totalBaseCash, setTotalBaseCash] = useState<number>(0.00)
  const [driverWallet, setDriverWallet] = useState<UserWallet | null>(null)
  const [driversList, setDriversList] = useState<{ id: string; name: string; codCash: number; status: string; isBlocked: boolean }[]>([])

  useEffect(() => {
    loadDriverData()
  }, [])

  const loadDriverData = async () => {
    const list: { id: string; name: string; codCash: number; status: string; isBlocked: boolean }[] = []

    try {
      const storedCodes = localStorage.getItem('vamo_driver_codes')
      if (storedCodes) {
        const parsed = JSON.parse(storedCodes)
        parsed.filter((c: any) => c.status === 'used' && c.assignedTo).forEach((c: any, idx: number) => {
          list.push({
            id: `driver-${idx}`,
            name: `${c.assignedTo} (${c.code})`,
            codCash: 0.00,
            status: 'normal',
            isBlocked: false
          })
        })
      }
    } catch (e) {}

    setDriversList(list)
  }

  const [selectedDriverForAudit, setSelectedDriverForAudit] = useState<{ id: string; name: string; codCash: number } | null>(null)
  const [cashCounted, setCashCounted] = useState<string>('')
  const [cutNotes, setCutNotes] = useState<string>('')

  const handleOpenAuditModal = (d: { id: string; name: string; codCash: number }) => {
    setSelectedDriverForAudit(d)
    setCashCounted(d.codCash.toString())
    setCutNotes('')
  }

  const handleProcessCut = async () => {
    if (!selectedDriverForAudit) return
    const amountCounted = parseFloat(cashCounted) || 0
    const difference = amountCounted - selectedDriverForAudit.codCash

    let receiptNum = `REC-${Math.floor(10000 + Math.random() * 90000)}`
    
    if (selectedDriverForAudit.id === 'driver-carlos-1') {
      const res = await WalletService.settleCodAtBase(selectedDriverForAudit.id, 'base-admin-1')
      receiptNum = res.receiptNumber
      setDriverWallet({ ...res.wallet })
    }

    setTotalBaseCash(prev => prev + amountCounted)
    setProcessedDriver({ 
      name: selectedDriverForAudit.name, 
      amount: amountCounted, 
      receipt: receiptNum 
    })

    // Remover o actualizar de la lista de cortes pendientes
    setDriversList(prev => prev.filter(d => d.id !== selectedDriverForAudit.id))
    setSelectedDriverForAudit(null)

    setTimeout(() => {
      setProcessedDriver(null)
    }, 6000)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarBase activeTab="cashier" />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 md:px-8 pt-6 pb-2">
          <VamoPageHeader
            title="Caja Física & Arqueo COD"
            description="Recepción de efectivo recolectado y liberación de límites ($1,500 MXN por conductor)"
            badge={
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full">
                💵 CAJA ACTIVA
              </span>
            }
          />
        </div>

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

          {/* MÓDULO DE COBRO DE CUOTAS EN EFECTIVO (MOTO $100 / LOCALES) */}
          <div className="bg-white rounded-[28px] p-6 border border-[#e5e2e1] shadow-xs space-y-4">

            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0056d2] text-white flex items-center justify-center font-black text-xs">
                  💵
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Cobro de Membresías en Efectivo en Ventanilla</h3>
                  <span className="text-[11px] text-slate-500 font-semibold">Registro de pagos semanales de motociclistas y rentas de locales</span>
                </div>
              </div>
              <span className="text-xs font-black bg-blue-50 text-[#0056d2] px-3 py-1 rounded-full border border-blue-100">
                Membresía Semanal: $100.00 MXN
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const receipt = `REC-MOTO-${Date.now().toString().slice(-4)}`
                  setTotalBaseCash(prev => prev + 100)
                  setProcessedDriver({
                    name: 'Carlos Mendoza (Mochila #001)',
                    amount: 100.00,
                    receipt
                  })
                }}
                className="p-4 rounded-2xl border border-[#e5e2e1] hover:border-[#0056d2] bg-[#fcf9f8] text-left space-y-1 transition-all active:scale-95 cursor-pointer group"
              >
                <div className="flex justify-between items-center">
                  <strong className="text-xs font-black text-slate-900 group-hover:text-[#0056d2]">🏍️ Cobrar Membresía Chofer ($100.00 MXN)</strong>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Semanal</span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">7 días de acceso a la plataforma con 0% comisión por viaje.</p>
              </button>

              <button
                onClick={() => {
                  const receipt = `REC-LOCAL-${Date.now().toString().slice(-4)}`
                  setTotalBaseCash(prev => prev + 300)
                  setProcessedDriver({
                    name: 'Taquería El Pastorcito',
                    amount: 300.00,
                    receipt
                  })
                }}
                className="p-4 rounded-2xl border border-[#e5e2e1] hover:border-[#0056d2] bg-[#fcf9f8] text-left space-y-1 transition-all active:scale-95 cursor-pointer group"
              >
                <div className="flex justify-between items-center">
                  <strong className="text-xs font-black text-slate-900 group-hover:text-[#0056d2]">🏪 Cobrar Renta Local / Negocio</strong>
                  <span className="text-[10px] font-black bg-blue-100 text-[#0056d2] px-2 py-0.5 rounded-full">Mensual</span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">30 días de presencia en radar, catálogo 1-Tap y KDS de cocina.</p>
              </button>
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
                      onClick={() => handleOpenAuditModal({ id: d.id, name: d.name, codCash: d.codCash })}
                      className={`px-6 py-3 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer ${
                        d.isBlocked 
                          ? 'bg-[#ba1a1a] hover:bg-[#93000a] text-white animate-pulse' 
                          : 'bg-[#c3f400] hover:bg-[#abd600] text-[#161e00]'
                      }`}
                    >
                      <Unlock className="w-4 h-4" />
                      <span>ARQUEAR & DESBLOQUEAR</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal SOP-BASE-004: Procedimiento de Corte de Efectivo */}
          {selectedDriverForAudit && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[32px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#e5e2e1]">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0040a1] text-[#c3f400] flex items-center justify-center font-black">
                    💵
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Arqueo y Corte de Caja COD</h3>
                    <span className="text-[10px] font-bold text-slate-500">SOP-BASE-004 &bull; Conciliación Física vs. Sistema</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Repartidor:</span>
                    <strong className="text-slate-900">{selectedDriverForAudit.name}</strong>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Saldo Sistema (COD):</span>
                    <strong className="text-[#0056d2]">${selectedDriverForAudit.codCash.toFixed(2)} MXN</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Efectivo Físico Contado en Mostrador ($ MXN):</label>
                  <input
                    type="number"
                    step="0.50"
                    value={cashCounted}
                    onChange={(e) => setCashCounted(e.target.value)}
                    className="w-full text-lg font-black text-[#0056d2] p-3 rounded-xl border border-slate-300 focus:border-[#0056d2] outline-none"
                    placeholder="0.00"
                  />
                  {parseFloat(cashCounted) !== selectedDriverForAudit.codCash && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between">
                      <span>Diferencia detectada:</span>
                      <strong className="font-mono">
                        {(parseFloat(cashCounted) - selectedDriverForAudit.codCash > 0 ? '+' : '')}
                        {(parseFloat(cashCounted) - selectedDriverForAudit.codCash || 0).toFixed(2)} MXN
                      </strong>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">Notas de Bitácora / Observaciones (Opcional):</label>
                  <input
                    type="text"
                    value={cutNotes}
                    onChange={(e) => setCutNotes(e.target.value)}
                    placeholder="Ej. Billetes completos, cambio entregado..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#0056d2] outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleProcessCut}
                    className="flex-1 bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3 rounded-full text-xs font-black active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    REGISTRAR CORTE & EMITIR RECIBO 🖨️
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDriverForAudit(null)}
                    className="px-4 bg-[#f0eded] text-slate-700 py-3 rounded-full text-xs font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
