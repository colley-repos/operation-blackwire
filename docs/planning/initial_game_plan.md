# PALANTIR: THE GAME — Claude Code Planning Prompt v2

## Briefing

You are architecting **PALANTIR: THE GAME** — a multiplayer persistent-world espionage simulation. Players are operatives working for rival intelligence agencies on a living global map. The world runs 24/7. Missions spawn from real-world signals. Other operatives compete and interfere. Every action leaves a trace on the globe.

Aesthetic: **James Bond meets Mission Impossible meets Palantir's actual UI** — sleek, dark, data-rich, tactile on mobile.

**This is a PWA, mobile-first, portrait-primary.** The phone IS the field terminal.

The game loop (mission resolution, win/loss, narrative) will be authored separately. Your job is the world layer: the map, the operative interface, the signal pipeline, the persistent world state, and the mission system skeleton.

---

## What Players Actually Do

Operations come in several modes — each a different type of mission card:

- **TRACE** — Track a suspect using converging intel: CCTV sightings, Interpol database hits, phone intercepts, radar contacts. Tap to correlate. Race against rival operatives.
- **LOCATE** — Find a High Value Target. Intel fragments appear across the globe. Triangulate their position before they move.
- **INTERCEPT** — A signal is transmitting. Tap relay nodes in sequence to trace it back to source before it goes dark.
- **EXTRACT** — Hack a satellite, corrupt a data feed, pull an asset out of a hot zone. Timed precision operation.

All modes share: a real-world map, incoming intel fragments, operative resource management, and impact on the shared persistent world.

---

## Technical Architecture

### Delivery
- **Progressive Web App** — installable on iOS/Android from browser
- Full `manifest.json`, service worker with offline cache, Web Push scaffolding
- Portrait-primary layout. Landscape supported as a secondary mode.

### Frontend
- **Vanilla JS with ES modules** — no build step required. Fast load on mobile networks.
- **Mapbox GL JS** (free tier) for the world map. Dark spy-aesthetic tile style (`mapbox://styles/mapbox/dark-v11`). Mobile-optimized, WebGL, smooth gesture handling.
- Component system: each UI region is a plain JS class with a `mount(el)` / `update(state)` / `destroy()` interface.

### Backend (scaffold, not full implementation)
- **Node.js + Express** — single `server.js` entry point
- **Socket.io** — real-time multiplayer: operative positions, mission state, intel events
- **SQLite via better-sqlite3** — persistent world state (zero infrastructure, file-based)
- REST endpoints for auth, mission fetch, world state hydration on load
- The backend scaffold must be runnable with `node server.js` — no Docker, no cloud setup

### Data Flow
```
Real-world signal feeds (OpenSky, AIS, public APIs)
        ↓
Signal Normalizer (server-side, runs every 30s)
        ↓
World State (SQLite + in-memory event queue)
        ↓
Socket.io broadcast → all connected clients
        ↓
Client Map + Intel Feed updates
        ↓
Player action → REST call → server resolves → broadcast result
```

---

## Project Structure

