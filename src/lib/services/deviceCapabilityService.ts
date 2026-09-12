/**
 * VAMO Device Capability Service & Registry
 * Architectural Principle: CAPABILITY FIRST
 * 
 * Centralized, standardized access to device hardware capabilities.
 * Implements Geolocation with high precision, stale detection,
 * debounce, duplicate watch prevention, and es-MX friendly UX messages.
 */

import {
  DeviceCapabilityKey,
  CapabilityStatus,
  CapabilityState,
  ErrorCategory,
  GeolocationWatchOptions,
  NormalizedGeolocationPosition,
  GeolocationRuntimeState
} from './deviceCapabilityTypes'

export class DeviceCapabilityService {
  private static instance: DeviceCapabilityService | null = null

  // Watch lifecycle tracking
  private activeWatchId: number | null = null
  private watchListeners: Set<(pos: NormalizedGeolocationPosition) => void> = new Set()
  private stateListeners: Set<(state: GeolocationRuntimeState, humanMessage: string) => void> = new Set()

  // Cached state
  private lastKnownPosition: NormalizedGeolocationPosition | null = null
  private currentRuntimeState: GeolocationRuntimeState = 'IDLE'
  private lastErrorMessage: string = ''

  // Project overrides
  public static readonly DEFAULT_STALE_THRESHOLD_MS = 15000 // 15s
  public static readonly DEFAULT_LOW_ACCURACY_THRESHOLD_METERS = 100 // 100m
  public static readonly DRIVER_TIMEOUT_MS = 12000 // 12s
  public static readonly CUSTOMER_TIMEOUT_MS = 8000 // 8s

  private constructor() {}

  public static getInstance(): DeviceCapabilityService {
    if (!DeviceCapabilityService.instance) {
      DeviceCapabilityService.instance = new DeviceCapabilityService()
    }
    return DeviceCapabilityService.instance
  }

  // ==========================================
  // Generic Capability Registry Query Methods
  // ==========================================

  public isSecureContext(): boolean {
    if (typeof window === 'undefined') return false
    return window.isSecureContext ?? (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  }

  public checkSupport(capability: DeviceCapabilityKey): boolean {
    if (typeof window === 'undefined') return false

    switch (capability) {
      case 'GEOLOCATION':
        return 'geolocation' in navigator
      case 'CAMERA':
      case 'MICROPHONE':
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
      case 'VIBRATION':
        return 'vibrate' in navigator
      case 'SHARE':
        return 'share' in navigator
      case 'NOTIFICATIONS':
        return 'Notification' in window
      case 'WAKE_LOCK':
        return 'wakeLock' in navigator
      case 'BLUETOOTH':
        return 'bluetooth' in navigator
      case 'NFC':
        return 'NDEFReader' in window
      default:
        return false
    }
  }

  public async checkPermission(capability: DeviceCapabilityKey): Promise<PermissionState | 'unsupported' | 'unknown'> {
    if (!this.checkSupport(capability)) return 'unsupported'
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) return 'unknown'

    try {
      if (capability === 'GEOLOCATION') {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        return status.state
      }
      return 'unknown'
    } catch {
      return 'unknown'
    }
  }

  public async getCapabilityStatus(capability: DeviceCapabilityKey): Promise<CapabilityStatus> {
    const isSupported = this.checkSupport(capability)
    if (!isSupported) {
      return {
        capability,
        isSupported: false,
        permissionState: 'unsupported',
        runtimeState: 'UNSUPPORTED',
        lastChecked: Date.now(),
        errorCategory: 'UNSUPPORTED',
        humanMessage: 'Esta función no es compatible con este navegador o dispositivo.'
      }
    }

    if (!this.isSecureContext()) {
      return {
        capability,
        isSupported: true,
        permissionState: 'unknown',
        runtimeState: 'ERROR',
        lastChecked: Date.now(),
        errorCategory: 'INSECURE_CONTEXT',
        humanMessage: 'Se requiere una conexión segura (HTTPS) para usar la ubicación.'
      }
    }

    const permission = await this.checkPermission(capability)
    return {
      capability,
      isSupported: true,
      permissionState: permission,
      runtimeState: capability === 'GEOLOCATION' ? this.currentRuntimeState : 'AVAILABLE',
      lastChecked: Date.now(),
      humanMessage: this.mapHumanMessage(this.currentRuntimeState)
    }
  }

  // ==========================================
  // Geolocation Specific Operations
  // ==========================================

