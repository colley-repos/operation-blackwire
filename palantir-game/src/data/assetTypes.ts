export type VectorType = 'AIR' | 'LAND' | 'SEA'
export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AssetType = 'JET' | 'FREIGHTER' | 'VEHICLE' | 'DRONE' | 'SATELLITE'

export interface ThreatAsset {
  id: string
  type: AssetType
  lat: number
  lng: number
  altitudeM: number
  headingDeg: number
  speedKnots: number
  label: string
  threatLevel: ThreatLevel
  vectorType: VectorType
  targetCityId: string | null
  etaSeconds: number | null
  realWorldCallsign: string | null
  isIntercepted: boolean
  isHighlighted: boolean
}

export interface IntelEvent {
  id: string
  type: 'SIGINT' | 'CAM' | 'RECON' | 'SATELLITE'
  timestamp: number
  actorId: string | null
  headline: string
  bodyText: string
  severity: 'INFO' | 'ALERT' | 'URGENT'
  hasAction: boolean
  actionLabel: string | null
}

export const ASSET_COLORS: Record<AssetType, string> = {
  JET:       '#FF3838',
  FREIGHTER: '#FFB800',
  VEHICLE:   '#FF3838',
  DRONE:     '#3DA5FF',
  SATELLITE: '#00FF88',
}
