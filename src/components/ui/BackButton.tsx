'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  label?: string
  fallbackRoute?: string
}

export function BackButton({ label = 'Regresar', fallbackRoute }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else if (fallbackRoute) {
      router.push(fallbackRoute)
    } else {
      router.push('/')
    }
  }

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-[#0056d2] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm border border-[#e5e2e1] active:scale-95 transition-all"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  )
}
