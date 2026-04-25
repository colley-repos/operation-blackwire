# Interface Architecture Design
**Date:** 2026-04-25  
**Status:** Approved  
**Tagline:** You don't shoot. You decide.

---

## Vision

A browser-based geospatial intelligence game where the game world *is* the real world. Real aircraft from OpenSky become threat targets. Real AIS vessels become arms freighters. Real-world signals feed the intel pipeline. The player runs a Tom Clancy-style agency from a war-room dashboard — detecting, triaging, and deploying against a live global threat map.

Reference aesthetics: DEFCON meets Palantir. XCOM meets the ex-Google Maps PM Palantir clone (youtube.com/watch?v=rXvU7bPJ8n4). Core loop: **Detect → Triage → Deploy**.

Mobile-first. Touch-optimised. Production quality — not a tech demo.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Language | TypeScript | Required for OOP class hierarchy at this scale |
| Build | Vite | Minimal config, fast HMR, PWA plugin available |
| Globe | CesiumJS (CDN via Vite) | Only option matching Google Earth 3D aesthetic |
| UI | Vanilla TS + CSS modules | No framework overhead; modals are simple DOM |
| Deployment | Static files (PWA) | Zero infrastructure; installable on mobile |

---

## Engine Architecture — Unreal Philosophy in TypeScript

Every Unreal concept maps 1:1. No exceptions — this is the structural contract the whole game is built on.

```
engine/
  World.ts            ← UWorld    — owns CesiumJS viewer, ticks all Actors each frame
  Actor.ts            ← AActor    — base class for anything on the globe
  Pawn.ts             ← APawn     — Actor that can be "possessed" / receive input focus
  Character.ts        ← ACharacter — human entity (person tracked in CCTV view)
  PlayerController.ts ← APlayerController — translates touch/mouse → game actions
  GameMode.ts         ← UGameMode — phase rules, win/lose, session lifecycle
  GameState.ts        ← UGameState — single shared live state, read-only to components
  HUD.ts              ← AHUD      — UI panel coordinator
  ActorComponent.ts   ← UActorComponent — attachable behaviour unit
```

### Concrete Actors

```
actors/
  ThreatAircraft.ts   ← extends Pawn — OpenSky aircraft, moves on real geodesic path
  ThreatVessel.ts     ← extends Pawn — AIS vessel, FREIGHTER type
  CCTVCamera.ts       ← extends Actor — static camera entity, opens feed modal on click
  Satellite.ts        ← extends Actor — orbital asset, targeting interface on click
  CityMarker.ts       ← extends Actor — real city, shows inbound threat status
  TargetPerson.ts     ← extends Character — human entity visible in CCTV/street view
```

### Components (attachable to any Actor)

```
components/
  ThreatComponent.ts      — threat level, vector type, ETA to target
  TrajectoryComponent.ts  — geodesic path rendering, arc line to target city
  DossierComponent.ts     — identity data, confidence %, known associates
  SignalComponent.ts      — links actor to live data feed (OpenSky callsign, AIS MMSI)
```

---

## Communication — SignalBus

**Zero direct imports between siblings.** Every cross-system message goes through `SignalBus.ts`.

```typescript
SignalBus.emit('asset:selected', { actorId })
SignalBus.emit('action:deploy_drone', { actorId })
SignalBus.emit('signal:aircraft_updated', { assets: ThreatAsset[] })
SignalBus.emit('timer:tick', { secondsRemaining })
SignalBus.emit('asset:reached_target', { actorId, cityId })
SignalBus.emit('modal:open', { actorId, mode: 'hover' | 'detail' })
SignalBus.emit('modal:close', { actorId })
```

GameLoop.ts is the only file that contains game logic. It listens to SignalBus events and resolves outcomes. Components never contain rules.

---

## Interaction Model — Two-Stage Entity Interaction

Every Actor on the globe follows the same pattern. Touch-friendly by design.

**Stage 1 — Hover / Long-press (500ms)**
`HoverPreview` component anchors to the entity on the globe:
- Dark glass card with corner bracket decorations
- Type icon + label + threat badge
- Orange border glow if HIGH/CRITICAL
- Dismisses on move-away or tap-elsewhere

**Stage 2 — Tap / Click → DetailModal**
`ModalStack.ts` manages layering. Each Actor class defines its own modal template:

| Actor | Modal Content |
|-------|--------------|
| `ThreatAircraft` | Live telemetry, trajectory arc, intercept action buttons |
| `ThreatVessel` | Vessel data, route, boarding/track actions |
| `CCTVCamera` | Simulated camera feed, ML face-tracking bounding boxes, ENGAGE button |
| `Satellite` | Targeting reticle, orbital data, tasking controls |
| `TargetPerson` | Dossier card — photo, identity confidence %, known associates, TARGET / RELEASE |
| `CityMarker` | Active inbound threats, city intel score, deploy options |

Modals can stack — open a city, then open a threat from within it. Back navigation via swipe-left or back button.

---

## Signal Feeds

```
signals/
  SignalBus.ts          — typed pub/sub event bus
  AircraftFeed.ts       — polls OpenSky every 15s, bbox lat30-70/lng20-90, up to 8 aircraft
  VesselFeed.ts         — public AIS, Mediterranean/Black Sea/Indian Ocean, up to 4 vessels
  SigintSimulator.ts    — synthetic IntelEvents every 8-20s, references real actor IDs
```

Feed → normalize to `ThreatAsset` interface → emit on SignalBus → `World` creates/updates Actors.

---

## UI Layout (matches reference screenshot)

