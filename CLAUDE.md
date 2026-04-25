# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: PALANTIR: THE GAME

A browser-based intelligence game with a DEFCON/Palantir aesthetic — real-time geospatial threat tracking on a 3D globe with live signal feeds and player-driven intercept decisions.

## Running the Project

No build toolchain. Open `index.html` directly in Chrome. No server required for phase 1.

## Architecture

### Core Constraint: Zero Direct Component Imports

All inter-component communication **must** go through `signals/SignalBus.js`. Components never import each other. The game loop stays decoupled by hooking into SignalBus events only. Violating this breaks the architecture.

### Rendering Engine

CesiumJS (WebGL globe) via CDN. Uses free Cesium ion token for satellite imagery. The globe initializes tilted 45° over Central Asia/Europe.

### Data Flow

```
Real feeds (OpenSky, AIS) → AircraftFeed.js / VesselFeed.js
                                    ↓
                            SignalBus events
                                    ↓
                    Globe.js  HUD.js  IntelFeed.js  etc.
                                    ↓
                            GameState.js (read-only store)
                                    ↓
                        GameLoop.js (game logic only)
```

### State

`state/GameState.js` is the single source of truth. Components read from it but own no game logic. GameLoop.js is the only place game logic lives.

### Signal Sources

- **AircraftFeed.js** — polls OpenSky Network (`https://opensky-network.org/api/states/all`) every 15s, no auth required, bounding box lat 30–70 / lng 20–90, up to 8 aircraft normalized to `ThreatAsset`
- **VesselFeed.js** — public AIS source for Mediterranean/Black Sea/Indian Ocean, up to 4 vessels as `FREIGHTER` type
- **SigintSimulator.js** — synthetic `IntelEvent` generator, fires every 8–20s, references real asset IDs from GameState

### Key Data Types (JSDoc plain objects, no TypeScript, no classes)

**ThreatAsset**: `{ id, type: 'JET'|'FREIGHTER'|'VEHICLE'|'DRONE', lat, lng, altitudeM, headingDeg, speedKnots, label, threatLevel: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL', vectorType: 'AIR'|'LAND'|'SEA', targetCityId, etaSeconds, realWorldCallsign, isIntercepted, isHighlighted }`

**IntelEvent**: `{ id, type: 'SIGINT'|'CAM'|'RECON'|'SATELLITE', timestamp, assetId, headline, bodyText, severity: 'INFO'|'ALERT'|'URGENT', hasAction, actionLabel }`

**GameState**: `{ phase: 'IDLE'|'ACTIVE'|'PAUSED'|'DEBRIEF', intelScore, opsUnitsRemaining, secondsRemaining, objectives, threats, intelQueue, activeActions, selectedAssetId }`

## Implementation Order

Follow this sequence — each step must be runnable before the next:

1. Project scaffold (stub all files)
2. Global CSS + dark theme (deep navy, orange accents, monospace fonts)
3. CesiumJS globe with city markers and camera
4. SignalBus
5. GameState
6. AircraftFeed + VesselFeed (real assets on globe)
7. HUD + Objectives
8. Intel Feed Panels
9. Action Bar + ThreatVector legend
10. SigintSimulator
11. Polish (animations, CRT effects, arc lines)

## Phase 1 Scope Boundaries

**Not in scope:** win/lose logic, mission scripting, save/load, auth/backend, multiplayer, sound.

**GameLoop.js is a stub only** — document hook points, leave implementation empty. The game loop will be authored separately and plugs in via SignalBus listeners.

## Quality Bar

- Globe with real moving aircraft visible within 10 seconds of opening `index.html`
- All three intel panels populated from first load
- Zero console errors on clean Chrome load
- Visually complete (not a wireframe) — this is a playable prototype
- Mobile is out of scope
