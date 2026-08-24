'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { 
  Star, Heart, DollarSign, CheckCircle2, 
  ArrowRight, ThumbsUp, Sparkles, MessageSquare, Loader2
} from 'lucide-react'
import { RatingService } from '@/lib/services/ratingService'

interface RatingPageProps {
  params: Promise<{ orderCode: string }>
}

export default function CustomerRatingPage({ params }: RatingPageProps) {
  const router = useRouter()
  const [orderCode, setOrderCode] = useState<string>('V-9042')
  const [stars, setStars] = useState<number>(5)
  const [selectedTags, setSelectedTags] = useState<string[]>(['⚡ Súper rápido', '🎒 Paquete intacto'])
  const [selectedTip, setSelectedTip] = useState<number>(20)
  const [comment, setComment] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    params.then(p => {
      if (p.orderCode) setOrderCode(p.orderCode)
    })
  }, [params])

  const availableTags = [
    '⚡ Súper rápido',
    '🎒 Paquete intacto',
    '😊 Muy amable',
    '🛵 Conducción segura',
    '📍 Llegó directo a la puerta',
    '💬 Buena comunicación'
  ]

  const tipOptions = [0, 10, 20, 50]

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await RatingService.submitRating({
      orderCode,
      raterRole: 'customer',
      ratedRole: 'driver',
      stars,
      tags: selectedTags,
      comment,
      tipAmount: selectedTip,
      ratedUserId: 'driver-carlos-1'
    })

    setIsSubmitting(false)
    setIsSuccess(true)

    setTimeout(() => {
      router.push('/customer/home')
    }, 2500)
  }

  return (
    <CustomerLayout>
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* Header */}
        <header className="text-center space-y-1">
          <span className="bg-[#c3f400] text-[#161e00] text-xs font-black px-3.5 py-1 rounded-full uppercase">
            PEDIDO ENTREGADO • #{orderCode}
          </span>
          <h1 className="text-2xl font-black text-slate-900">¿Cómo estuvo tu servicio?</h1>
          <p className="text-xs font-semibold text-slate-500">
            Tu opinión ayuda a mantener la máxima calidad y premia a los mejores motociclistas.
          </p>
        </header>

        {isSuccess ? (
          <div className="bg-[#161e00] text-white p-8 rounded-[32px] border-2 border-[#c3f400] text-center space-y-4 shadow-xl animate-fade-in">
            <div className="w-16 h-16 bg-[#c3f400] text-[#161e00] rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#c3f400]">¡Muchas Gracias!</h2>
              <p className="text-xs font-bold text-slate-300">
                Tu reseña ha sido registrada y sumaste <strong>+50 VAMO Coins</strong> a tu perfil.
              </p>
              {selectedTip > 0 && (
                <p className="text-sm font-black text-white bg-white/10 py-2 rounded-2xl mt-2">
                  💵 Propina de ${selectedTip}.00 MXN enviada a Carlos M.
                </p>
              )}
            </div>
            <p className="text-xs text-slate-400">Volviendo a inicio...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e2e1] shadow-xs space-y-6">
            
            {/* Foto del Conductor */}
            <div className="flex items-center gap-3 bg-[#f6f3f2] p-3.5 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                CM
              </div>
              <div className="min-w-0">
                <strong className="text-sm font-black text-slate-900 block truncate">Carlos M.</strong>
                <span className="text-xs font-semibold text-slate-500">Motociclista Socio VAMO • Nivel Oro</span>
              </div>
            </div>

            {/* Estrellas Interactivas */}
            <div className="text-center space-y-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">Calificación</span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setStars(starVal)}
                    className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95"
                  >
                    <Star
                      className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                        starVal <= stars
                          ? 'text-[#fddf33] fill-[#fddf33] drop-shadow-sm'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-black text-[#0056d2]">
                {stars === 5 && '🌟 ¡Excelente servicio impecable!'}
                {stars === 4 && '👍 Muy buen servicio'}
                {stars === 3 && '👌 Servicio promedio'}
                {stars <= 2 && '⚠️ Oportunidad de mejora'}
              </p>
            </div>

            {/* Chips de Felicitaciones / Tags */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide block">
                ¿Qué te gustó más?
              </span>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`text-xs font-bold px-3.5 py-2 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0056d2] text-white border-[#0056d2] shadow-xs'
                          : 'bg-[#f6f3f2] text-slate-700 border-[#e5e2e1] hover:border-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Propina Exprés */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide block">
                Dejar una propina voluntaria al repartidor
              </span>
              <div className="grid grid-cols-4 gap-2">
                {tipOptions.map((tip) => (
                  <button
                    key={tip}
                    type="button"
                    onClick={() => setSelectedTip(tip)}
                    className={`py-2.5 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                      selectedTip === tip
                        ? 'bg-[#c3f400] text-[#161e00] border-[#161e00] shadow-xs scale-105'
                        : 'bg-[#f6f3f2] text-slate-700 border-[#e5e2e1] hover:border-slate-300'
                    }`}
                  >
                    {tip === 0 ? 'Sin propina' : `$${tip} MXN`}
                  </button>
                ))}
              </div>
            </div>

            {/* Comentario Opcional */}
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 uppercase">Mensaje para el conductor (opcional)</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Ej. ¡Llegó rapidísimo y la comida venía bien caliente!"
                rows={2}
                className="w-full bg-[#f6f3f2] border border-[#e5e2e1] focus:border-[#0056d2] rounded-2xl p-3.5 text-xs font-bold outline-none resize-none"
              />
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-4 rounded-full font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ENVIANDO CALIFICACIÓN...</span>
                </>
              ) : (
                <>
                  <span>ENVIAR RESEÑA Y GANAR PUNTOS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        )}

      </div>
    </CustomerLayout>
  )
}
