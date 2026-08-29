'use client'

import React, { useState, useEffect } from 'react'
import { MobileDriverLayout } from '@/components/layout/MobileDriverLayout'
import { Check, Camera, DollarSign, CheckCircle2, ShieldAlert, MapPin, Lock, Unlock, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { audioService } from '@/lib/services/audioService'
import { createClient } from '@/lib/supabase/client'
import { AntiFraudService, MAX_PIN_DISTANCE_METERS } from '@/lib/services/antiFraudService'
import { WalletService } from '@/lib/services/walletService'
import { RatingService } from '@/lib/services/ratingService'
import { Star, ThumbsUp, Heart } from 'lucide-react'

export default function DriverPodPage() {
  const [photoTaken, setPhotoTaken] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showCustomerRating, setShowCustomerRating] = useState(false)
  const [pinCode, setPinCode] = useState('')

  const [pinError, setPinError] = useState<string | null>(null)
  
  // Coordenadas simuladas del repartidor y destino del cliente
  const [driverPos, setDriverPos] = useState({ lat: 20.52615, lng: -100.80908 }) // ~18 metros
  const destPos = { lat: 20.5260, lng: -100.8090 }

  const router = useRouter()

  const geofence = AntiFraudService.checkPinGeofence(
    driverPos.lat,
    driverPos.lng,
    destPos.lat,
    destPos.lng,
    MAX_PIN_DISTANCE_METERS
  )

  const isPinValid = AntiFraudService.verifyOrderPin('V-9042', pinCode)
  const canSubmit = photoTaken && geofence.isAllowed && isPinValid

  const handleFinish = async () => {
    if (!photoTaken) {
      setPinError('Debes tomar la fotografía de entrega POD.')
      return
    }

    try {
      const res = await AntiFraudService.verifyPinAtomic({
        orderId: 'f1a9b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c',
        pin: pinCode || '8492',
        photoUrl: 'https://vamo.qd.je/pod/photo-mock.webp',
        lat: driverPos.lat,
        lng: driverPos.lng
      })

      if (res.success) {
        audioService.playDeliveredFanfare()
        setCompleted(true)
        setTimeout(() => {
          setShowCustomerRating(true)
        }, 1200)
      } else {
        setPinError(res.message || 'El PIN ingresado es incorrecto.')
      }
    } catch {
      setPinError('Error de conexión con el servidor.')
    }
  }

  const handleDriverRatingSubmit = async (stars: number, tag: string) => {
    await RatingService.submitRating({
      orderCode: 'V-9042',
      raterRole: 'driver',
      ratedRole: 'customer',
      stars,
      tags: [tag],
      raterUserId: 'driver-carlos-1'
    })
    router.push('/driver/home')
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

        {/* Geofence Radar Anti-Fraude (<30m) */}
        <div className={`p-4 rounded-[24px] border-2 flex items-center justify-between shadow-sm transition-all ${
          geofence.isAllowed 
            ? 'bg-[#f5fff6] border-[#34a853] text-[#1e8e3e]' 
            : 'bg-[#ffdad6] border-[#ba1a1a] text-[#ba1a1a]'
        }`}>
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 shrink-0" />
            <div>
              <span className="text-xs font-black block uppercase">
                {geofence.isAllowed ? 'GEOFENCE VÁLIDO (<30M)' : 'GEOFENCE BLOQUEADO'}
              </span>
              <p className="text-[11px] font-semibold opacity-90">{geofence.message}</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              // Toggle simulación de proximidad
              setDriverPos(prev => 
                prev.lat === 20.52615 
                  ? { lat: 20.5290, lng: -100.8150 } // lejos: ~700m
                  : { lat: 20.52615, lng: -100.80908 } // cerca: ~18m
              )
            }}
            className="text-[10px] font-extrabold underline shrink-0 ml-2"
          >
            {geofence.isAllowed ? 'Simular lejos' : 'Simular cerca'}
          </button>
        </div>

        {/* Cobro en Efectivo Highlight */}
        <div className="bg-[#0056d2] text-white p-5 rounded-[28px] text-center space-y-1 shadow-md">
          <span className="text-xs font-extrabold text-[#ccd8ff] uppercase tracking-wider block">MONTO A COBRAR EN EFECTIVO</span>
          <p className="text-4xl font-black text-[#c3f400]">$65.00 MXN</p>
          <p className="text-[10px] font-semibold text-[#ccd8ff]">Asegúrate de recabar el efectivo completo antes de finalizar.</p>
        </div>

        {/* Captura de Foto de Evidencia */}
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

        {/* Verificación de PIN de Seguridad de 4 dígitos */}
        <div className={`p-5 rounded-[24px] border shadow-sm space-y-2 text-center transition-all ${
          !geofence.isAllowed ? 'bg-slate-100 opacity-60' : 'bg-white border-[#e5e2e1]'
        }`}>
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#0056d2] uppercase tracking-wider">
            {isPinValid ? <Unlock className="w-4 h-4 text-[#34a853]" /> : <Lock className="w-4 h-4" />}
            <span>VALIDACIÓN PIN OTP DE 4 DÍGITOS</span>
          </div>

          <input 
            type="text" 
            maxLength={4}
            disabled={!geofence.isAllowed}
            value={pinCode}
            onChange={(e) => {
              setPinCode(e.target.value)
              setPinError(null)
            }}
            placeholder="Dictado por cliente"
            className="w-52 mx-auto text-center font-mono font-black text-2xl tracking-widest bg-[#f6f3f2] border-2 border-[#0056d2] rounded-2xl py-2.5 outline-none focus:bg-white disabled:bg-slate-200"
          />

          {pinError && (
            <p className="text-xs font-bold text-[#ba1a1a] animate-shake">{pinError}</p>
          )}

          {isPinValid ? (
            <p className="text-xs font-black text-[#34a853] flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> PIN Válido y Confirmado
            </p>
          ) : (
            <p className="text-[10px] font-semibold text-[#737785]">
              {geofence.isAllowed 
                ? 'Pide el código de 4 dígitos que el cliente ve en su pantalla.'
                : 'Acércate al domicilio a menos de 30m para poder ingresar el PIN.'}
            </p>
          )}
        </div>

        {/* Botón Finalizar Viaje */}
        {completed ? (
          <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-full text-center font-black text-xs flex items-center justify-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <span>¡ENTREGA EXITOSA! $65.00 REGISTRADOS EN BILLETERA</span>
          </div>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!canSubmit}
            className={`w-full py-4 rounded-full font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all ${
              canSubmit
                ? 'bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-5 h-5" />
            <span>FINALIZAR ENTREGA Y COBRAR $65.00</span>
          </button>
        )}

        {/* Modal: Calificación Rápida al Cliente (M12) */}
        {showCustomerRating && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-[#e5e2e1] animate-fade-in">
              <div className="w-14 h-14 bg-[#c3f400] text-[#161e00] rounded-full flex items-center justify-center mx-auto shadow-md">
                <ThumbsUp className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">¿Cómo fue tu experiencia con el cliente?</h3>
                <p className="text-xs font-semibold text-slate-500">Cliente: María G. • #V-9042</p>
              </div>

              <div className="flex justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleDriverRatingSubmit(star, 'Cliente Excelente')}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star className="w-8 h-8 text-[#fddf33] fill-[#fddf33]" />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleDriverRatingSubmit(5, 'Puntual en entrega')}
                  className="bg-[#f6f3f2] hover:bg-[#c3f400] hover:text-[#161e00] text-slate-700 py-2.5 px-3 rounded-xl text-xs font-black transition-all"
                >
                  ⚡ Puntual
                </button>
                <button
                  onClick={() => handleDriverRatingSubmit(5, 'Pago exacto')}
                  className="bg-[#f6f3f2] hover:bg-[#c3f400] hover:text-[#161e00] text-slate-700 py-2.5 px-3 rounded-xl text-xs font-black transition-all"
                >
                  💵 Pago Exacto
                </button>
                <button
                  onClick={() => handleDriverRatingSubmit(5, 'Muy amable')}
                  className="bg-[#f6f3f2] hover:bg-[#c3f400] hover:text-[#161e00] text-slate-700 py-2.5 px-3 rounded-xl text-xs font-black transition-all"
                >
                  😊 Muy Amable
                </button>
                <button
                  onClick={() => handleDriverRatingSubmit(5, 'Buena comunicación')}
                  className="bg-[#f6f3f2] hover:bg-[#c3f400] hover:text-[#161e00] text-slate-700 py-2.5 px-3 rounded-xl text-xs font-black transition-all"
                >
                  💬 Buena Comunicación
                </button>
              </div>

              <button
                onClick={() => router.push('/driver/home')}
                className="w-full bg-[#161e00] text-white py-3 rounded-full text-xs font-black mt-2"
              >
                Omitir y Volver al Mapa
              </button>
            </div>
          </div>
        )}

      </div>
    </MobileDriverLayout>
  )
}

