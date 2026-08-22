'use client'

import React, { useState } from 'react'
import { SidebarAdmin } from '@/components/layout/SidebarAdmin'
import { 
  Inbox, 
  Bike, 
  Store, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Phone, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Eye,
  Filter
} from 'lucide-react'

interface DriverRequest {
  id: string
  name: string
  phone: string
  email: string
  licenseNumber: string
  city: string
  vehicleType: string
  submittedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface MerchantRequest {
  id: string
  storeName: string
  category: string
  ownerName: string
  phone: string
  email: string
  address: string
  city: string
  submittedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface FleetPartnerRequest {
  id: string
  companyName: string
  contactName: string
  phone: string
  email: string
  city: string
  estimatedBikes: number
  submittedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export default function AdminRequestsPage() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'merchants' | 'fleets'>('drivers')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Datos de ejemplo interactivos
  const [driverRequests, setDriverRequests] = useState<DriverRequest[]>([
    {
      id: 'REQ-DRV-001',
      name: 'Alejandro Morales G.',
      phone: '461-234-5678',
      email: 'ale.morales@gmail.com',
      licenseNumber: 'LIC-GTO-8842',
      city: 'Celaya, GTO',
      vehicleType: 'Italika 150cc (Parrilla Carga)',
      submittedAt: 'Hace 15 min',
      status: 'PENDING'
    },
    {
      id: 'REQ-DRV-002',
      name: 'Héctor Daniel Rojas',
      phone: '461-987-6543',
      email: 'hector.rojas@hotmail.com',
      licenseNumber: 'LIC-QRO-1092',
      city: 'Querétaro, QRO',
      vehicleType: 'Honda Cargo 125',
      submittedAt: 'Hace 2 horas',
      status: 'PENDING'
    },
    {
      id: 'REQ-DRV-003',
      name: 'Mario Alberto Silva',
      phone: '461-555-1122',
      email: 'mario.silva@yahoo.com',
      licenseNumber: 'LIC-GTO-3319',
      city: 'Celaya, GTO',
      vehicleType: 'Yamaha YBR 125',
      submittedAt: 'Ayer',
      status: 'APPROVED'
    }
  ])

  const [merchantRequests, setMerchantRequests] = useState<MerchantRequest[]>([
    {
      id: 'REQ-MER-001',
      storeName: 'Taquería El Güero Central',
      category: 'Restaurante / Taquería',
      ownerName: 'Roberto Mendoza',
      phone: '461-444-8899',
      email: 'contacto@taqueriaelguero.mx',
      address: 'Av. Hidalgo #204, Zona Centro',
      city: 'Celaya, GTO',
      submittedAt: 'Hace 30 min',
      status: 'PENDING'
    },
    {
      id: 'REQ-MER-002',
      storeName: 'Farmacia San Juan (Matriz)',
      category: 'Farmacia & Salud',
      ownerName: 'Dra. Patricia Luna',
      phone: '461-333-2211',
      email: 'farmacia.sanjuan@gmail.com',
      address: 'Calle Morelos #88',
      city: 'Celaya, GTO',
      submittedAt: 'Hace 3 horas',
      status: 'PENDING'
    }
  ])

  const [fleetRequests, setFleetRequests] = useState<FleetPartnerRequest[]>([
    {
      id: 'REQ-FLT-001',
      companyName: 'Logística Rápida del Bajío S.A.',
      contactName: 'Lic. Fernando Garza',
      phone: '461-777-9900',
      email: 'fgarza@logbajio.com',
      city: 'Irapuato / Celaya',
      estimatedBikes: 25,
      submittedAt: 'Hace 5 horas',
      status: 'PENDING'
    }
  ])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleUpdateDriverStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setDriverRequests(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
    showToast(newStatus === 'APPROVED' ? `¡Conductor ${id} Aprobado y Activado!` : `Solicitud ${id} Rechazada`)
  }

  const handleUpdateMerchantStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setMerchantRequests(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m))
    showToast(newStatus === 'APPROVED' ? `¡Comercio ${id} Aprobado y dado de alta en Radar!` : `Solicitud ${id} Rechazada`)
  }

