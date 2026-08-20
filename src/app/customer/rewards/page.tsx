'use client'

import React, { useState } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Gift, Award, Star, CheckCircle2, ChevronRight, Sparkles, Tag, ShieldCheck, ArrowRight } from 'lucide-react'
import { REWARD_CATALOG, RewardBranch, RewardsService } from '@/lib/services/rewardsService'

export default function RewardsPage() {
  const [selectedBranch, setSelectedBranch] = useState<RewardBranch>('CLUB')
  const [userPoints, setUserPoints] = useState<number>(380)
  const [redeemedToast, setRedeemedToast] = useState<string | null>(null)

  const currentRewards = RewardsService.getRewardsByBranch(selectedBranch)

  const handleRedeem = async (rewardId: string) => {
    const result = await RewardsService.redeemReward(rewardId, 'user-1', userPoints)
    if (result.success) {
      setUserPoints(result.remainingPoints)
      setRedeemedToast(result.message)
      setTimeout(() => setRedeemedToast(null), 5000)
    } else {
      alert(result.message)
    }
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Hero VAMO Rewards */}
        <div className="bg-[#0040a1] text-white p-6 sm:p-8 rounded-[32px] border border-blue-800 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 z-10">
            <span className="bg-[#c3f400] text-[#161e00] text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider inline-block">
              PROGRAMA DE FIDELIZACIÓN OFICIAL (DOC 19 §58)
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white">VAMO Rewards 🎁</h1>
            <p className="text-xs sm:text-sm text-blue-200 font-semibold max-w-md">
              Gana puntos por cada viaje, pedido y referido. Canjéalos por fletes gratis, mantenimiento de moto y beneficios exclusivos.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center sm:text-right shrink-0 z-10 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase text-blue-200 block">TUS PUNTOS ACUMULADOS</span>
            <p className="text-4xl font-black text-[#c3f400] tracking-tight">{userPoints} <span className="text-lg text-white">PTS</span></p>
            <span className="text-[10px] font-bold text-white/80">Equivale a ~$85.00 MXN en beneficios</span>
          </div>

          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Toast de Éxito al Canjear */}
        {redeemedToast && (
          <div className="bg-[#c3f400] text-[#161e00] p-4 rounded-2xl border-2 border-[#abd600] font-black text-xs sm:text-sm flex items-center gap-2 animate-bounce shadow-md">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{redeemedToast}</span>
          </div>
        )}

        {/* Selector de las 4 Ramas Maestras de Rewards */}
        <div className="flex bg-[#f0eded] p-1.5 rounded-full text-xs font-black border border-slate-200 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setSelectedBranch('CLUB')}
            className={`flex-1 py-3 px-4 rounded-full transition-all whitespace-nowrap ${
              selectedBranch === 'CLUB' ? 'bg-[#0056d2] text-white shadow-sm' : 'text-[#737785] hover:text-slate-900'
            }`}
          >
            🍔 VAMO Club (Clientes)
          </button>
          <button
            onClick={() => setSelectedBranch('SOCIO')}
            className={`flex-1 py-3 px-4 rounded-full transition-all whitespace-nowrap ${
              selectedBranch === 'SOCIO' ? 'bg-[#161e00] text-[#c3f400] shadow-sm' : 'text-[#737785] hover:text-slate-900'
            }`}
          >
            🏍️ VAMO Socio (Repartidores)
          </button>
          <button
            onClick={() => setSelectedBranch('NEGOCIO')}
            className={`flex-1 py-3 px-4 rounded-full transition-all whitespace-nowrap ${
              selectedBranch === 'NEGOCIO' ? 'bg-[#ff5722] text-white shadow-sm' : 'text-[#737785] hover:text-slate-900'
            }`}
          >
            🏪 VAMO Negocio (Comercios)
          </button>
          <button
            onClick={() => setSelectedBranch('PARTNER')}
            className={`flex-1 py-3 px-4 rounded-full transition-all whitespace-nowrap ${
              selectedBranch === 'PARTNER' ? 'bg-[#726200] text-[#fddf33] shadow-sm' : 'text-[#737785] hover:text-slate-900'
            }`}
          >
            💼 VAMO Partner (Franquicias)
          </button>
        </div>

        {/* Catálogo de Recompensas Filtrado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {currentRewards.map(reward => {
            const canAfford = userPoints >= reward.pointsCost

            return (
              <div 
                key={reward.id}
                className="bg-white p-5 rounded-[28px] border border-[#e5e2e1] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#0056d2] transition-all"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="bg-[#f0eded] text-[#1c1b1b] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                      {reward.badge}
                    </span>
                    <span className="bg-[#0056d2] text-white font-mono font-black text-xs px-3 py-1 rounded-full shadow-xs">
                      {reward.pointsCost} PTS
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[#1c1b1b] leading-snug">{reward.title}</h3>
                  <p className="text-xs font-semibold text-[#737785] leading-relaxed">{reward.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Patrocinado por:</span>
                    <strong className="text-xs font-bold text-slate-800">{reward.sponsor}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRedeem(reward.id)}
                    className={`px-4 py-2 rounded-full text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer ${
                      canAfford 
                        ? 'bg-[#c3f400] hover:bg-[#abd600] text-[#161e00]' 
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {canAfford ? 'CANJEAR AHORA ⚡' : `Faltan ${reward.pointsCost - userPoints} pts`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Banner Informativo de Cómo Ganar Más Puntos (Doc 19 §59) */}
        <div className="bg-[#161e00] text-white p-6 rounded-[28px] border border-[#c3f400]/40 space-y-3">
          <h3 className="text-base font-black text-[#c3f400] uppercase tracking-wider">¿Cómo acumular más Puntos VAMO?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <span className="text-[#c3f400] text-sm block font-black">+10 PTS</span>
              <p className="text-slate-300 font-semibold mt-0.5">Por cada entrega o viaje exitoso</p>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <span className="text-[#c3f400] text-sm block font-black">+5 PTS</span>
              <p className="text-slate-300 font-semibold mt-0.5">Entregas en horas pico de alta demanda</p>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <span className="text-[#c3f400] text-sm block font-black">+30 PTS</span>
              <p className="text-slate-300 font-semibold mt-0.5">Por cada nuevo amigo o negocio referido</p>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <span className="text-[#c3f400] text-sm block font-black">+20 PTS</span>
              <p className="text-slate-300 font-semibold mt-0.5">Por completar cursos en VAMO Academy</p>
            </div>
          </div>
        </div>

      </div>
    </CustomerLayout>
  )
}
