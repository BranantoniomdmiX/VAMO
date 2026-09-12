'use client'

import React, { useState, useEffect } from 'react'
import { SidebarOwner } from '@/components/layout/SidebarOwner'
import { ShieldCheck, Check, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { 
  VamoPageHeader, 
  VamoCard, 
  VamoStatusBadge, 
  VamoButton, 
  VamoEmptyState 
} from '@/components/ui'
import { formatNumberMX } from '@/lib/utils/formatters'

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
  const [rejectTarget, setRejectTarget] = useState<KycCandidate | null>(null)

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

  const handleConfirmReject = () => {
    if (!rejectTarget) return
    setCandidates(prev => prev.filter(c => c.id !== rejectTarget.id))
    setRejectTarget(null)
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarOwner activeTab="kyc" />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <VamoPageHeader
            title="Aprobación KYC & Verificación de Choferes"
            description="Validación de licencias de conducir, tarjetas de circulación e identidades oficiales"
            badge={
              <VamoStatusBadge
                status="DISPONIBLE"
                label={`${formatNumberMX(approvedCount)} Choferes Verificados`}
                size="sm"
              />
            }
            breadcrumbs={[
              { label: 'Socio Comercial', href: '/owner/dashboard' },
              { label: 'Verificación KYC' }
            ]}
          />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Solicitudes Pendientes por Revisar
              </h2>
              <span className="text-xs font-bold text-slate-600 bg-slate-200/70 dark:bg-slate-800 px-3 py-1 rounded-full">
                {formatNumberMX(candidates.length)} Pendientes
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0056D2] mb-2" />
                <span className="text-xs font-bold">Consultando expedientes en base de datos...</span>
              </div>
            ) : candidates.length === 0 ? (
              <VamoCard variant="standard" padding="lg" className="text-center space-y-3">
                <div className="w-14 h-14 bg-[#C3F400] text-[#161E00] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  ¡Expediente de Candidatos al Día!
                </h3>
                <p className="text-xs font-medium text-slate-500 max-w-md mx-auto">
                  No hay solicitudes pendientes. Cuando nuevos conductores se registren con tu código de invitación, sus documentos aparecerán aquí para tu aprobación.
                </p>
              </VamoCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {candidates.map(c => (
                  <VamoCard key={c.id} variant="standard" padding="md" className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center font-bold text-xl border-2 border-[#0056D2] shrink-0">
                          🛵
                        </div>
                        <div>
                          <strong className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">{c.name}</strong>
                          <span className="text-xs font-bold text-[#0056D2]">{c.vehicle}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-control space-y-2 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Documentos Adjuntos:</span>
                        <ul className="space-y-1">
                          {c.docs.map((doc, idx) => (
                            <li key={idx} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#0056D2]" /> {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <VamoButton
                        variant="ghost"
                        className="flex-1"
                        onClick={() => setRejectTarget(c)}
                      >
                        Rechazar
                      </VamoButton>
                      <VamoButton
                        variant="primary"
                        className="flex-1"
                        onClick={() => handleApprove(c.id)}
                      >
                        Aprobar Chofer
                      </VamoButton>
                    </div>
                  </VamoCard>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Diálogo Humano de Confirmación de Rechazo de Solicitud */}
        {rejectTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200 dark:border-rose-900 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#BA1A1A] flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  ¿Rechazar solicitud de «{rejectTarget.name}»?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  El aspirante no será activado en la plaza y sus documentos adjuntos serán descartados de la lista de revisión activa.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <VamoButton
                  variant="danger"
                  className="flex-1"
                  onClick={handleConfirmReject}
                >
                  Sí, rechazar solicitud
                </VamoButton>
                <VamoButton
                  variant="ghost"
                  onClick={() => setRejectTarget(null)}
                >
                  Cancelar
                </VamoButton>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
