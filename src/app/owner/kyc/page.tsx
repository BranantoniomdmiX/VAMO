'use client'

import React, { useState } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { ShieldCheck, Check, X, FileText } from 'lucide-react'

export default function OwnerKycPage() {
  const [candidates, setCandidates] = useState([
    { id: 1, name: 'Pedro Sánchez', docs: 'Licencia Vigente + Tarjeta Circulación', status: 'pending' },
    { id: 2, name: 'Laura Gómez', docs: 'Licencia Vigente + INE', status: 'pending' }
  ])

  const handleApprove = (id: number) => {
    setCandidates(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="kyc" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Aprobación KYC & Documentación</h1>
            <p className="text-xs text-[#737785] font-semibold">Validación de licencias y registros de nuevos motociclistas</p>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-[#1c1b1b]">Solicitudes Pendientes de Aprobación</h2>

            {candidates.length === 0 ? (
              <div className="bg-white p-8 rounded-[28px] text-center text-xs font-semibold text-[#737785] border border-[#e5e2e1]">
                ¡No hay solicitudes pendientes por revisar! Todos los motociclistas están aprobados.
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <strong className="text-base font-extrabold text-[#1c1b1b]">{c.name}</strong>
                      <p className="text-xs font-semibold text-[#737785] flex items-center gap-1">
                        <FileText className="w-4 h-4 text-[#0056d2]" /> {c.docs}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => handleApprove(c.id)}
                        className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] px-5 py-2.5 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>APROBAR RIDER</span>
                      </button>

                      <button 
                        onClick={() => handleApprove(c.id)}
                        className="bg-[#ffdad6] text-[#ba1a1a] px-4 py-2.5 rounded-full text-xs font-bold active:scale-95 transition-all flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Rechazar</span>
                      </button>
                    </div>
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
