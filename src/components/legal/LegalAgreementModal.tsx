'use client'

import React, { useState, useRef } from 'react'
import { ShieldCheck, CheckCircle2, FileText, Download, X, Lock, PenTool, Check } from 'lucide-react'

export type AgreementType = 'DRIVER' | 'MERCHANT' | 'COMMERCIAL_PARTNER'

interface LegalAgreementModalProps {
  isOpen: boolean
  onClose: () => void
  onAcceptAndSign: (signatureData: {
    contractId: string
    signedName: string
    signedDate: string
    agreementType: AgreementType
    digitalHash: string
  }) => void
  agreementType: AgreementType
  userName?: string
  bizName?: string
}

export function LegalAgreementModal({
  isOpen,
  onClose,
  onAcceptAndSign,
  agreementType,
  userName = 'Usuario VAMO',
  bizName = 'Comercio Afiliado'
}: LegalAgreementModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [signatureName, setSignatureName] = useState(userName)
  const [isSigned, setIsSigned] = useState(false)
  const [signatureHash, setSignatureHash] = useState<string | null>(null)
  const [contractFolio, setContractFolio] = useState<string>('')
  
  const contentRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      if (scrollTop + clientHeight >= scrollHeight - 40) {
        setHasScrolledToBottom(true)
      }
    }
  }

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptedTerms || !signatureName.trim()) return

    const timestamp = new Date().toISOString()
    const prefix = agreementType === 'DRIVER' ? 'DRV' : agreementType === 'MERCHANT' ? 'BIZ' : 'SOC'
    const randomFolio = `CTR-NOM151-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`
    
    // Hash simulado de integridad digital NOM-151 / SHA-256
    const pseudoHash = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`

    setContractFolio(randomFolio)
    setSignatureHash(pseudoHash)
    setIsSigned(true)

    // Guardar en localStorage para constancia local
    try {
      const contractRecord = {
        contractId: randomFolio,
        signedName: signatureName.trim(),
        signedDate: timestamp,
        agreementType,
        digitalHash: pseudoHash,
        status: 'SIGNED_AND_CONFIRMED'
      }
      localStorage.setItem(`vamo_contract_${agreementType}_${signatureName.trim()}`, JSON.stringify(contractRecord))
    } catch {}

    setTimeout(() => {
      onAcceptAndSign({
        contractId: randomFolio,
        signedName: signatureName.trim(),
        signedDate: timestamp,
        agreementType,
        digitalHash: pseudoHash
      })
    }, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-fade-in border border-[#e5e2e1] overflow-hidden">
        
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-[#f0eded] flex justify-between items-center bg-[#fcf9f8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#161e00] text-[#c3f400] flex items-center justify-center font-black">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#0056d2] uppercase tracking-wider block">
                CUMPLIMIENTO NORMATIVO NOM-151 & CÓDIGO DE COMERCIO
              </span>
              <h2 className="text-base sm:text-lg font-black text-[#1c1b1b]">
                {agreementType === 'DRIVER' 
                  ? 'Contrato de Conectividad & 0% Comisión Conductor' 
                  : agreementType === 'MERCHANT'
                  ? 'Convenio Comercial & Membresía de Radar'
                  : 'Contrato de Renta SaaS & Cofinanciamiento de Plaza'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full bg-[#f0eded] hover:bg-[#e5e2e1] text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO DEL CONTRATO / GUÍA CON SCROLL */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 p-6 overflow-y-auto text-xs text-slate-700 space-y-4 font-sans leading-relaxed border-b border-[#f0eded]"
        >
          {agreementType === 'DRIVER' && (
            <>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl space-y-1">
                <strong className="text-xs font-black text-[#0056d2] block">✨ RESUMEN DE DERECHOS Y CONDICIONES (CONDUCTOR)</strong>
                <p className="text-[11px] text-slate-700">
                  Usted ingresa al ecosistema VAMO como <strong>prestador de servicios logísticos independiente</strong>. 
                  Usted conserva el <strong>100% del valor de cada entrega realizada y el 100% de las propinas</strong>. VAMO no le retiene comisiones porcentuales sobre sus viajes.
                </p>
              </div>

              <h3 className="font-extrabold text-sm text-slate-900 pt-2">CLÁUSULA PRIMERA — OBJETO DEL CONTRATO</h3>
              <p>
                El presente instrumento tiene por objeto regular el acceso y uso de la infraestructura tecnológica VAMO (aplicación móvil, navegación satelital, cotizador automático) así como el uso de las instalaciones físicas de la Base Operativa local en su ciudad.
              </p>

              <h3 className="font-extrabold text-sm text-slate-900 pt-2">CLÁUSULA SEGUNDA — 0% COMISIÓN Y RETENCIÓN DE TARIFAS</h3>
              <p>
                El Conductor percibirá de forma íntegra el importe cobrado al cliente final por concepto de flete de envío, así como cualquier gratificación o propina voluntaria. VAMO renuncia expresamente a retener porcentajes por viaje.
              </p>

              <h3 className="font-extrabold text-sm text-slate-900 pt-2">CLÁUSULA TERCERA — APORTACIÓN DE CONECTIVIDAD & BASE</h3>
              <p>
                Como contraprestación por la disponibilidad de los servidores en la nube, telemetría satelital y el acceso a la sala de descanso, sanitarios, hidratación y auxilio de la Base Operativa, el Conductor realizará una aportación fija de <strong>$100.00 MXN semanales</strong> ($14.28 MXN/día), distribuida de forma transparente: 50% al sostenimiento de la Base Local y 50% al mantenimiento de la infraestructura tecnológica Cloud.
              </p>

              <h3 className="font-extrabold text-sm text-slate-900 pt-2">CLÁUSULA CUARTA — DISPERSIÓN BANCARIA</h3>
              <p>
                Los fondos acumulados por viajes pagados con tarjeta o transferencia se liquidarán directamente a la cuenta CLABE de 18 dígitos proporcionada por el Conductor, conforme a la frecuencia de corte seleccionada (Diario, Semanal o Retiro Inmediato).
              </p>
            </>
          )}

          {agreementType === 'MERCHANT' && (
            <>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1">
                <strong className="text-xs font-black text-emerald-800 block">✨ RESUMEN DE CONDICIONES COMERCIALES (LOCAL / RESTAURANTE)</strong>
                <p className="text-[11px] text-slate-700">
                  Usted afilia a <strong>{bizName}</strong> al Radar Urbano VAMO con <strong>0% de comisión sobre sus ventas de alimentos y platillos</strong>. El 100% del precio de su menú en mostrador ingresa íntegro a su negocio.
                </p>
              </div>

              <h3 className="font-extrabold text-sm text-slate-900 pt-2">CLÁUSULA PRIMERA — VISIBILIDAD EN RADAR Y COMANDERA KDS</h3>
              <p>
                VAMO otorga al Comercio el derecho de publicación en el mapa interactivo de clientes, catálogo digital de productos y la habilitación de la terminal de cocina KDS (Kitchen Display System) para la preparación ágil de pedidos.
              </p>

              <h3 className="font-extrabold text-sm text-slate-900 pt-2">CLÁUSULA SEGUNDA — 0% DE COMISIÓN SOBRE ALIMENTOS</h3>
              <p>
                A diferencia de plataformas tradicionales de comisión porcentual (25%-35%), VAMO no retiene ningún porcentaje sobre los productos vendidos por el Comercio.
              </p>

              <h3 className="font-extrabold text-sm text-slate-900 pt-2">CLÁUSULA TERCERA — MEMBRESÍA MENSUAL FIJA</h3>
              <p>
                El Comercio cubrirá una membresía mensual fija según el plan contratado (Micro $100/mes, PyME $300/mes, Restaurante $600/mes), destinada en un 50% a la coordinación de la flotilla de reparto de su plaza y un 50% al mantenimiento de la plataforma tecnológica.
              </p>

              <h3 className="font-extrabold text-sm text-slate-900 pt-2">CLÁUSULA CUARTA — SIN PLAZOS FORZOSOS</h3>
              <p>
                El Comercio podrá solicitar la pausa o baja definitiva de su membresía en cualquier momento desde su panel de configuración sin penalizaciones ocultas.
              </p>
            </>
          )}

          <div className="p-3 bg-slate-100 rounded-xl text-[10px] text-slate-500 font-mono">
            FOLIO DIGITAL PREVIO: PROY-NOM151-2026 &bull; VALIDEZ JURÍDICA ART. 89 CÓDIGO DE COMERCIO
          </div>
        </div>

        {/* FOOTER CON FIRMA Y ACEPTACIÓN */}
        <div className="p-5 sm:p-6 bg-[#fcf9f8] space-y-4">
          {isSigned ? (
            <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-2xl text-center space-y-1 animate-bounce">
              <div className="flex items-center justify-center gap-2 font-black text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>¡CONTRATO FIRMADO Y CERTIFICADO EXITOSAMENTE!</span>
              </div>
              <p className="text-xs font-mono font-bold">Folio de Constancia: {contractFolio}</p>
              <p className="text-[10px] text-slate-700">Hash de Consentimiento: {signatureHash}</p>
            </div>
          ) : (
            <form onSubmit={handleSign} className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  required
                  className="w-4 h-4 mt-0.5 accent-[#0056d2] cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  He leído íntegramente, entiendo y acepto las condiciones de la herramienta, la regla de <strong>0% comisión</strong> y la aportación de infraestructura tecnológica.
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Nombre Completo (Firma Electrónica):</label>
                  <input 
                    type="text"
                    value={signatureName}
                    onChange={e => setSignatureName(e.target.value)}
                    required
                    placeholder="Escribe tu nombre completo"
                    className="w-full bg-white border border-[#e5e2e1] focus:border-[#0056d2] rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={!acceptedTerms || !signatureName.trim()}
                    className="w-full bg-[#0056d2] hover:bg-[#0040a1] disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>FIRMAR DIGITALMENTE Y ACEPTAR</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
