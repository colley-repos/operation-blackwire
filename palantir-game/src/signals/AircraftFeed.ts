import type { ThreatAsset } from '../data/assetTypes'
import { SignalBus } from './SignalBus'
import { CITIES } from '../data/cities'

const BBOX = { minLat: 30, maxLat: 70, minLng: 20, maxLng: 90 }
const MAX_AIRCRAFT = 8
const POLL_MS = 15_000

type OpenSkyState = (string | number | boolean | null)[]

export function normalizeOpenSkyState(state: OpenSkyState): ThreatAsset | null {
  const [icao24, callsign, , , , lng, lat, alt, onGround, velocity, heading] = state
  if (lat == null || lng == null || onGround === true) return null

  const nearestCity = findNearestCity(lat as number, lng as number)

  return {
    id: `aircraft-${icao24 as string}`,
    type: 'JET',
    lat: lat as number,
    lng: lng as number,
    altitudeM: (alt as number) ?? 0,
    headingDeg: (heading as number) ?? 0,
    speedKnots: velocity ? Math.round((velocity as number) * 1.944) : 0,
    label: 'ENEMY JET',
    threatLevel: 'MEDIUM',
    vectorType: 'AIR',
    targetCityId: nearestCity?.id ?? null,
    etaSeconds: null,
    realWorldCallsign: ((callsign as string) ?? '').trim() || null,
    isIntercepted: false,
    isHighlighted: false,
  }
}

function findNearestCity(lat: number, lng: number) {
  let nearest = null
  let minDist = Infinity
  for (const city of CITIES) {
    const d = Math.hypot(city.lat - lat, city.lng - lng)
    if (d < minDist) { minDist = d; nearest = city }
  }
  return nearest
}

export class AircraftFeed {
  private handle = 0

  start(): void { this.poll(); this.handle = window.setInterval(() => this.poll(), POLL_MS) }
  stop(): void { clearInterval(this.handle) }

  private async poll(): Promise<void> {
    try {
      const res = await fetch(
        `https://opensky-network.org/api/states/all?lamin=${BBOX.minLat}&lomin=${BBOX.minLng}&lamax=${BBOX.maxLat}&lomax=${BBOX.maxLng}`
      )
      if (!res.ok) return
      const json = await res.json() as { states?: OpenSkyState[] }
      const assets = (json.states ?? [])
        .map(normalizeOpenSkyState)
        .filter((a): a is ThreatAsset => a !== null)
        .slice(0, MAX_AIRCRAFT)
      SignalBus.emit('signal:aircraft_updated', { assets })
    } catch {
      // Network errors silently skipped
    }
  }
}
