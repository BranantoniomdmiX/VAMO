'use client'

import React from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { 
  Building2, 
  Scale, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  FileText, 
  Clock, 
  ShieldCheck,
  Search,
  Filter,
  Download
} from 'lucide-react'

interface ClearingRecord {
  id: string
  debtorFranchise: string
  creditorFranchise: string
  ordersCount: number
  grossAmount: number
  netPayable: number
  status: 'PENDING' | 'SETTLED' | 'DISPUTED'
  period: string
}

interface LedgerRecord {
  id: string
  timestamp: string
  entryType: string
  franchise: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
}

export default function VamoClearingLedgerPage() {
  const [activeView, setActiveView] = React.useState<'clearing' | 'ledger'>('clearing')
  const [searchQuery, setSearchQuery] = React.useState('')

  // Datos de prueba / demostración de la Cámara de Compensación
  const [clearingList, setClearingList] = React.useState<ClearingRecord[]>([
    {
      id: 'CLR-2026-001',
      debtorFranchise: 'Franquicia Celaya Centro (A)',
      creditorFranchise: 'Franquicia Querétaro Poniente (B)',
      ordersCount: 48,
      grossAmount: 3840.00,
      netPayable: 1920.00, // 50% por ejecución de motos prestadas
      status: 'PENDING',
      period: '12 Ago - 19 Ago 2026'
    },
    {
      id: 'CLR-2026-002',
      debtorFranchise: 'Franquicia Irapuato Norte (C)',
      creditorFranchise: 'Franquicia Celaya Centro (A)',
      ordersCount: 14,
      grossAmount: 1120.00,
      netPayable: 560.00,
      status: 'SETTLED',
      period: '05 Ago - 12 Ago 2026'
    }
  ])

  // Datos del Ledger Inmutable
  const [ledgerEntries, setLedgerEntries] = React.useState<LedgerRecord[]>([
    {
      id: 'LDG-948102',
      timestamp: '2026-08-20 11:45:10',
      entryType: 'delivery_income',
      franchise: 'Franquicia Celaya Centro',
      amount: 45.00,
      balanceBefore: 12450.00,
      balanceAfter: 12495.00,
      description: 'Servicio entregado VMO-849102 (Comisión reparto $30 + Cuota $15)'
    },
    {
      id: 'LDG-948101',
      timestamp: '2026-08-20 11:32:04',
      entryType: 'franchise_compensation',
      franchise: 'Franquicia Querétaro Poniente',
      amount: 25.00,
      balanceBefore: 8910.00,
      balanceAfter: 8935.00,
      description: 'Compensación de ejecución por pedido cruzado comercio Franquicia A ejecutado por Moto B-024'
    },
    {
      id: 'LDG-948100',
      timestamp: '2026-08-20 11:15:22',
      entryType: 'fee_payment',
      franchise: 'Franquicia Celaya Centro',
      amount: -50.00,
      balanceBefore: 12500.00,
      balanceAfter: 12450.00,
      description: 'Regalía semanal repartidor R-009 dividida con VAMO Central'
    }
  ])

  const handleSettle = (id: string) => {
    setClearingList(prev => prev.map(item => item.id === id ? { ...item, status: 'SETTLED' } : item))
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab={'clearing' as any} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm">
          <div>
            <span className="bg-[#0056d2]/10 text-[#0056d2] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              PRINCIPIOS 15 & 16: VAMO CLEARING & AUDITORÍA
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b] mt-1">
              Cámara de Compensación & Ledger Financiero
            </h1>
            <p className="text-xs text-[#737785] font-semibold">
              Liquidación automática entre franquicias y libro contable inmutable con trazabilidad total
            </p>
          </div>

          {/* Vistas Tab Switcher */}
          <div className="flex items-center bg-[#f0eded] p-1 rounded-2xl border border-[#e5e2e1]">
            <button
              onClick={() => setActiveView('clearing')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeView === 'clearing' 
                  ? 'bg-white text-[#0056d2] shadow-sm' 
                  : 'text-[#737785] hover:text-[#1c1b1b]'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              VAMO Clearing (Compensaciones)
            </button>
            <button
              onClick={() => setActiveView('ledger')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeView === 'ledger' 
                  ? 'bg-white text-[#0056d2] shadow-sm' 
                  : 'text-[#737785] hover:text-[#1c1b1b]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Ledger Inmutable
            </button>
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* STATS HERO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0040A1] text-white p-5 rounded-[24px] shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-blue-200 tracking-wider">SALDO PENDIENTE DE CLEARING</span>
              <p className="text-2xl md:text-3xl font-black text-[#c3f400]">$1,920.00 MXN</p>
              <p className="text-xs text-blue-100 font-semibold">1 compensación entre Franquicia A y Franquicia B</p>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-[#e5e2e1] shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-[#737785] tracking-wider">TOTAL LIQUIDADO ESTE MES</span>
              <p className="text-2xl md:text-3xl font-black text-[#1c1b1b]">$14,560.00 MXN</p>
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% conciliado sin intervención manual
              </p>
            </div>

            <div className="bg-[#161e00] text-[#c3f400] p-5 rounded-[24px] shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-[#c3f400]/70 tracking-wider">REGLA VAMO CLEARING</span>
              <p className="text-base font-extrabold text-white">Comercio A + Moto B = Reparto Justo</p>
              <p className="text-[11px] text-slate-300">
                La Franquicia Ejecutora recibe su pago sin perjudicar la relación de la Franquicia Comercial.
              </p>
            </div>
          </div>

          {/* VIEW 1: CLEARING SETTLEMENTS */}
          {activeView === 'clearing' && (
            <div className="bg-white rounded-[28px] border border-[#e5e2e1] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#e5e2e1] flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-base font-black text-[#1c1b1b]">Compensaciones Inter-Franquicias (Settlements)</h2>
                  <p className="text-xs text-[#737785]">Cortes semanales automáticos de deudas y créditos logísticos</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#737785]" />
                    <input
                      type="text"
                      placeholder="Buscar por franquicia o ID..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 text-xs rounded-xl bg-[#f6f3f2] border border-[#e5e2e1] focus:outline-none focus:border-[#0056d2]"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f6f3f2] text-[#424654] font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-4">ID Liquidación</th>
                      <th className="p-4">Franquicia Deudora (Comercio)</th>
                      <th className="p-4">Franquicia Acreedora (Motos)</th>
                      <th className="p-4">Pedidos Cruzados</th>
                      <th className="p-4">Monto Bruto</th>
                      <th className="p-4">Monto Neto a Pagar</th>
                      <th className="p-4">Período</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e2e1] font-semibold">
                    {clearingList.map(item => (
                      <tr key={item.id} className="hover:bg-[#faf8f7] transition-colors">
                        <td className="p-4 font-extrabold text-[#0056d2]">{item.id}</td>
                        <td className="p-4 text-[#1c1b1b]">{item.debtorFranchise}</td>
                        <td className="p-4 text-[#1c1b1b]">{item.creditorFranchise}</td>
                        <td className="p-4">{item.ordersCount} entregas</td>
                        <td className="p-4 text-[#737785]">${item.grossAmount.toFixed(2)}</td>
                        <td className="p-4 font-black text-[#1c1b1b]">${item.netPayable.toFixed(2)} MXN</td>
                        <td className="p-4 text-[#737785]">{item.period}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            item.status === 'SETTLED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status === 'SETTLED' ? 'LIQUIDADO' : 'PENDIENTE'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {item.status === 'PENDING' ? (
                            <button
                              onClick={() => handleSettle(item.id)}
                              className="px-3 py-1.5 bg-[#0056d2] hover:bg-[#0040A1] text-white rounded-xl text-[11px] font-extrabold transition-all"
                            >
                              Conciliar y Liquidar
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-extrabold">✓ Pagado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: FINANCIAL LEDGER */}
          {activeView === 'ledger' && (
            <div className="bg-white rounded-[28px] border border-[#e5e2e1] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#e5e2e1] flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black text-[#1c1b1b]">Libro Contable Inmutable (Ledger)</h2>
                  <p className="text-xs text-[#737785]">Cada centavo registrado con saldo anterior y posterior</p>
                </div>
                <button className="px-3 py-1.5 bg-[#f0eded] text-[#1c1b1b] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#e5e2e1]">
                  <Download className="w-3.5 h-3.5" />
                  Exportar Auditoría CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f6f3f2] text-[#424654] font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-4">ID Transacción</th>
                      <th className="p-4">Fecha & Hora</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4">Franquicia</th>
                      <th className="p-4">Monto</th>
                      <th className="p-4">Saldo Previo</th>
                      <th className="p-4">Saldo Posterior</th>
                      <th className="p-4">Concepto / Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e2e1] font-semibold">
                    {ledgerEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-[#faf8f7] transition-colors">
                        <td className="p-4 font-mono font-bold text-[#0056d2]">{entry.id}</td>
                        <td className="p-4 text-[#737785]">{entry.timestamp}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#0056d2] border border-blue-100">
                            {entry.entryType}
                          </span>
                        </td>
                        <td className="p-4 text-[#1c1b1b]">{entry.franchise}</td>
                        <td className={`p-4 font-black ${entry.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {entry.amount > 0 ? `+$${entry.amount.toFixed(2)}` : `-$${Math.abs(entry.amount).toFixed(2)}`}
                        </td>
                        <td className="p-4 text-[#737785]">${entry.balanceBefore.toFixed(2)}</td>
                        <td className="p-4 font-extrabold text-[#1c1b1b]">${entry.balanceAfter.toFixed(2)}</td>
                        <td className="p-4 text-[#424654] max-w-xs truncate">{entry.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
