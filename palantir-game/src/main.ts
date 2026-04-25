import './styles/global.css'
import './styles/hud.css'
import './styles/globe.css'
import { World } from './engine/World'
import { SignalBus } from './signals/SignalBus'
import { AircraftFeed } from './signals/AircraftFeed'
import { CityMarker } from './actors/CityMarker'
import { ThreatAircraft } from './actors/ThreatAircraft'
import { CITIES } from './data/cities'
import type { ThreatAsset } from './data/assetTypes'

const app = document.getElementById('app')!
app.innerHTML = `
  <div id="globe-container"></div>
  <div id="hud-layer"></div>
  <div id="modal-layer"></div>
`

const world = new World()
world.init(document.getElementById('globe-container')!)

for (const city of CITIES) {
  world.spawnActor(new CityMarker(city))
}

const aircraftMap = new Map<string, ThreatAircraft>()

SignalBus.on('signal:aircraft_updated', ({ assets }) => {
  for (const asset of assets as ThreatAsset[]) {
    const existing = aircraftMap.get(asset.id)
    if (existing) {
      existing.updatePosition(asset)
    } else {
      const actor = new ThreatAircraft(asset)
      world.spawnActor(actor)
      aircraftMap.set(asset.id, actor)
    }
  }
})

const feed = new AircraftFeed()
feed.start()
