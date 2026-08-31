'use client'

import React from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { CreditCard, Check, Plus, Edit, Sparkles, Users, Store, Bike, DollarSign, X } from 'lucide-react'

export default function AdminPlansPage() {
  const [plans, setPlans] = React.useState([
    {
      id: 1,
      type: 'PER_DRIVER',
      name: 'Plan Cobro por Conductor (Negociado)',
      price: 'Precio Negociado / Chofer',
      desc: 'Cobro semanal o mensual basado exactamente en la cantidad de motociclistas contratados en la flota del dueño.',
      badge: 'FLOTILLA FLEXIBLE',
      badgeBg: 'bg-[#c3f400] text-[#161e00]',
      features: ['Conteo automático de choferes activos', 'Tarifa por chofer negociada directamente', 'Sin límite de crecimiento de flota', 'Acceso completo a Base Despacho']
    },
    {
      id: 2,
      type: 'FIXED_FLEET',
      name: 'Plan Mensualidad Fija Flotilla',
      price: '$3,999 MXN / mes',
      desc: 'Mensualidad fija recurrente para dueños de flota con choferes ilimitados y soporte prioritario.',
      badge: 'FLOTILLA PRO',
      badgeBg: 'bg-[#0056d2] text-white',
      features: ['Mensualidad plana predecible', 'Múltiples bases operativas', 'Auditoría financiera y caja 360°', 'API de integración VPS']
    },
    {
      id: 3,
      type: 'MERCHANT_RADAR',
      name: 'Suscripción Radar para Comercios & Cadenas',
      price: '$899 MXN / mes (o $49/chofer encargo)',
      desc: 'Para restaurantes, farmacias, refaccionarias o negocios que desean aparecer en el Radar Urbano con o sin convenio logístico.',
      badge: 'RADAR AFILIADO',
      badgeBg: 'bg-[#fddf33] text-[#726200]',
      features: ['Visibilidad en el Mapa Radar de Clientes', 'Publicación de Menú & Catálogo', 'Auto-despacho de repartidores VAMO', 'Herramienta de Pedidos B2B entre Locales']
    }
  ])

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [newPlanName, setNewPlanName] = React.useState('')
  const [newPlanType, setNewPlanType] = React.useState('PER_DRIVER')
  const [newPlanPrice, setNewPlanPrice] = React.useState('')
  const [newPlanDesc, setNewPlanDesc] = React.useState('')

  const [editingPlan, setEditingPlan] = React.useState<{
    id: number
    type: string
    name: string
    price: string
    desc: string
    badge: string
    badgeBg: string
    features: string[]
  } | null>(null)

  const handleEditClick = (plan: typeof plans[0]) => {
    setEditingPlan({ ...plan })
  }

  const handleSaveEditedPlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlan) return

    setPlans(prev => prev.map(p => p.id === editingPlan.id ? editingPlan : p))
    setEditingPlan(null)
  }

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlanName || !newPlanPrice) return

    const newPlan = {
      id: Date.now(),
      type: newPlanType,
      name: newPlanName,
      price: newPlanPrice,
      desc: newPlanDesc || 'Plan personalizado configurado por Superadmin.',
      badge: newPlanType === 'PER_DRIVER' ? 'POR CHOFER' : newPlanType === 'MERCHANT_RADAR' ? 'RADAR LOCAL' : 'FLOTILLA',
      badgeBg: 'bg-[#c3f400] text-[#161e00]',
      features: ['Configuración personalizada activa', 'Suscripción administrada por SuperAdmin', 'Soporte VAMO Master']
    }

    setPlans([...plans, newPlan])
    setIsModalOpen(false)
    setNewPlanName('')
    setNewPlanPrice('')
    setNewPlanDesc('')
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab={'new-fleet' as any} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Planes de Suscripción SaaS VAMO</h1>
            <p className="text-xs text-[#737785] font-semibold">Configuración de paquetes por chofer negociado, flotillas y presencia de comercios en el Radar</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#0056d2] hover:bg-[#0040a1] text-white px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nuevo Plan</span>
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-[32px] border border-[#e5e2e1] shadow-sm space-y-5 flex flex-col justify-between hover:shadow-md transition-all">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${p.badgeBg}`}>
                      {p.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-[#1c1b1b] leading-snug">{p.name}</h3>
                    <p className="text-xl font-black text-[#0056d2] mt-1">{p.price}</p>
                    <p className="text-xs font-semibold text-[#737785] mt-2">{p.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-[#f0eded] space-y-2">
                    <span className="text-[10px] font-black text-[#737785] uppercase tracking-wider block">INCLUYE EN PLATAFORMA:</span>
                    {p.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs font-bold text-[#1c1b1b]">
                        <Check className="w-3.5 h-3.5 text-[#0056d2] shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => handleEditClick(p)}
                  className="w-full bg-[#1c1b1b] hover:bg-black text-[#c3f400] py-3 rounded-full font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar Plan / Tarifas</span>
                </button>
              </div>
            ))}
          </div>
        </main>

        {/* Modal Interactivo de Edición Real de Plan & Tarifas */}
        {editingPlan && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in border border-[#e5e2e1]">
              <div className="flex justify-between items-center border-b border-[#f0eded] pb-3">
                <div>
                  <span className="text-[10px] font-black text-[#0056d2] uppercase tracking-wider block">MODO EDICIÓN</span>
                  <h3 className="text-lg font-extrabold text-[#1c1b1b]">Editar Plan & Tarifas</h3>
                </div>
                <button onClick={() => setEditingPlan(null)} className="p-1 rounded-full bg-[#f0eded] hover:bg-[#e5e2e1]">
                  <X className="w-5 h-5 text-[#1c1b1b]" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedPlan} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#737785]">Nombre del Plan</label>
                  <input 
                    type="text"
                    value={editingPlan.name}
                    onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#0056d2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#737785]">Tarifa / Estructura de Cobro</label>
                  <input 
                    type="text"
                    value={editingPlan.price}
                    onChange={e => setEditingPlan({ ...editingPlan, price: e.target.value })}
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#0056d2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#737785]">Descripción de Beneficios / Negociación</label>
                  <textarea 
                    value={editingPlan.desc}
                    onChange={e => setEditingPlan({ ...editingPlan, desc: e.target.value })}
                    rows={3}
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none resize-none focus:border-[#0056d2]"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3 rounded-full font-black text-xs shadow-md active:scale-95 transition-all"
                >
                  GUARDAR CAMBIOS DE PLAN
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Creación de Nuevo Plan */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in border border-[#e5e2e1]">
              <div className="flex justify-between items-center border-b border-[#f0eded] pb-3">
                <h3 className="text-lg font-extrabold text-[#1c1b1b]">Crear Nuevo Plan SaaS VAMO</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full bg-[#f0eded] hover:bg-[#e5e2e1]">
                  <X className="w-5 h-5 text-[#1c1b1b]" />
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#737785]">Tipo de Cobro</label>
                  <select 
                    value={newPlanType} 
                    onChange={e => setNewPlanType(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                  >
                    <option value="PER_DRIVER">🏍️ Por Conductor (Negociado por Chofer)</option>
                    <option value="FIXED_FLEET">🏢 Por Mensualidad de Flotilla Fija</option>
                    <option value="MERCHANT_RADAR">🏪 Por Suscripción de Comercio en Radar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#737785]">Nombre del Plan</label>
                  <input 
                    type="text"
                    value={newPlanName}
                    onChange={e => setNewPlanName(e.target.value)}
                    placeholder="Ej. Plan Personalizado Flota Bajío"
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#737785]">Precio / Formato de Cobro</label>
                  <input 
                    type="text"
                    value={newPlanPrice}
                    onChange={e => setNewPlanPrice(e.target.value)}
                    placeholder="Ej. $150 MXN / chofer / mes  o  $1,200 / mes"
                    required
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#737785]">Descripción / Reglas de Negocio</label>
                  <textarea 
                    value={newPlanDesc}
                    onChange={e => setNewPlanDesc(e.target.value)}
                    placeholder="Detalla las condiciones negociadas o los beneficios..."
                    rows={3}
                    className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-2xl px-4 py-2.5 text-xs font-bold outline-none resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#0056d2] hover:bg-[#0040a1] text-white py-3 rounded-full font-black text-xs shadow-md active:scale-95 transition-all"
                >
                  GUARDAR Y ACTIVAR PLAN
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
