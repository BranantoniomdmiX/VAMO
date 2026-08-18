export interface AgentAction {
  agentName: string
  timestamp: string
  triggerReason: string
  actionTaken: string
  targetEntityId: string
  status: 'PENDING' | 'EXECUTED' | 'RECURSING' | 'RESOLVED'
  recursionDepth: number
}

export interface AgentState {
  orderId: string
  driverId?: string
  merchantId?: string
  status: string
  elapsedMinutes: number
  driverMovedMeters: number
  slaThresholdMinutes: number
  recursionCount: number
}

export class VamoAgentEngine {
  private static instance: VamoAgentEngine
  private logs: AgentAction[] = []

  private constructor() {}

  public static getInstance(): VamoAgentEngine {
    if (!VamoAgentEngine.instance) {
      VamoAgentEngine.instance = new VamoAgentEngine()
    }
    return VamoAgentEngine.instance
  }

  // Bucle Recursivo Autónomo de Despacho e Incidencias
  public evaluateDispatchRecursion(state: AgentState): AgentAction {
    const depth = state.recursionCount + 1

    // Caso 1: Chofer asignado pero sin desplazamiento en 2+ minutos (Retardo inicial)
    if (state.status === 'ASSIGNED' && state.elapsedMinutes >= 2 && state.driverMovedMeters < 50 && depth === 1) {
      const action: AgentAction = {
        agentName: 'VAMO-Dispatcher-AI',
        timestamp: new Date().toLocaleTimeString(),
        triggerReason: `Chofer no se ha movido en ${state.elapsedMinutes} min (${state.driverMovedMeters}m recorridos)`,
        actionTaken: 'Enviando Alerta Audible de Presión y Notificación Push de Confirmación',
        targetEntityId: state.driverId || 'MOTO-01',
        status: 'RECURSING',
        recursionDepth: depth
      }
      this.logs.unshift(action)
      return action
    }

    // Caso 2: El chofer sigue inactivo tras la primera alerta (Recursión Nivel 2: Desasignación y Re-despacho Autónomo)
    if (state.status === 'ASSIGNED' && state.elapsedMinutes >= 3 && state.driverMovedMeters < 50 && depth >= 2) {
      const action: AgentAction = {
        agentName: 'VAMO-Dispatcher-AI',
        timestamp: new Date().toLocaleTimeString(),
        triggerReason: `Incumplimiento de salida del Chofer. Auto-corrección requerida (Profundidad ${depth})`,
        actionTaken: 'Desasignando Chofer Inactivo y Reasignando Autónomamente al Chofer Flotante Cercano',
        targetEntityId: state.orderId,
        status: 'RESOLVED',
        recursionDepth: depth
      }
      this.logs.unshift(action)
      return action
    }

    // Caso 3: Cocina con cuello de botella (Retardo > 15 min en KDS)
    if (state.status === 'PREPARING' && state.elapsedMinutes > 15) {
      const action: AgentAction = {
        agentName: 'VAMO-KDS-AI',
        timestamp: new Date().toLocaleTimeString(),
        triggerReason: `Retardo de Cocina excede SLA (${state.elapsedMinutes} min en KDS)`,
        actionTaken: 'Ajustando tiempo estimado de entrega (+10m) en App Cliente y retrasando salida de Moto',
        targetEntityId: state.orderId,
        status: 'RESOLVED',
        recursionDepth: depth
      }
      this.logs.unshift(action)
      return action
    }

    // Estado normal
    const defaultAction: AgentAction = {
      agentName: 'VAMO-Supervisor-AI',
      timestamp: new Date().toLocaleTimeString(),
      triggerReason: 'Estado de operación óptimo',
      actionTaken: 'Monitoreando telemetría de GPS y SLA en segundo plano',
      targetEntityId: state.orderId,
      status: 'EXECUTED',
      recursionDepth: 0
    }
    return defaultAction
  }

  public getRecentLogs(): AgentAction[] {
    return this.logs
  }
}

export const agentEngine = VamoAgentEngine.getInstance()