```
palantir-game/
├── index.html                  # PWA shell — minimal, loads app.js
├── manifest.json               # PWA manifest: name, icons, theme_color, display
├── sw.js                       # Service worker: cache shell, offline fallback
├── style/
│   ├── tokens.css              # CSS custom properties: colors, spacing, z-index
│   ├── base.css                # Reset, body, font-face (JetBrains Mono + Inter)
│   ├── map.css                 # Mapbox container, overlay positioning
│   ├── hud.css                 # Top HUD bar (agency logo, intel score, ops timer)
│   ├── mission-tray.css        # Bottom sheet mission card tray
│   ├── intel-panel.css         # Slide-up intel fragment panel
│   ├── operative-status.css    # Floating operative markers on map
│   └── action-ring.css         # Radial action menu (tap-and-hold on map)
├── app.js                      # Entry — init map, socket, state, mount components
├── state/
│   └── WorldState.js           # Client-side state store — pub/sub, no game logic
├── components/
│   ├── Map.js                  # Mapbox wrapper — all entity/layer management
│   ├── HUD.js                  # Top bar: agency crest, intel score, active op timer
│   ├── MissionTray.js          # Bottom sheet: scrollable mission cards
│   ├── MissionCard.js          # Single mission card (type badge, objective, timer, CTA)
│   ├── IntelPanel.js           # Slide-up panel: incoming intel fragments for active op
│   ├── IntelFragment.js        # Single intel item (CCTV, SIGINT, radar, Interpol)
│   ├── ActionRing.js           # Radial context menu on long-press map location
│   ├── OperativeMarker.js      # Other players on the map (ally/rival/unknown)
│   └── NotificationToast.js    # Push-style in-app alerts
├── signals/
│   ├── SignalBus.js            # Client-side pub/sub (same as before)
│   ├── SocketBridge.js         # Socket.io client wrapper — maps server events to SignalBus
│   └── MockSignals.js          # Offline/dev mode: realistic fake signal stream
├── server/
│   ├── server.js               # Express + Socket.io entry point
│   ├── db.js                   # SQLite setup, schema creation, query helpers
│   ├── routes/
│   │   ├── auth.js             # POST /auth/register, POST /auth/login (JWT)
│   │   ├── world.js            # GET /world/state — full hydration on connect
│   │   └── missions.js         # GET /missions, POST /missions/:id/join, POST /missions/:id/action
│   ├── signals/
│   │   ├── AircraftFeed.js     # OpenSky poller → normalizes to WorldSignal
│   │   ├── VesselFeed.js       # AIS poller → WorldSignal
│   │   └── SignalNormalizer.js # Converts raw feed data into mission-ready events
│   ├── world/
│   │   ├── WorldEngine.js      # Persistent world tick (runs every 30s)
│   │   ├── MissionSpawner.js   # Generates missions from signal events + world state
│   │   └── GameLoop.js         # STUB — hook point for mission resolution logic
│   └── push/
│       └── PushService.js      # Web Push: VAPID keys, subscription store, send helper
└── data/
    ├── cities.js               # 50 real cities: lat/lng, tier, faction affinity, aliases
    ├── agencies.js             # 6 player factions with names, logos, specializations
    ├── missionTemplates.js     # Templates per operation type (TRACE/LOCATE/INTERCEPT/EXTRACT)
    └── intelTypes.js           # Fragment types: CCTV, SIGINT, RADAR, INTERPOL, HUMINT, SAT
```

---

## Data Models

### Operative (player)
```js
{
  id: string,                     // UUID
  codename: string,               // "NIGHTSHADE", "CROW", etc.
  agencyId: string,               // which faction
  level: number,                  // 1-50
  intelScore: number,             // lifetime score
  opsCredits: number,             // spendable resource
  activeOperationId: string|null, // current mission
  lat: number,                    // last known position (optional, mobile GPS)
  lng: number,
  onlineAt: number,               // timestamp
  socketId: string|null
}
```

### Operation (mission)
```js
{
  id: string,
  type: 'TRACE' | 'LOCATE' | 'INTERCEPT' | 'EXTRACT',
  status: 'OPEN' | 'ACTIVE' | 'RESOLVED' | 'EXPIRED',
  difficulty: 'ROUTINE' | 'SENSITIVE' | 'CLASSIFIED' | 'EYES_ONLY',
  spawnedAt: number,
  expiresAt: number,
  targetEntityId: string,         // which WorldSignal entity this is about
  targetLat: number,              // approximate — exact revealed as intel comes in
  targetLng: number,
  radiusKm: number,               // how close "approximate" is
  assignedOperativeIds: string[], // who has joined
  completedByOperativeId: string|null,
  intelFragments: IntelFragment[],
  rewardIntel: number,
  rewardOps: number,
  worldImpact: WorldImpact        // what changes on the globe when resolved
}
```

