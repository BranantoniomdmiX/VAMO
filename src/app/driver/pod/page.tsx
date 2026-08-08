'use client'

import React, { useState } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { Check, Camera, PenTool, DollarSign, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DriverPodPage() {
  const [photoTaken, setPhotoTaken] = useState(false)
  const [signed, setSigned] = useState(false)
  const [completed, setCompleted] = useState(false)
  const router = useRouter()

  const handleFinish = () => {
    setCompleted(true)
    setTimeout(() => {
      router.push('/driver/home')
    }, 2000)
  }

  return (
    <MobileDriverLayout>
      <div className="p-5 space-y-5">
        
        {/* Header POD */}
        <header className="text-center space-y-1 pt-2">
          <span className="bg-[#c3f400] text-[#161e00] text-[10px] font-black px-3 py-1 rounded-full uppercase">
            PRUEBA DE ENTREGA (POD)
          </span>
          <h1 className="text-xl font-extrabold text-[#1c1b1b]">Entregar Pedido #V-9042</h1>
          <p className="text-xs font-semibold text-[#737785]">Cliente: María G. &bull; Cobro en Efectivo</p>
        </header>

        {/* Cobro en Efectivo Highlight */}
        <div className="bg-[#0056d2] text-white p-5 rounded-[28px] text-center space-y-1 shadow-md">
          <span className="text-xs font-extrabold text-[#ccd8ff] uppercase tracking-wider block">MONTO A COBRAR EN EFECTIVO</span>
          <p className="text-4xl font-black text-[#c3f400]">$65.00 MXN</p>
          <p className="text-[10px] font-semibold text-[#ccd8ff]">Asegúrate de recabar el efectivo completo antes de finalizar.</p>
        </div>

        {/* Captura de Foto o Evidencia */}
        <div 
          onClick={() => setPhotoTaken(!photoTaken)}
          className={`
            p-5 rounded-[24px] border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center
            ${photoTaken 
              ? 'bg-[#c3f400]/20 border-[#c3f400] text-[#161e00]' 
              : 'bg-white border-[#e5e2e1] text-[#737785] hover:border-[#0056d2]'}
          `}
        >
          <Camera className="w-8 h-8 text-[#0056d2]" />
          <span className="text-xs font-extrabold">
            {photoTaken ? '✓ Foto de Entrega Capturada' : 'Toca para tomar foto de entrega'}
          </span>
        </div>

        {/* Firma Táctica Cliente */}
        <div 
          onClick={() => setSigned(!signed)}
          className={`
            p-5 rounded-[24px] border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center h-28
            ${signed 
              ? 'bg-[#0056d2]/10 border-[#0056d2] text-[#0056d2]' 
              : 'bg-white border-[#e5e2e1] text-[#737785] hover:border-[#0056d2]'}
          `}
        >
          <PenTool className="w-6 h-6 text-[#0056d2]" />
          <span className="text-xs font-extrabold">
            {signed ? '✓ Firma Digital Recabada' : 'Toca aquí para recabar firma digital del cliente'}
          </span>
        </div>

        {/* Botón Finalizar Viaje */}
        {completed ? (
          <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-full text-center font-black text-xs flex items-center justify-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <span>¡ENTREGA EXITOSA! SUMANDO $65.00 A SALDO</span>
          </div>
        ) : (
          <button
            onClick={handleFinish}
            className="w-full bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-4 rounded-full font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check className="w-5 h-5" />
            <span>FINALIZAR ENTREGA Y COBRAR $65.00</span>
          </button>
        )}

      </div>
    </MobileDriverLayout>
  )
}