  const handleUpdateFleetStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setFleetRequests(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f))
    showToast(newStatus === 'APPROVED' ? `¡Socio Operador ${id} Aprobado!` : `Solicitud ${id} Rechazada`)
  }

  const pendingDriversCount = driverRequests.filter(d => d.status === 'PENDING').length
  const pendingMerchantsCount = merchantRequests.filter(m => m.status === 'PENDING').length
  const pendingFleetsCount = fleetRequests.filter(f => f.status === 'PENDING').length
  const totalPending = pendingDriversCount + pendingMerchantsCount + pendingFleetsCount

  return (
    <div className="min-h-screen bg-[#f5fff6] text-[#1c1b1b] flex flex-col md:flex-row font-sans selection:bg-[#0056d2] selection:text-white">
      <SidebarAdmin activeTab="requests" />

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Toast Notificación */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-[#1c1b1b] text-[#c3f400] px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-[#c3f400]/40 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-[#c3f400]" />
            <span>{toastMessage}</span>
          </div>
        )}

        <header className="bg-white border-b border-[#e5e2e1] px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b]">Bandeja de Solicitudes & KYC</h1>
              {totalPending > 0 && (
                <span className="bg-[#c3f400] text-[#161e00] px-2.5 py-0.5 rounded-full text-xs font-black">
                  {totalPending} Pendientes
                </span>
              )}
            </div>
            <p className="text-xs text-[#737785] font-semibold">
              Revisión y aprobación centralizada para Branmix (Cero correos basura)
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#f5fff6] p-1.5 rounded-2xl border border-[#e5e2e1]">
            <span className="text-[11px] font-bold text-[#0056d2] px-2">Filtrar:</span>
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  filterStatus === st 
                    ? 'bg-[#0056d2] text-white shadow-xs' 
                    : 'text-[#737785] hover:text-[#1c1b1b]'
                }`}
              >
                {st === 'ALL' ? 'Todos' : st === 'PENDING' ? 'Pendientes' : st === 'APPROVED' ? 'Aprobados' : 'Rechazados'}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Tabs Principales por Tipo de Solicitante */}
          <div className="grid grid-cols-3 gap-3 bg-white p-2 rounded-[24px] border border-[#e5e2e1] shadow-xs">
            <button
              onClick={() => setActiveTab('drivers')}
              className={`p-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'drivers'
                  ? 'bg-[#1c1b1b] text-[#c3f400] shadow-md'
                  : 'text-[#737785] hover:bg-[#f6f3f2]'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Conductores Independientes</span>
              {pendingDriversCount > 0 && (
                <span className="bg-[#c3f400] text-[#161e00] px-2 py-0.2 rounded-full text-[10px] font-black">
                  {pendingDriversCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('merchants')}
              className={`p-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'merchants'
                  ? 'bg-[#1c1b1b] text-[#c3f400] shadow-md'
                  : 'text-[#737785] hover:bg-[#f6f3f2]'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Comercios Afiliados</span>
              {pendingMerchantsCount > 0 && (
                <span className="bg-[#fddf33] text-[#726200] px-2 py-0.2 rounded-full text-[10px] font-black">
                  {pendingMerchantsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('fleets')}
              className={`p-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'fleets'
                  ? 'bg-[#1c1b1b] text-[#c3f400] shadow-md'
                  : 'text-[#737785] hover:bg-[#f6f3f2]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Socios Operadores (Flotas)</span>
              {pendingFleetsCount > 0 && (
                <span className="bg-[#0056d2] text-white px-2 py-0.2 rounded-full text-[10px] font-black">
                  {pendingFleetsCount}
                </span>
              )}
            </button>
          </div>

          {/* TAB: CONDUCTORES INDEPENDIENTES */}
          {activeTab === 'drivers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {driverRequests
                  .filter(d => filterStatus === 'ALL' || d.status === filterStatus)
                  .map(driver => (
                    <div key={driver.id} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black font-mono text-[#0056d2] bg-[#0056d2]/10 px-2.5 py-0.5 rounded-full">
                              {driver.id} &bull; {driver.submittedAt}
                            </span>
                            <h3 className="text-base font-extrabold text-[#1c1b1b] mt-1">{driver.name}</h3>
                            <p className="text-xs text-[#737785] font-semibold">{driver.city}</p>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                            driver.status === 'PENDING'
                              ? 'bg-[#fffde7] text-[#726200] border border-[#fddf33]'
                              : driver.status === 'APPROVED'
                              ? 'bg-[#f5fff6] text-[#161e00] border border-[#c3f400]'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {driver.status === 'PENDING' ? '⏳ Pendiente' : driver.status === 'APPROVED' ? '✅ Aprobado' : '❌ Rechazado'}
                          </span>
                        </div>

                        <div className="bg-[#f6f3f2] p-3.5 rounded-2xl text-xs space-y-1.5 font-semibold text-[#424654]">
                          <div className="flex justify-between">
                            <span className="text-[#737785]">WhatsApp:</span>
                            <a href={`https://wa.me/52${driver.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-[#0056d2] font-bold hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {driver.phone}
                            </a>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#737785]">Email:</span>
                            <span className="font-bold text-[#1c1b1b]">{driver.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#737785]">Licencia / Placas:</span>
                            <span className="font-mono font-bold text-[#0056d2]">{driver.licenseNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#737785]">Vehículo:</span>
                            <span className="font-bold text-[#1c1b1b]">{driver.vehicleType}</span>
                          </div>
                        </div>
                      </div>

                      {driver.status === 'PENDING' && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleUpdateDriverStatus(driver.id, 'APPROVED')}
                            className="bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Aprobar & Activar
                          </button>
                          <button
                            onClick={() => handleUpdateDriverStatus(driver.id, 'REJECTED')}
                            className="bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 border border-red-200 cursor-pointer active:scale-95"
                          >
                            <XCircle className="w-4 h-4" /> Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB: COMERCIOS */}
          {activeTab === 'merchants' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {merchantRequests
                  .filter(m => filterStatus === 'ALL' || m.status === filterStatus)
                  .map(merchant => (
                    <div key={merchant.id} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black font-mono text-[#726200] bg-[#fddf33]/20 px-2.5 py-0.5 rounded-full">
                              {merchant.id} &bull; {merchant.submittedAt}
                            </span>
                            <h3 className="text-base font-extrabold text-[#1c1b1b] mt-1">{merchant.storeName}</h3>
                            <p className="text-xs text-[#0056d2] font-bold">{merchant.category}</p>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                            merchant.status === 'PENDING'
                              ? 'bg-[#fffde7] text-[#726200] border border-[#fddf33]'
                              : merchant.status === 'APPROVED'
                              ? 'bg-[#f5fff6] text-[#161e00] border border-[#c3f400]'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {merchant.status === 'PENDING' ? '⏳ Pendiente' : merchant.status === 'APPROVED' ? '✅ Aprobado' : '❌ Rechazado'}
                          </span>
                        </div>

                        <div className="bg-[#f6f3f2] p-3.5 rounded-2xl text-xs space-y-1.5 font-semibold text-[#424654]">
                          <div className="flex justify-between">
                            <span className="text-[#737785]">Contacto / Dueño:</span>
                            <span className="font-bold text-[#1c1b1b]">{merchant.ownerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#737785]">WhatsApp:</span>
                            <a href={`https://wa.me/52${merchant.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-[#0056d2] font-bold hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {merchant.phone}
                            </a>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#737785]">Dirección:</span>
                            <span className="font-bold text-[#1c1b1b] truncate max-w-[200px]">{merchant.address}</span>
                          </div>
                        </div>
                      </div>

                      {merchant.status === 'PENDING' && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleUpdateMerchantStatus(merchant.id, 'APPROVED')}
                            className="bg-[#0056d2] hover:bg-[#0040a1] text-white py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#c3f400]" /> Publicar en Radar
                          </button>
                          <button
                            onClick={() => handleUpdateMerchantStatus(merchant.id, 'REJECTED')}
                            className="bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 border border-red-200 cursor-pointer active:scale-95"
                          >
                            <XCircle className="w-4 h-4" /> Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB: SOCIOS OPERADORES */}
          {activeTab === 'fleets' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fleetRequests
                  .filter(f => filterStatus === 'ALL' || f.status === filterStatus)
                  .map(fleet => (
                    <div key={fleet.id} className="bg-white p-6 rounded-[28px] border border-[#e5e2e1] shadow-xs space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black font-mono text-[#0056d2] bg-[#0056d2]/10 px-2.5 py-0.5 rounded-full">
                              {fleet.id} &bull; {fleet.submittedAt}
                            </span>
                            <h3 className="text-base font-extrabold text-[#1c1b1b] mt-1">{fleet.companyName}</h3>
                            <p className="text-xs text-[#737785] font-semibold">{fleet.city}</p>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                            fleet.status === 'PENDING'
                              ? 'bg-[#fffde7] text-[#726200] border border-[#fddf33]'
                              : fleet.status === 'APPROVED'
                              ? 'bg-[#f5fff6] text-[#161e00] border border-[#c3f400]'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {fleet.status === 'PENDING' ? '⏳ Pendiente' : fleet.status === 'APPROVED' ? '✅ Aprobado' : '❌ Rechazado'}
                          </span>
                        </div>

                        <div className="bg-[#f6f3f2] p-3.5 rounded-2xl text-xs space-y-1.5 font-semibold text-[#424654]">
                          <div className="flex justify-between">
                            <span className="text-[#737785]">Contacto:</span>
                            <span className="font-bold text-[#1c1b1b]">{fleet.contactName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#737785]">Teléfono:</span>
                            <span className="font-bold text-[#0056d2]">{fleet.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#737785]">Flota Estimada:</span>
                            <span className="font-bold text-[#1c1b1b]">{fleet.estimatedBikes} Motocicletas</span>
                          </div>
                        </div>
                      </div>

                      {fleet.status === 'PENDING' && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleUpdateFleetStatus(fleet.id, 'APPROVED')}
                            className="bg-[#1c1b1b] hover:bg-black text-[#c3f400] py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Dar de Alta Socio
                          </button>
                          <button
                            onClick={() => handleUpdateFleetStatus(fleet.id, 'REJECTED')}
                            className="bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 border border-red-200 cursor-pointer active:scale-95"
                          >
                            <XCircle className="w-4 h-4" /> Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}