### WorldSignal (from real feeds)
```js
{
  id: string,
  source: 'OPENSKY' | 'AIS' | 'SYNTHETIC',
  type: 'AIRCRAFT' | 'VESSEL' | 'VEHICLE' | 'COMMS' | 'PERSON',
  lat: number,
  lng: number,
  altitudeM: number,
  headingDeg: number,
  speedKnots: number,
  callsign: string|null,
  flagCountry: string|null,
  classification: 'CIVILIAN' | 'SUSPECT' | 'HOSTILE' | 'UNKNOWN',
  lastSeenAt: number,
  missionId: string|null          // which operation is hunting this
}
```

### IntelFragment
```js
{
  id: string,
  operationId: string,
  type: 'CCTV' | 'SIGINT' | 'RADAR' | 'INTERPOL' | 'HUMINT' | 'SATELLITE',
  revealedAt: number,
  expiresAt: number|null,         // some intel goes stale
  confidence: number,             // 0-100
  content: {
    headline: string,             // "CCTV: Subject spotted at Istanbul Ataturk"
    body: string,                 // raw intel text, partially redacted
    lat: number|null,             // location hint (not always present)
    lng: number|null,
    mediaType: 'TEXT' | 'TERMINAL' | 'IMAGE_URL' | 'COORDINATES',
    mediaUrl: string|null
  },
  requiresOpsCredits: number,     // 0 = free, >0 = pay to reveal full intel
  isRevealed: boolean
}
```

### WorldImpact
```js
{
  type: 'ASSET_NEUTRALIZED' | 'SIGNAL_DARK' | 'FACTION_SCORE' | 'LOCATION_BURNED' | 'INTEL_DUMP',
  factionId: string|null,
  locationId: string|null,
  durationHours: number|null,     // persistent effects have a duration
  description: string             // visible to all operatives on the globe
}
```

---

## Map Component (Map.js)

Mapbox GL JS, dark-v11 tile style. Mobile touch handling built-in.

**Layers to implement (in order):**

1. **`signal-layer`** — WorldSignals as pulsing dots. Color by classification: grey=civilian, amber=suspect, red=hostile. Clustered at low zoom. Tap to inspect.

2. **`operation-layer`** — Active operations as glowing rings at approximate location. Ring radius = uncertainty radius. As intel fragments arrive, ring tightens.

3. **`operative-layer`** — Other online operatives as small agency-colored diamonds. Rival agencies show differently from allies. Pulse if they just took an action.

4. **`impact-layer`** — WorldImpact events as fading shockwave circles. Neutralized assets leave a brief burn mark.

5. **`trajectory-layer`** — Moving WorldSignals (aircraft/vessels) get faint trajectory lines showing their path.

**API the Map exposes:**
```js
Map.addSignal(signal)
Map.updateSignal(id, lat, lng, heading)
Map.removeSignal(id)
Map.addOperation(operation)         // places uncertainty ring
Map.tightenOperationRing(id, newRadiusKm)  // as intel arrives
Map.resolveOperation(id)            // play resolve animation, remove ring
Map.addOperative(operative)
Map.updateOperative(id, lat, lng)
Map.flashImpact(lat, lng, type)
Map.flyTo(lat, lng, zoom)           // animate camera
Map.onTap(callback)                 // returns tapped feature + lat/lng
Map.onLongPress(callback)           // triggers ActionRing
```

**Mobile camera defaults:**
- Initial zoom: 3 (shows Europe/Central Asia/Middle East)
- Center: 35°N, 35°E
- Pitch: 30° (slight tilt, not full 3D — better on mobile)
- No rotation lock — players can spin the globe

---

## Mobile UI Layout

### Portrait layout (primary)

```
┌─────────────────────────┐
│  [AGENCY CREST] [SCORE] [TIMER]  │  ← HUD bar (56px, fixed top)
├─────────────────────────┤
│                         │
│                         │
│      MAPBOX GLOBE       │  ← Full bleed map, touch-native
│                         │
│                         │
│                         │
├─────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──┐ │  ← Mission tray (bottom sheet)
│  │ TRACE│ │LOCATE│ │+2│ │    scrollable horizontally
│  │ card │ │ card │ │  │ │
│  └──────┘ └──────┘ └──┘ │
└─────────────────────────┘
```

