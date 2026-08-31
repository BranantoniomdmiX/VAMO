'use client'

import React, { useState, useEffect } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { ShieldCheck, Check, X, FileText, Eye, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface KycCandidate {
  id: string
  name: string
  vehicle: string
  docs: string[]
  status: string
  photoUrl?: string
}

export default function OwnerKycPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<KycCandidate[]>([])
  const [approvedCount, setApprovedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadKycDrivers() {
      try {
        setIsLoading(true)
        const { data: drivers } = await supabase
          .from('drivers')
          .select('*')

        if (drivers && drivers.length > 0) {
          const verified = drivers.filter(d => d.is_verified)
          const pending = drivers.filter(d => !d.is_verified)

          setApprovedCount(verified.length)
          setCandidates(pending.map(d => ({
            id: d.id,
            name: d.full_name || 'Conductor Aspirante',
            vehicle: `${d.vehicle_type || 'Moto'} (${d.vehicle_plates || 'S/P'})`,
            docs: ['Licencia de Conducir', 'INE Vigente', 'Tarjeta de Circulación'],
            status: 'pending'
          })))
        } else {
          setCandidates([])
          setApprovedCount(0)
        }
      } catch (err) {
        console.warn('Error al cargar KYC:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadKycDrivers()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await supabase
        .from('drivers')
        .update({ is_verified: true, status: 'ACTIVE' })
        .eq('id', id)

      setCandidates(prev => prev.filter(c => c.id !== id))
      setApprovedCount(prev => prev + 1)
    } catch (e) {
      console.error(e)
    }
  }

  const handleReject = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="kyc" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-xs">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0056d2]">Aprobación KYC & Verificación de Choferes</h1>
            <p className="text-xs text-[#737785] font-semibold">Validación de licencias de conducir, tarjetas de circulación e identidades</p>
          </div>

          <span className="bg-[#c3f400] text-[#161e00] px-4 py-1.5 rounded-full text-xs font-black shadow-xs flex items-center gap-1.5">
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

            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0056d2] mb-2" />
                <span className="text-xs font-bold">Consultando expedientes en base de datos...</span>
              </div>
            ) : candidates.length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] text-center space-y-3 border border-[#e5e2e1] shadow-xs">
                <div className="w-14 h-14 bg-[#c3f400] text-[#161e00] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1c1b1b]">¡Expediente de Candidatos al Día!</h3>
                <p className="text-xs font-semibold text-[#737785] max-w-md mx-auto">
                  No hay solicitudes pendientes. Cuando nuevos conductores se registren con tu código de invitación, sus documentos aparecerán aquí para tu aprobación.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {candidates.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0056d2] flex items-center justify-center font-bold text-xl border-2 border-[#0056d2]">
                          🛵
                        </div>
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
                        onClick={() => handleReject(c.id)}
                        className="flex-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 py-3 rounded-full text-xs font-bold transition-all cursor-pointer"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleApprove(c.id)}
                        className="flex-1 bg-[#0056d2] hover:bg-[#0040a1] text-white py-3 rounded-full text-xs font-black shadow-md transition-all cursor-pointer"
                      >
                        Aprobar Chofer
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
