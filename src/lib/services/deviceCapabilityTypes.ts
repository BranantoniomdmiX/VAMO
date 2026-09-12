/**
 * VAMO Device Capability Service & Registry Types
 * Architectural Principle: CAPABILITY FIRST
 * Defines normalized states, capability keys, and extensible registry contracts.
 */

export type DeviceCapabilityKey = 
  | 'GEOLOCATION'
  // Future capabilities (extensibility contract)
  | 'CAMERA'
  | 'MICROPHONE'
  | 'MOTION'
  | 'ORIENTATION'
  | 'TORCH'
  | 'VIBRATION'
  | 'BLUETOOTH'
  | 'NFC'
  | 'USB'
  | 'SERIAL'
  | 'HID'
  | 'PRINT'
  | 'SHARE'
  | 'NOTIFICATIONS'
  | 'WAKE_LOCK'

export type CapabilityState =
  | 'UNSUPPORTED'
  | 'AVAILABLE'
  | 'PERMISSION_REQUIRED'
  | 'GRANTED'
  | 'DENIED'
  | 'BLOCKED'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'ERROR'

export type GeolocationRuntimeState =
  | 'IDLE'
  | 'ACQUIRING'
  | 'ACTIVE'
  | 'TIMEOUT'
  | 'POSITION_UNAVAILABLE'
  | 'LOW_ACCURACY'
  | 'STALE'
  | 'PERMISSION_DENIED'
  | 'UNSUPPORTED'

export type ErrorCategory =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNSUPPORTED'
  | 'INSECURE_CONTEXT'
  | 'UNKNOWN'

export interface CapabilityStatus {
  capability: DeviceCapabilityKey
  isSupported: boolean
  permissionState: PermissionState | 'unsupported' | 'unknown'
  runtimeState: CapabilityState | GeolocationRuntimeState
  lastChecked: number | null
  errorCategory?: ErrorCategory
  humanMessage?: string
}

export interface GeolocationCoordinates {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number | null
  altitudeAccuracy?: number | null
  heading?: number | null
  speed?: number | null
}

export interface NormalizedGeolocationPosition {
  coords: GeolocationCoordinates
  timestamp: number
  isStale: boolean
  isLowAccuracy: boolean
  accuracyMeters: number
}

export interface GeolocationWatchOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  /** VAMO Freshness Policy: positions older than this threshold in ms are marked as stale */
  staleThresholdMs?: number
  /** VAMO Accuracy Policy: accuracy radius > this threshold in meters is marked as low accuracy */
  lowAccuracyThresholdMeters?: number
}
