'use client'

import dynamic from 'next/dynamic'
import { DriverMarkerData, MapWaypoint } from './VamoMapLibre'

const VamoMapLibre = dynamic(() => import('./VamoMapLibre'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-slate-900 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-medium">
      🗺️ Cargando Mapa Vectorial VAMO...
    </div>
  )
})

interface VamoMapProps {
  center?: [number, number]
  zoom?: number
  theme?: 'light' | 'dark'
  mode3D?: boolean
  pitch?: number
  bearing?: number
  drivers?: DriverMarkerData[]
  waypoints?: MapWaypoint[]
  routeCoordinates?: [number, number][]
  className?: string
  onToggle3D?: (is3D: boolean) => void
}

export default function VamoMap(props: VamoMapProps) {
  return <VamoMapLibre {...props} />
}