When a mission card is tapped, the tray **slides up** to full-screen:

```
┌─────────────────────────┐
│  ← BACK    [TRACE] ACTIVE│  ← operation header
├─────────────────────────┤
│  🔴 CCTV Istanbul 14:32  │
│  📡 SIGINT fragment ████ │  ← Intel fragments, scrollable
│  🛰  SAT overlay - 87%   │
│  [PAY 20 OPS TO REVEAL]  │
├─────────────────────────┤
│      [JOIN OPERATION]    │  ← CTA — primary action button
└─────────────────────────┘
```

### Touch interactions

| Gesture | Action |
|---|---|
| Tap map entity | Inspect panel slides up |
| Long-press empty map | ActionRing appears (place asset, scout area, request backup) |
| Swipe down on panel | Dismiss |
| Swipe left on mission card | Pass / mark not interested |
| Double-tap map | Zoom in |
| Pinch | Zoom |

### Action Ring (radial menu on long-press)
- 4-6 radial options contextual to location
- Examples: `DEPLOY ASSET`, `SCAN AREA`, `MARK SUSPICIOUS`, `CALL BACKUP`
- Renders at touch point, thumb-reach radius
- Each option costs Ops Credits — shown on button
- Emits `action:ring_selected` on SignalBus

---

## PWA Requirements

