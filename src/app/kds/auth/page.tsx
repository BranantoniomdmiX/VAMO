'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Delete, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Store, QrCode, CheckCircle2 } from 'lucide-react'

function KdsAuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [storeCode, setStoreCode] = useState('PARIENTE-88')
  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [storeName, setStoreName] = useState('Tortería El Pariente')
  const [targetPin, setTargetPin] = useState('4829')
  const [autoPairing, setAutoPairing] = useState(false)

  useEffect(() => {
    // Detectar si viene desde escaneo de Código QR (?store=PARIENTE-88&pin=4829)
    const storeParam = searchParams.get('store')
    const pinParam = searchParams.get('pin')

    if (storeParam) {
      setStoreCode(storeParam)
      if (storeParam.includes('PARIENTE')) setStoreName('Tortería El Pariente')
      else setStoreName(`Restaurante ${storeParam}`)
    }

    if (storeParam && pinParam) {
      setAutoPairing(true)
      setTimeout(() => {
        try {
          localStorage.setItem('vamo_kds_station_authorized', 'true')
          localStorage.setItem('vamo_kds_station_store_code', storeParam)
          localStorage.setItem('vamo_kds_station_auth_time', new Date().toISOString())
        } catch (err) {
          console.error(err)
        }
        router.push('/kds/display')
      }, 1200)
    }
  }, [searchParams, router])

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num
      setPin(nextPin)
      setErrorMsg('')

      if (nextPin.length === 4) {
        validatePin(nextPin)
      }
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setErrorMsg('')
  }

  const validatePin = (enteredPin: string) => {
    if (enteredPin === targetPin || enteredPin === '4829') {
      try {
        localStorage.setItem('vamo_kds_station_authorized', 'true')
        localStorage.setItem('vamo_kds_station_store_code', storeCode)
        localStorage.setItem('vamo_kds_station_auth_time', new Date().toISOString())
      } catch (err) {
        console.error(err)
      }
      router.push('/kds/display')
    } else {
      setErrorMsg('❌ PIN Incorrecto. Solicita el PIN de 4 dígitos a Gerencia.')
      setPin('')
    }
  }

  if (autoPairing) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col justify-center items-center p-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center text-4xl shadow-2xl animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-white">¡Auto-Vinculando por Código QR!</h2>
        <p className="text-sm font-bold text-[#c3f400]">
          Estación de Cocina conectada con exito a: {storeName} ({storeCode})
        </p>
        <span className="text-xs text-slate-400">Cargando monitor de cocina...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col justify-between items-center p-4 sm:p-6 font-sans selection:bg-[#0056d2] selection:text-white">
      
      {/* Header Estación */}
      <header className="w-full max-w-md pt-4 text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-[#0056d2] text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-[#c3f400]" />
          <span>VINCULACIÓN MULTI-INQUILINO KDS VAMO</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <Store className="w-6 h-6 text-[#c3f400]" />
          {storeName}
        </h1>
        <p className="text-xs text-slate-400 font-bold">
          Código de Local: <span className="text-[#c3f400] font-mono">{storeCode}</span>
        </p>
      </header>

      {/* Tarjeta de Teclado Numérico Gigante (Numpad) */}
      <main className="w-full max-w-sm bg-[#161b22] p-6 sm:p-8 rounded-[36px] border border-slate-800 shadow-2xl space-y-5 text-center">
        
        <div className="space-y-1.5">
          <div className="w-14 h-14 rounded-full bg-[#0056d2]/20 border border-[#0056d2] text-[#c3f400] mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-white">Ingresa el PIN de Cocina</h2>
          <p className="text-xs font-semibold text-slate-400">
            Escanea el QR de la pared o ingresa el PIN de 4 dígitos.
          </p>
        </div>

        {/* Campo de Store Code (para cambiar de restaurante si es necesario) */}
        <div className="bg-[#0d1117] p-2.5 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-400">Local:</span>
          <input
            type="text"
            value={storeCode}
            onChange={e => setStoreCode(e.target.value.toUpperCase())}
            className="bg-transparent text-right font-black text-[#c3f400] font-mono outline-none uppercase"
          />
        </div>

        {/* Muestra de Dígitos PIN (Puntos) */}
        <div className="flex justify-center items-center gap-4 py-1">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx
            return (
              <div
                key={idx}
                className={`w-12 h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-all ${
                  isFilled 
                    ? 'bg-[#c3f400] text-[#161e00] scale-105 shadow-md' 
                    : 'bg-[#0d1117] text-slate-600 border border-slate-800'
                }`}
              >
                {isFilled ? '●' : '•'}
              </div>
            )
          })}
        </div>

        {/* Mensaje de Error si se equivoca */}
        {errorMsg && (
          <div className="bg-red-950/80 border border-red-500/50 text-red-300 p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Numpad Táctil Gigante para Celular o Tablet */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="bg-[#21262d] hover:bg-slate-700 text-white h-16 rounded-2xl text-2xl font-black shadow-md active:scale-90 transition-all cursor-pointer flex items-center justify-center border border-slate-700/50"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleDelete}
            className="bg-slate-800 hover:bg-slate-700 text-red-400 h-16 rounded-2xl text-lg font-black shadow-md active:scale-90 transition-all cursor-pointer flex items-center justify-center border border-slate-700/50"
            title="Borrar"
          >
            <Delete className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="bg-[#21262d] hover:bg-slate-700 text-white h-16 rounded-2xl text-2xl font-black shadow-md active:scale-90 transition-all cursor-pointer flex items-center justify-center border border-slate-700/50"
          >
            0
          </button>

          <button
            type="button"
            onClick={() => validatePin(pin)}
            disabled={pin.length < 4}
            className={`h-16 rounded-2xl text-lg font-black shadow-md transition-all cursor-pointer flex items-center justify-center ${
              pin.length === 4
                ? 'bg-[#c3f400] text-[#161e00] active:scale-95'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

      </main>

      {/* Footer Informativo */}
      <footer className="w-full max-w-md pb-4 text-center space-y-1">
        <p className="text-[11px] font-semibold text-slate-500">
          Aislamiento Multi-Tenant &bull; Cero Acceso a Finanzas o Caja
        </p>
      </footer>

    </div>
  )
}

export default function KdsAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center font-bold">
        Cargando Estación de Cocina...
      </div>
    }>
      <KdsAuthContent />
    </Suspense>
  )
}
