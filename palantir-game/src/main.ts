import './styles/global.css'
import { RegionHighlighter } from './signals/RegionHighlighter'
import './styles/hud.css'
import './styles/globe.css'
import './styles/intel-panels.css'
import './styles/action-bar.css'
import './styles/modal.css'
import { World } from './engine/World'
import { SignalBus } from './signals/SignalBus'
import { AircraftFeed } from './signals/AircraftFeed'
import { CityMarker } from './actors/CityMarker'
import { ThreatAircraft } from './actors/ThreatAircraft'
import { CITIES } from './data/cities'
import type { ThreatAsset } from './data/assetTypes'
import { HUDCounters } from './ui/panels/HUDCounters'
import { ObjectivesPanel } from './ui/panels/ObjectivesPanel'
import { SigintPanel } from './ui/panels/SigintPanel'
import { CamPanel } from './ui/panels/CamPanel'
import { ReconPanel } from './ui/panels/ReconPanel'
import { ActionBar } from './ui/ActionBar'
import { ThreatVector } from './ui/ThreatVector'
import { ModalStack } from './ui/ModalStack'
import { HoverPreview } from './ui/HoverPreview'
import { SigintSimulator } from './signals/SigintSimulator'
import type { IntelEvent } from './data/assetTypes'

const app = document.getElementById('app')!
app.innerHTML = `
  <div id="globe-container"></div>
  <div id="hud-layer"></div>
  <div id="modal-layer"></div>
`

const world = new World()
world.init(document.getElementById('globe-container')!)

const regions = new RegionHighlighter()
regions.init(world)

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

const hudLayer = document.getElementById('hud-layer')!
const modalLayer = document.getElementById('modal-layer')!
modalLayer.style.pointerEvents = 'none'

// HUD panels
const hudCounters = new HUDCounters()
hudCounters.mount(hudLayer)

const objectives = new ObjectivesPanel()
objectives.mount(hudLayer)

// Intel strip
const intelStrip = document.createElement('div')
intelStrip.className = 'intel-strip'
const sigint = new SigintPanel()
const cam = new CamPanel()
const recon = new ReconPanel()
sigint.mount(intelStrip)
cam.mount(intelStrip)
recon.mount(intelStrip)
hudLayer.appendChild(intelStrip)

// Action bar
const actionBarEl = document.createElement('div')
actionBarEl.className = 'action-bar'
const actionBar = new ActionBar()
const threatVec = new ThreatVector()
actionBar.mount(actionBarEl)
threatVec.mount(actionBarEl)
hudLayer.appendChild(actionBarEl)

// Modal system
const modalStack = new ModalStack(modalLayer)
const hoverPreview = new HoverPreview()
hoverPreview.mount(hudLayer)

// SIGINT simulator
const simulator = new SigintSimulator()
SignalBus.on('signal:intel_event', ({ event }) => {
  const e = event as IntelEvent
  sigint.appendLine(e.bodyText, e.severity === 'INFO')
})
simulator.start()

// GameLoop (dynamic import to avoid circular dependency issues)
import('./game/GameLoop')

// Suppress unused-variable warnings for wired-up instances
void hudCounters
void objectives
void cam
void recon
void actionBar
void threatVec
void modalStack
void hoverPreview