### manifest.json
```json
{
  "name": "PALANTIR",
  "short_name": "PALANTIR",
  "description": "Global espionage simulation",
  "theme_color": "#0a0e1a",
  "background_color": "#0a0e1a",
  "display": "standalone",
  "orientation": "portrait-primary",
  "start_url": "/",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

Generate placeholder icons (dark background, stylized eye or crosshair) as PNG using Canvas API at startup if not present.

### Service Worker (sw.js)
- Cache strategy: **network-first for API calls**, **cache-first for static assets**
- Offline fallback: show last-known world state from IndexedDB cache
- Handle Web Push: on push event, show notification with mission alert content
- Background sync: queue player actions taken offline, replay when reconnected

### Push Notifications
- Scaffold `PushService.js` server-side with VAPID key generation
- Client subscribes on first login, subscription stored in DB
- Trigger push for: new high-value operation spawned near player's last position, rival operative completing a mission you were on, intel fragment expiring soon

---

## Server — World Engine

### WorldEngine.js (runs every 30 seconds)
```
tick() {
  1. Poll AircraftFeed → upsert WorldSignals in DB
  2. Poll VesselFeed → upsert WorldSignals in DB  
  3. Run SignalNormalizer → flag suspect signals based on rules
  4. Run MissionSpawner → check if any signals should become Operations
  5. Expire stale Operations (past expiresAt with no resolution)
  6. Broadcast world delta to all connected sockets
}
```

### MissionSpawner.js
Rules for converting WorldSignals to Operations:
- Aircraft deviating from commercial routes → TRACE or INTERCEPT mission
- Vessel in restricted waters → LOCATE mission
- Two suspect signals converging on a city → EXTRACT mission
- Random synthetic injection (for mission variety when real signals are sparse)
- Mission difficulty scales with: speed of signal, proximity to high-tier cities, number of online operatives

Missions should feel emergent — like the world is generating them from real events.

### Signal Rules (SignalNormalizer.js)
Simple heuristics to classify real OpenSky/AIS data:
- Aircraft with no transponder callsign → `UNKNOWN`
- Aircraft flying over restricted airspace polygon (list of 10 zones) → `SUSPECT`  
- Vessel with flag mismatch vs AIS reported country → `SUSPECT`
- Fast-moving small vessel in high-traffic shipping lane (anomaly) → `SUSPECT`
- Everything else → `CIVILIAN`

Only `SUSPECT` and `UNKNOWN` become mission candidates.

---

## Agency System (agencies.js)

6 factions, each with distinct intel specialization that affects gameplay:

```js
[
  { id: 'CIPHER',  name: 'CIPHER Division',   specialty: 'SIGINT',    color: '#00ff88' },
  { id: 'WRAITH',  name: 'WRAITH Bureau',      specialty: 'HUMINT',   color: '#ff4444' },
  { id: 'VECTOR',  name: 'VECTOR Group',       specialty: 'SATELLITE', color: '#4488ff' },
  { id: 'ARGUS',   name: 'ARGUS Consortium',   specialty: 'CCTV',     color: '#ffaa00' },
  { id: 'SPECTER', name: 'SPECTER Network',    specialty: 'RADAR',    color: '#aa44ff' },
  { id: 'NOMAD',   name: 'NOMAD Collective',   specialty: 'INTERPOL', color: '#00ccff' }
]
```

Agency specialization means: CIPHER agents get SIGINT fragments revealed at higher confidence. ARGUS agents get CCTV fragments with less redaction. Etc. The game loop will implement the resolution logic — the data model just carries the specialty field.

---

## Visual Design Language

### CSS Tokens (tokens.css)
```css
:root {
  /* Background layers */
  --color-void:        #060810;   /* deepest background */
  --color-surface:     #0a0e1a;   /* panels, cards */
  --color-surface-2:   #111827;   /* elevated surfaces */
  --color-surface-3:   #1a2235;   /* hover states */
  --color-border:      #1e2d45;   /* subtle borders */

  /* Signal colors */
  --color-hostile:     #ff3333;   /* threats, red alerts */
  --color-suspect:     #ff9900;   /* orange — tracking targets */
  --color-friendly:    #00ff88;   /* allied, safe */
  --color-unknown:     #888ea8;   /* unclassified */
  --color-intel:       #00ccff;   /* info, data, links */

  /* Text */
  --color-text-primary:   #e8eaf0;
  --color-text-secondary: #6b7a99;
  --color-text-accent:    #00ccff;

  /* Typography */
  --font-mono:    'JetBrains Mono', 'Courier New', monospace;
  --font-ui:      'Inter', system-ui, sans-serif;

  /* Motion */
  --ease-snap:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-data:    cubic-bezier(0.4, 0, 0.2, 1);

  /* Glow effects */
  --glow-hostile:  0 0 12px rgba(255, 51, 51, 0.5);
  --glow-suspect:  0 0 12px rgba(255, 153, 0, 0.5);
  --glow-intel:    0 0 8px rgba(0, 204, 255, 0.4);
}
```

### Animation principles
- **Pulsing rings** on map entities: `@keyframes pulse-ring` — scale 1→1.6, opacity 1→0, 2s infinite
- **Scanline effect** on SIGINT panels: repeating linear-gradient overlay, subtle CSS animation
- **Number flips** on HUD score: CSS `counter` with `@keyframes` or JS digit-by-digit update
- **Panel slide-up**: `transform: translateY(100%)` → `translateY(0)`, 300ms `ease-snap`
- **Alert flash**: brief `background-color` flash to `--color-hostile` on urgent intel

---

## Socket.io Events

### Server → Client
```js
'world:delta'       // { signals[], operations[], operatives[] } — periodic world update
'operation:spawned' // new Operation object
'operation:updated' // { id, changes } — ring tightening, status change
'operation:resolved'// { id, completedBy, worldImpact }
'intel:fragment'    // new IntelFragment for an operation you're on
'operative:moved'   // { id, lat, lng } — another player moved
'alert:push'        // in-app notification { type, headline, body }
```

### Client → Server
```js
'operative:join_operation'  // { operationId }
'operative:action'          // { operationId, actionType, payload }
'operative:position'        // { lat, lng } — optional, if player consents to location
```

---

## Backend API Endpoints

```
POST /auth/register     { codename, agencyId }  → { token, operative }
POST /auth/login        { codename, secret }    → { token, operative }

GET  /world/state       → { signals[], operations[], operatives[], cities[] }

GET  /missions          → active Operation[]
GET  /missions/:id      → Operation + IntelFragment[]
POST /missions/:id/join → joins operation, returns updated Operation
POST /missions/:id/action { type, payload } → STUB, returns { accepted: true }