  public getLastPosition(): NormalizedGeolocationPosition | null {
    if (!this.lastKnownPosition) return null

    // Evaluate freshness against default policy
    const age = Date.now() - this.lastKnownPosition.timestamp
    const isStale = age > DeviceCapabilityService.DEFAULT_STALE_THRESHOLD_MS

    return {
      ...this.lastKnownPosition,
      isStale
    }
  }

  public getCurrentRuntimeState(): GeolocationRuntimeState {
    return this.currentRuntimeState
  }

  public onStateChange(listener: (state: GeolocationRuntimeState, humanMessage: string) => void): () => void {
    this.stateListeners.add(listener)
    // Emit current state immediately
    listener(this.currentRuntimeState, this.mapHumanMessage(this.currentRuntimeState))
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  private notifyState(state: GeolocationRuntimeState, customErrorMsg?: string) {
    this.currentRuntimeState = state
    const msg = customErrorMsg || this.mapHumanMessage(state)
    this.lastErrorMessage = msg
    this.stateListeners.forEach(fn => fn(state, msg))
  }

  /**
   * Acquire a single position reading with standardized validation
   */
  public async getCurrentPosition(
    options: GeolocationWatchOptions = {}
  ): Promise<NormalizedGeolocationPosition> {
    if (!this.checkSupport('GEOLOCATION')) {
      this.notifyState('UNSUPPORTED')
      throw new Error('UNSUPPORTED: Geolocation API not available')
    }

    if (!this.isSecureContext()) {
      this.notifyState('PERMISSION_DENIED', 'Se requiere una conexión segura (HTTPS) para acceder al GPS.')
      throw new Error('INSECURE_CONTEXT: Geolocation requires HTTPS or localhost')
    }

    this.notifyState('ACQUIRING')

    const timeout = options.timeout ?? DeviceCapabilityService.DRIVER_TIMEOUT_MS
    const maximumAge = options.maximumAge ?? 0
    const enableHighAccuracy = options.enableHighAccuracy ?? true
    const staleThreshold = options.staleThresholdMs ?? DeviceCapabilityService.DEFAULT_STALE_THRESHOLD_MS
    const lowAccuracyThreshold = options.lowAccuracyThresholdMeters ?? DeviceCapabilityService.DEFAULT_LOW_ACCURACY_THRESHOLD_METERS

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const normalized = this.normalizePosition(pos, staleThreshold, lowAccuracyThreshold)
          this.lastKnownPosition = normalized

          if (normalized.isLowAccuracy) {
            this.notifyState('LOW_ACCURACY')
          } else {
            this.notifyState('ACTIVE')
          }

          resolve(normalized)
        },
        (err) => {
          const mapped = this.mapGeolocationError(err)
          this.notifyState(mapped.runtimeState, mapped.humanMessage)
          reject(new Error(`${mapped.category}: ${mapped.humanMessage}`))
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      )
    })
  }

  /**
   * Start or attach to active continuous watchPosition
   * Automatically handles duplicate watchers and fans out to all subscribers.
   */
  public startWatch(
    onUpdate: (position: NormalizedGeolocationPosition) => void,
    options: GeolocationWatchOptions = {}
  ): () => void {
    this.watchListeners.add(onUpdate)

    // If we have an existing fresh position, deliver it immediately
    const existing = this.getLastPosition()
    if (existing && !existing.isStale) {
      onUpdate(existing)
    }

    // If watcher already running, do not re-register with browser
    if (this.activeWatchId !== null) {
      return () => this.stopWatch(onUpdate)
    }

    if (!this.checkSupport('GEOLOCATION')) {
      this.notifyState('UNSUPPORTED')
      return () => this.stopWatch(onUpdate)
    }

    if (!this.isSecureContext()) {
      this.notifyState('PERMISSION_DENIED', 'Se requiere HTTPS para la navegación continua.')
      return () => this.stopWatch(onUpdate)
    }

    this.notifyState('ACQUIRING')

    const timeout = options.timeout ?? DeviceCapabilityService.DRIVER_TIMEOUT_MS
    const maximumAge = options.maximumAge ?? 1000
    const enableHighAccuracy = options.enableHighAccuracy ?? true
    const staleThreshold = options.staleThresholdMs ?? DeviceCapabilityService.DEFAULT_STALE_THRESHOLD_MS
    const lowAccuracyThreshold = options.lowAccuracyThresholdMeters ?? DeviceCapabilityService.DEFAULT_LOW_ACCURACY_THRESHOLD_METERS

    this.activeWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const normalized = this.normalizePosition(pos, staleThreshold, lowAccuracyThreshold)
        this.lastKnownPosition = normalized

        if (normalized.isLowAccuracy) {
          this.notifyState('LOW_ACCURACY')
        } else {
          this.notifyState('ACTIVE')
        }

        // Fan out without exposing raw coordinates to logging
        this.watchListeners.forEach(listener => {
          try {
            listener(normalized)
          } catch (e) {
            console.error('Error in watch listener subscriber:', e)
          }
        })
      },
      (err) => {
        const mapped = this.mapGeolocationError(err)
        this.notifyState(mapped.runtimeState, mapped.humanMessage)
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    )

    return () => this.stopWatch(onUpdate)
  }

  /**
   * Stop watching or detach a listener
   */
  public stopWatch(listenerToRemove?: (position: NormalizedGeolocationPosition) => void): void {
    if (listenerToRemove) {
      this.watchListeners.delete(listenerToRemove)
    } else {
      this.watchListeners.clear()
    }

    // If no more listeners remain, clean up browser watchPosition
    if (this.watchListeners.size === 0 && this.activeWatchId !== null) {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(this.activeWatchId)
      }
      this.activeWatchId = null
      this.notifyState('IDLE')
    }
  }

  // ==========================================
  // Helper & Normalization Functions
  // ==========================================

  private normalizePosition(
    pos: GeolocationPosition,
    staleThresholdMs: number,
    lowAccuracyThresholdMeters: number
  ): NormalizedGeolocationPosition {
    const age = Date.now() - pos.timestamp
    const isStale = age > staleThresholdMs
    const accuracy = pos.coords.accuracy || 0
    const isLowAccuracy = accuracy > lowAccuracyThresholdMeters

    return {
      coords: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy,
        altitude: pos.coords.altitude,
        altitudeAccuracy: pos.coords.altitudeAccuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed
      },
      timestamp: pos.timestamp,
      isStale,
      isLowAccuracy,
      accuracyMeters: Math.round(accuracy)
    }
  }

  public mapGeolocationError(error: GeolocationPositionError): { category: ErrorCategory; runtimeState: GeolocationRuntimeState; humanMessage: string } {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return {
          category: 'PERMISSION_DENIED',
          runtimeState: 'PERMISSION_DENIED',
          humanMessage: 'Permiso de ubicación denegado. Actívalo en la configuración de tu navegador o celular.'
        }
      case error.POSITION_UNAVAILABLE:
        return {
          category: 'POSITION_UNAVAILABLE',
          runtimeState: 'POSITION_UNAVAILABLE',
          humanMessage: 'Tu ubicación no está disponible en este momento. Verifica que el GPS del celular esté encendido.'
        }
      case error.TIMEOUT:
        return {
          category: 'TIMEOUT',
          runtimeState: 'TIMEOUT',
          humanMessage: 'El GPS tardó demasiado en responder. Intenta de nuevo en un lugar con mejor señal.'
        }
      default:
        return {
          category: 'UNKNOWN',
          runtimeState: 'POSITION_UNAVAILABLE',
          humanMessage: 'No se pudo obtener la ubicación de tu dispositivo. Reintenta en unos momentos.'
        }
    }
  }

  public mapHumanMessage(state: GeolocationRuntimeState | CapabilityState): string {
    switch (state) {
      case 'IDLE':
        return 'Ubicación lista para activarse.'
      case 'ACQUIRING':
        return 'Obteniendo señal GPS...'
      case 'ACTIVE':
        return 'Ubicación GPS activa y precisa.'
      case 'LOW_ACCURACY':
        return 'Ubicación aproximada detectada. Para mayor precisión sal a cielo abierto.'
      case 'STALE':
        return 'Señal GPS antigua o pausada. Reconectando...'
      case 'TIMEOUT':
        return 'Tiempo de espera del GPS agotado. Reintentando...'
      case 'POSITION_UNAVAILABLE':
        return 'No pudimos obtener tu ubicación. Verifica que el GPS esté encendido.'
      case 'PERMISSION_DENIED':
      case 'DENIED':
        return 'Permiso de ubicación denegado. Permite el acceso para continuar.'
      case 'UNSUPPORTED':
        return 'Tu navegador o dispositivo no tiene sensor de ubicación.'
      default:
        return 'Estado de ubicación verificado.'
    }
  }
}

export const deviceCapabilityService = DeviceCapabilityService.getInstance()