```
┌─────────────────────────────────────────────────────┐
│ [OBJECTIVES]              (globe fills 100% viewport) │ [HUD: Intel / Ops / Time]
│ ► Track Enemy Leader                                  │
│ ► Intercept Arms Shipment                             │
│                                                       │
│              [CESIUMJS 3D GLOBE]                      │
│         (assets, trajectory lines, city markers)      │
│                                                       │
├──────────────┬──────────────┬────────────────────────┤
│ SIGINT       │ Traffic Cam  │ Recon Team              │
│ [terminal]   │ [cam feed]   │ [operator status]       │
│ TRACE SIGNAL │ ENGAGE       │ DEPLOY TEAM             │
└──────────────┴──────────────┴────────────────────────┘
[✓ Deploy Drone] [✓ Signal Jammer] [✓ Launch Interceptor]    [THREAT VECTOR: AIR|LAND|SEA]
```

All panels are `.hud` components — corner bracket decorations, dark glass, colour-coded by type.

---

## Visual Design System

### Colour Palette
```css
--bg-base:        #06080C;   /* near-black background */
--bg-surface:     #0A0E14;   /* elevated surface */
--bg-panel:       #141C28;   /* panel/card surface */
--color-threat:   #FF3838;   /* threat red */
--color-ops:      #00FF88;   /* ops green */
--color-amber:    #FFB800;   /* warning amber */
--color-intel:    #3DA5FF;   /* intel blue */
--text-primary:   #FFFFFF;
--text-subtle:    #FFFFFF8C;
--border-subtle:  #FFFFFF1A;
```

### HUD Panel Component
Every panel uses corner bracket decorations — 10×10px L-shaped lines at all four corners. Colour-keyed by content type:
- `.hud-threat` — red corners (`#FF3838`)
- `.hud-ops` — green corners (`#00FF88`)
- `.hud-amber` — amber corners (`#FFB800`)

### Glow System
```css
.glow-threat { box-shadow: 0 0 24px #FF383866; }
.glow-ops    { box-shadow: 0 0 24px #00FF884D; }
.glow-amber  { box-shadow: 0 0 24px #FFB8004D; }
```
Paired with `pulse-threat` / `pulse-ops` keyframe animations that breathe the glow on CRITICAL state.

### Scanline CRT Overlay
Applied to SIGINT and camera panels:
```css
.scan-overlay::after {
  background: repeating-linear-gradient(#FFFFFF06 0 1px, transparent 1px 3px);
}
```

### Typography
- Font: JetBrains Mono (monospace throughout — no exceptions)
- Panel headers: `10px / letter-spacing: 0.18em / uppercase`
- Body: `12-13px`
- HUD counters: `20-24px / tabular-nums`

### Touch Targets
- All interactive elements: minimum 44×44px
- Long-press (500ms) = hover preview
- Tap = click/select
- Pinch = globe zoom
- Swipe-left = close modal

---

## Directory Structure

```
palantir-game/
├── src/
│   ├── main.ts
│   ├── engine/
│   │   ├── World.ts
│   │   ├── Actor.ts
│   │   ├── Pawn.ts
│   │   ├── Character.ts
│   │   ├── PlayerController.ts
│   │   ├── GameMode.ts
│   │   ├── GameState.ts
│   │   ├── HUD.ts
│   │   └── ActorComponent.ts
│   ├── actors/
│   │   ├── ThreatAircraft.ts
│   │   ├── ThreatVessel.ts
│   │   ├── CCTVCamera.ts
│   │   ├── Satellite.ts
│   │   ├── CityMarker.ts
│   │   └── TargetPerson.ts
│   ├── components/
│   │   ├── ThreatComponent.ts
│   │   ├── TrajectoryComponent.ts
│   │   ├── DossierComponent.ts
│   │   └── SignalComponent.ts
│   ├── signals/
│   │   ├── SignalBus.ts
│   │   ├── AircraftFeed.ts
│   │   ├── VesselFeed.ts
│   │   └── SigintSimulator.ts
│   ├── ui/
│   │   ├── ModalStack.ts
│   │   ├── HoverPreview.ts
│   │   ├── DetailModal.ts
│   │   ├── panels/
│   │   │   ├── SigintPanel.ts
│   │   │   ├── CamPanel.ts
│   │   │   ├── ReconPanel.ts
│   │   │   └── ObjectivesPanel.ts
│   │   ├── ActionBar.ts
│   │   └── ThreatVector.ts
│   ├── game/
│   │   └── GameLoop.ts         ← stub only in phase 1
│   ├── data/
│   │   ├── cities.ts
│   │   └── assetTypes.ts
│   └── styles/
│       ├── global.css
│       ├── hud.css             ← corner brackets, glow, panel system
│       ├── globe.css
│       ├── modal.css
│       ├── intel-panels.css
│       └── action-bar.css
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Phase 1 Definition of Done

- [ ] `npm run dev` serves the game, `npm run build` produces deployable static files
- [ ] CesiumJS globe renders with real aircraft from OpenSky moving on it within 10s of load
- [ ] All UI regions visible and styled: globe, HUD, objectives, intel panels, action bar, threat vector legend
- [ ] Hover preview appears on any globe entity (touch long-press + mouse hover)
- [ ] Click/tap opens DetailModal for aircraft (telemetry + intercept buttons)
- [ ] SignalBus wired — action buttons respond to selected actor
- [ ] Corner bracket HUD panels, glow system, scanline effect, JetBrains Mono throughout
- [ ] PWA manifest present — installable on mobile home screen
- [ ] Zero console errors on clean Chrome load (desktop and mobile)
- [ ] GameLoop.ts stub in place with documented hook points

## Out of Scope — Phase 1

Win/lose logic, mission scripting, CCTV camera feeds, satellite control, dossier system, save/load, multiplayer, sound.
