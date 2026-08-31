'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
      <div className="flex items-center gap-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="w-5 h-5 border-2 border-[#0056d2] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-700">Entrando a VAMO SuperAdmin...</span>
      </div>
    </div>
  )
}