POST /push/subscribe    { subscription }  → { ok: true }
```

---

## GameLoop.js (Server — STUB ONLY)

```js
// GAME LOOP — STUB
// Author the mission resolution logic here.
// All hooks fire via SignalBus (server-side) or direct call from routes/missions.js

module.exports = {

  // Called when operative joins an operation
  onOperativeJoin(operation, operative) {
    // TODO: assign role, send initial intel fragments
  },

  // Called when operative submits an action (DEPLOY_ASSET, SCAN_AREA, etc.)
  onAction(operation, operative, action) {
    // TODO: validate, apply to world state, determine intel yield
    // Return: { success, intelFragments, opsCreditsUsed, worldImpact }
    return { accepted: true };
  },

  // Called every WorldEngine tick for each active operation
  onTick(operation, worldState) {
    // TODO: check expiry, spawn new fragments, advance state machine
  },

  // Called when resolution conditions are met (game loop determines this)
  onResolve(operation, resolvedBy) {
    // TODO: compute rewards, apply WorldImpact, update leaderboard
  },

  // Called when operation expires without resolution
  onExpire(operation) {
    // TODO: mark EXPIRED, apply consequences, notify participants
  }
};
```

---

## Implementation Order

Execute in sequence. Each step must be functional before proceeding.

### Phase A — Foundation (run `node server.js` and `open index.html` works)
1. Project scaffold: all files created, all stubs in place
2. `tokens.css` + `base.css` — visual language locked in
3. `manifest.json` + `sw.js` — PWA installable shell
4. `server.js` + `db.js` — server starts, DB schema created, health endpoint returns 200
5. Auth routes — register/login returns JWT

### Phase B — The World
6. `AircraftFeed.js` + `VesselFeed.js` + `SignalNormalizer.js` on server
7. `WorldEngine.js` tick loop — signals flowing into DB
8. `GET /world/state` returns live signal data
9. `Map.js` — Mapbox dark globe rendering WorldSignals as pulsing dots
10. `SocketBridge.js` + `world:delta` broadcasts — map updates in real-time

### Phase C — Operations
11. `MissionSpawner.js` — operations appearing on map as uncertainty rings
12. `MissionTray.js` + `MissionCard.js` — bottom sheet with active operations
13. `IntelPanel.js` + `IntelFragment.js` — slide-up intel view per operation
14. `POST /missions/:id/join` — operative can join, ring animates
15. `POST /missions/:id/action` stub — fires GameLoop hooks

### Phase D — Operative Layer
16. `HUD.js` — score, credits, timer
17. `OperativeMarker.js` — other players on map
18. `ActionRing.js` — long-press radial menu
19. `NotificationToast.js` + `PushService.js` — in-app and push alerts

### Phase E — Polish
20. Number flip animations, scanline effects, pulse rings
21. Offline mode: IndexedDB cache, offline banner, action queue
22. Responsive landscape layout
23. PWA icon generation, install prompt handling
24. `README.md` — run instructions + game loop hook documentation

---

## Definition of Done

Phase 1 complete when:
- [ ] `node server.js` starts without errors, DB initializes
- [ ] Opening on mobile Chrome shows the dark globe, installable as PWA
- [ ] Real aircraft appear as pulsing amber dots on the map within 30s of load
- [ ] At least 1 synthetic operation appears as a glowing ring within 60s
- [ ] Mission tray shows operation cards; tapping one slides up intel panel
- [ ] Socket.io delivers world:delta updates to all open clients in real-time
- [ ] Auth flow works: register → receive token → stored in memory
- [ ] GameLoop.js stub is in place with all documented hooks
- [ ] All touch gestures work on actual mobile device (not just emulator)
- [ ] No console errors on clean load in Chrome mobile

---

## What NOT to Build in Phase 1

- Mission resolution logic (the game loop)
- Leaderboards / persistent rankings
- Agency vs agency strategic layer
- In-app purchases / economy
- Native app (App Store / Play Store)
- Voice / audio
- Actual GPS location use (scaffold only, opt-in later)