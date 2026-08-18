'use client'

import React, { useState } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { ShieldCheck, Check, X, FileText, Eye, CheckCircle2, AlertCircle } from 'lucide-react'

export default function OwnerKycPage() {
  const [candidates, setCandidates] = useState([
    { 
      id: 1, 
      name: 'Pedro Sánchez', 
      vehicle: 'Yamaha FZ 2.0 (Placa 99-XYZ)',
      docs: ['Licencia A1 (Vigente)', 'INE Frente y Vuelta', 'Tarjeta de Circulación'],
      status: 'pending',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    },
    { 
      id: 2, 
      name: 'Laura Gómez', 
      vehicle: 'Honda Cargo 150 (Placa 44-[#ABC])',
      docs: ['Licencia A1 (Vigente)', 'INE Frente y Vuelta', 'Carta Antecedentes No Penales'],
      status: 'pending',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
    }
  ])

  const [selectedCandidate, setSelectedCandidate] = useState<typeof candidates[0] | null>(null)
  const [approvedCount, setApprovedCount] = useState(14)

  const handleApprove = (id: number) => {
    setCandidates(prev => prev.filter(c => c.id !== id))
    setApprovedCount(prev => prev + 1)
    setSelectedCandidate(null)
  }

  const handleReject = (id: number) => {
    setCandidates(prev => prev.filter(c => c.id !== id))
    setSelectedCandidate(null)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="kyc" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Aprobación KYC & Verificación de Choferes</h1>
            <p className="text-xs text-[#737785] font-semibold">Validación de licencias de conducir, tarjetas de circulación e identidades</p>
          </div>

          <span className="bg-[#c3f400] text-[#161e00] px-4 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            {approvedCount} Choferes Verificados
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-extrabold text-[#1c1b1b] uppercase tracking-wider">Solicitudes Pendientes por Revisar</h2>
              <span className="text-xs font-bold text-[#737785] bg-[#e5e2e1] px-3 py-1 rounded-full">{candidates.length} Pendientes</span>
            </div>

            {candidates.length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] text-center space-y-3 border border-[#e5e2e1] shadow-sm">
                <div className="w-14 h-14 bg-[#c3f400] text-[#161e00] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1c1b1b]">¡Expediente de Candidatos al Día!</h3>
                <p className="text-xs font-semibold text-[#737785] max-w-md mx-auto">
                  Todos los motociclistas de la flotilla cuentan con licencia y tarjeta de circulación validadas y activas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {candidates.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <img src={c.photoUrl} alt={c.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#0056d2]" />
                        <div>
                          <strong className="text-base font-extrabold text-[#1c1b1b] block">{c.name}</strong>
                          <span className="text-xs font-bold text-[#0056d2]">{c.vehicle}</span>
                        </div>
                      </div>

                      <div className="bg-[#f6f3f2] p-4 rounded-2xl space-y-2 border border-[#e5e2e1]">
                        <span className="text-[10px] font-black text-[#737785] uppercase tracking-wider block">Documentos Adjuntos:</span>
                        <ul className="space-y-1">
                          {c.docs.map((doc, idx) => (
                            <li key={idx} className="text-xs font-semibold text-[#1c1b1b] flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#0056d2]" /> {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button 
                        onClick={() => handleApprove(c.id)}
                        className="flex-1 bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-3 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>APROBAR & DAR DE ALTA</span>
                      </button>

                      <button 
                        onClick={() => handleReject(c.id)}
                        className="bg-[#ffdad6] hover:bg-[#ffb4ab] text-[#ba1a1a] px-4 py-3 rounded-full text-xs font-black active:scale-95 transition-all flex items-center justify-center gap-1"
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
