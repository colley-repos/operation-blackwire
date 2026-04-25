# Phase 1 Interface Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full PALANTIR game interface — CesiumJS globe with real aircraft, Palantir-style HUD panels, hover/click modal system — as a production-quality PWA foundation.

**Architecture:** Unreal Engine class hierarchy in TypeScript (World, Actor, Pawn, PlayerController, GameMode, GameState, HUD). All inter-system communication via typed SignalBus. Each Actor owns its hover preview and detail modal template. UI panels are standalone HUD components that read GameState.

**Tech Stack:** Vite, TypeScript, CesiumJS, Vitest, CSS Modules (no UI framework)

---

## Task 1: Init Vite + TypeScript project

**Files:**
- Create: `palantir-game/` (project root — all subsequent paths relative to this)
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`

**Step 1: Scaffold the project**

```bash
cd F:/GameDev/threatcom
npm create vite@latest palantir-game -- --template vanilla-ts
cd palantir-game
```

**Step 2: Install dependencies**

```bash
npm install cesium
npm install -D vitest @vitest/ui vite-plugin-static-copy
```

**Step 3: Replace `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'node_modules/cesium/Build/Cesium/Workers', dest: '' },
        { src: 'node_modules/cesium/Build/Cesium/ThirdParty', dest: '' },
        { src: 'node_modules/cesium/Build/Cesium/Assets', dest: '' },
        { src: 'node_modules/cesium/Build/Cesium/Widgets', dest: '' },
      ]
    })
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify('')
  },
  test: {
    environment: 'jsdom'
  }
})
```

**Step 4: Replace `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "lib": ["ES2022", "DOM"],
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@engine/*": ["src/engine/*"],
      "@actors/*": ["src/actors/*"],
      "@signals/*": ["src/signals/*"],
      "@ui/*": ["src/ui/*"],
      "@data/*": ["src/data/*"],
      "@components/*": ["src/components/*"]
    }
  },
  "include": ["src", "vite.config.ts"]
}
```

**Step 5: Add scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

**Step 6: Verify**

```bash
npm run dev
```
Expected: Vite dev server starts, browser opens to blank page, no console errors.

**Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: init Vite + TypeScript + CesiumJS project scaffold"
```

---

## Task 2: Directory structure and src cleanup

**Files:**
- Delete: `src/counter.ts`, `src/typescript.svg`, `src/style.css`
- Create: directory tree under `src/`

**Step 1: Create directory structure**

```bash
mkdir -p src/engine src/actors src/components src/signals src/ui/panels src/game src/data src/styles
```

**Step 2: Create empty barrel files**

```bash
touch src/engine/World.ts src/engine/Actor.ts src/engine/Pawn.ts src/engine/Character.ts
touch src/engine/PlayerController.ts src/engine/GameMode.ts src/engine/GameState.ts
touch src/engine/HUD.ts src/engine/ActorComponent.ts
touch src/actors/ThreatAircraft.ts src/actors/ThreatVessel.ts src/actors/CCTVCamera.ts
touch src/actors/Satellite.ts src/actors/CityMarker.ts src/actors/TargetPerson.ts
touch src/components/ThreatComponent.ts src/components/TrajectoryComponent.ts
touch src/components/DossierComponent.ts src/components/SignalComponent.ts
touch src/signals/SignalBus.ts src/signals/AircraftFeed.ts
touch src/signals/VesselFeed.ts src/signals/SigintSimulator.ts
touch src/ui/ModalStack.ts src/ui/HoverPreview.ts src/ui/DetailModal.ts src/ui/ActionBar.ts
touch src/ui/ThreatVector.ts
touch src/ui/panels/SigintPanel.ts src/ui/panels/CamPanel.ts
touch src/ui/panels/ReconPanel.ts src/ui/panels/ObjectivesPanel.ts
touch src/game/GameLoop.ts
touch src/data/cities.ts src/data/assetTypes.ts
touch src/styles/global.css src/styles/hud.css src/styles/globe.css
touch src/styles/modal.css src/styles/intel-panels.css src/styles/action-bar.css
```

**Step 3: Reset `src/main.ts`**

```typescript
import './styles/global.css'

console.log('[PALANTIR] boot')
```

**Step 4: Reset `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>PALANTIR</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: scaffold src directory structure"
```

---

## Task 3: Global CSS design system

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/styles/hud.css`

**Step 1: Write `src/styles/global.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  --bg-base:       #06080C;
  --bg-surface:    #0A0E14;
  --bg-panel:      #141C28;
  --color-threat:  #FF3838;
  --color-ops:     #00FF88;
  --color-amber:   #FFB800;
  --color-intel:   #3DA5FF;
  --text-primary:  #FFFFFF;
  --text-subtle:   rgba(255,255,255,0.55);
  --border-subtle: rgba(255,255,255,0.10);
  --font-mono:     'JetBrains Mono', monospace;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100%; height: 100%;
  overflow: hidden;
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  -webkit-tap-highlight-color: transparent;
}

#app {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* Globe fills entire viewport */
#globe-container {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* UI layers sit above globe */
#hud-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}
#hud-layer > * { pointer-events: auto; }

/* Modal layer */
#modal-layer {
  position: absolute;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}
#modal-layer > * { pointer-events: auto; }
```

**Step 2: Write `src/styles/hud.css`**

```css
/* Base HUD panel — dark glass with corner bracket decorations */
.hud {
  background: linear-gradient(#141C2899, #0A0E1499);
  border: 1px solid var(--border-subtle);
  border-radius: 2px;
  backdrop-filter: blur(8px);
  position: relative;
  transition: border-color 0.2s;
}

.hud:hover { border-color: rgba(255,56,56,0.3); }

/* Corner brackets — L-shapes at all four corners */
.hud::before, .hud::after, .hud > .corner-bl, .hud > .corner-br {
  content: '';
  pointer-events: none;
  border: 0 solid rgba(255,255,255,0.55);
  width: 10px; height: 10px;
  position: absolute;
}
.hud::before  { border-top-width: 1px; border-left-width:  1px; top: -1px; left:  -1px; }
.hud::after   { border-top-width: 1px; border-right-width: 1px; top: -1px; right: -1px; }
.hud > .corner-bl { border-bottom-width: 1px; border-left-width:  1px; bottom: -1px; left:  -1px; }
.hud > .corner-br { border-bottom-width: 1px; border-right-width: 1px; bottom: -1px; right: -1px; }

/* Colour-keyed corner variants */
.hud-threat::before, .hud-threat::after,
.hud-threat > .corner-bl, .hud-threat > .corner-br { border-color: var(--color-threat); }

.hud-ops::before, .hud-ops::after,
.hud-ops > .corner-bl, .hud-ops > .corner-br    { border-color: var(--color-ops); }

.hud-amber::before, .hud-amber::after,
.hud-amber > .corner-bl, .hud-amber > .corner-br { border-color: var(--color-amber); }

/* Panel header strip */
.hud-meta {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-subtle);
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--border-subtle);
  padding: 6px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Glow variants */
.glow-threat { box-shadow: 0 0 24px #FF383866; }
.glow-ops    { box-shadow: 0 0 24px #00FF884D; }
.glow-amber  { box-shadow: 0 0 24px #FFB8004D; }

/* Scanline CRT overlay */
.scan-overlay { position: relative; overflow: hidden; }
.scan-overlay::after {
  content: '';
  pointer-events: none;
  z-index: 1;
  background: repeating-linear-gradient(rgba(255,255,255,0.04) 0 1px, transparent 1px 3px);
  position: absolute;
  inset: 0;
}

/* Pulse animations */
@keyframes pulse-threat {
  0%, 100% { opacity: 1; box-shadow: 0 0 #FF383899; }
  50%       { opacity: 0.85; box-shadow: 0 0 20px #FF383899; }
}
@keyframes pulse-ops {
  0%, 100% { opacity: 1; box-shadow: 0 0 #00FF8880; }
  50%       { opacity: 0.85; box-shadow: 0 0 20px #00FF8880; }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.animate-pulse-threat { animation: pulse-threat 2s ease-in-out infinite; }
.animate-pulse-ops    { animation: pulse-ops 2.5s ease-in-out infinite; }
.animate-blink        { animation: blink 1.5s ease-in-out infinite; }

/* Touch targets */
button, [role="button"] { min-width: 44px; min-height: 44px; cursor: pointer; }
```

**Step 3: Import hud.css in main.ts**

```typescript
import './styles/global.css'
import './styles/hud.css'
```

**Step 4: Verify**

```bash
npm run dev
```
Expected: Page is solid `#06080C` background, no errors. Inspect computed styles confirm CSS vars applied.

**Step 5: Commit**

```bash
git add src/styles/ src/main.ts
git commit -m "feat: add global design system — colours, HUD panels, glow, scanlines"
```

---

## Task 4: SignalBus — typed event bus

**Files:**
- Modify: `src/signals/SignalBus.ts`
- Create: `src/signals/SignalBus.test.ts`

**Step 1: Define the event map and write the failing test**

```typescript
// src/signals/SignalBus.test.ts
import { describe, it, expect, vi } from 'vitest'
import { SignalBus } from './SignalBus'

describe('SignalBus', () => {
  it('delivers typed events to subscribers', () => {
    const handler = vi.fn()
    SignalBus.on('asset:selected', handler)
    SignalBus.emit('asset:selected', { actorId: 'abc' })
    expect(handler).toHaveBeenCalledWith({ actorId: 'abc' })
  })

  it('on() returns unsubscribe function', () => {
    const handler = vi.fn()
    const unsub = SignalBus.on('modal:close', handler)
    unsub()
    SignalBus.emit('modal:close', { actorId: 'x' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('once() fires exactly one time', () => {
    const handler = vi.fn()
    SignalBus.once('timer:tick', handler)
    SignalBus.emit('timer:tick', { secondsRemaining: 60 })
    SignalBus.emit('timer:tick', { secondsRemaining: 59 })
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
```

**Step 2: Run test — expect failure**

```bash
npm test
```
Expected: FAIL — `SignalBus` not exported.

**Step 3: Implement `src/signals/SignalBus.ts`**

```typescript
export type SignalMap = {
  'asset:selected':        { actorId: string }
  'asset:deselected':      { actorId: string }
  'asset:reached_target':  { actorId: string; cityId: string }
  'modal:open':            { actorId: string; mode: 'hover' | 'detail' }
  'modal:close':           { actorId: string }
  'action:deploy_drone':   { actorId: string }
  'action:signal_jammer':  { actorId: string }
  'action:launch_interceptor': { actorId: string }
  'signal:aircraft_updated':  { assets: unknown[] }
  'signal:vessel_updated':    { assets: unknown[] }
  'signal:intel_event':       { event: unknown }
  'timer:tick':            { secondsRemaining: number }
  'mission:start':         Record<string, never>
  'mission:end':           { outcome: 'success' | 'failure' }
}

type Handler<T> = (data: T) => void

class SignalBusClass {
  private listeners = new Map<string, Set<Handler<unknown>>>()

  on<K extends keyof SignalMap>(event: K, handler: Handler<SignalMap[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    const set = this.listeners.get(event)!
    set.add(handler as Handler<unknown>)
    return () => set.delete(handler as Handler<unknown>)
  }

  once<K extends keyof SignalMap>(event: K, handler: Handler<SignalMap[K]>): void {
    const unsub = this.on(event, (data) => { unsub(); handler(data) })
  }

  emit<K extends keyof SignalMap>(event: K, data: SignalMap[K]): void {
    this.listeners.get(event)?.forEach(h => h(data as unknown))
  }
}

export const SignalBus = new SignalBusClass()
```

**Step 4: Run tests — expect pass**

```bash
npm test
```
Expected: 3 tests PASS.

**Step 5: Commit**

```bash
git add src/signals/SignalBus.ts src/signals/SignalBus.test.ts
git commit -m "feat: add typed SignalBus with subscribe/emit/once"
```

---

## Task 5: GameState — single source of truth

**Files:**
- Modify: `src/engine/GameState.ts`
- Create: `src/engine/GameState.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/GameState.test.ts
import { describe, it, expect } from 'vitest'
import { GameState } from './GameState'

describe('GameState', () => {
  it('initialises with default idle state', () => {
    expect(GameState.snapshot().phase).toBe('IDLE')
    expect(GameState.snapshot().intelScore).toBe(0)
  })

  it('patch() merges partial state', () => {
    GameState.patch({ intelScore: 150 })
    expect(GameState.snapshot().intelScore).toBe(150)
  })

  it('patch() does not affect unrelated fields', () => {
    GameState.patch({ opsUnitsRemaining: 5 })
    expect(GameState.snapshot().phase).toBe('IDLE')
  })
})
```

**Step 2: Run test — expect failure**

```bash
npm test
```

**Step 3: Implement `src/engine/GameState.ts`**

```typescript
export type GamePhase = 'IDLE' | 'ACTIVE' | 'PAUSED' | 'DEBRIEF'

export interface Objective {
  id: string
  label: string
  status: 'ACTIVE' | 'COMPLETE' | 'FAILED'
  linkedActorId?: string
}

export interface State {
  phase: GamePhase
  intelScore: number
  opsUnitsRemaining: number
  secondsRemaining: number
  objectives: Objective[]
  selectedActorId: string | null
}

const defaults: State = {
  phase: 'IDLE',
  intelScore: 0,
  opsUnitsRemaining: 3,
  secondsRemaining: 0,
  objectives: [],
  selectedActorId: null,
}

let _state: State = { ...defaults }

export const GameState = {
  snapshot: (): Readonly<State> => ({ ..._state }),
  patch: (partial: Partial<State>): void => { _state = { ..._state, ...partial } },
  reset: (): void => { _state = { ...defaults } },
}
```

**Step 4: Run tests — expect pass**

```bash
npm test
```

**Step 5: Commit**

```bash
git add src/engine/GameState.ts src/engine/GameState.test.ts
git commit -m "feat: add GameState singleton with typed patch/snapshot"
```

---

## Task 6: Actor base class + ActorComponent

**Files:**
- Modify: `src/engine/ActorComponent.ts`
- Modify: `src/engine/Actor.ts`
- Create: `src/engine/Actor.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/Actor.test.ts
import { describe, it, expect } from 'vitest'
import { Actor } from './Actor'
import { ActorComponent } from './ActorComponent'

class TestComponent extends ActorComponent {
  value = 42
}

class TestActor extends Actor {
  onMount(): void {}
  onUnmount(): void {}
}

describe('Actor', () => {
  it('generates a unique id', () => {
    const a = new TestActor()
    const b = new TestActor()
    expect(a.id).not.toBe(b.id)
  })

  it('addComponent / getComponent round-trips', () => {
    const actor = new TestActor()
    actor.addComponent(new TestComponent())
    expect(actor.getComponent(TestComponent)?.value).toBe(42)
  })

  it('removeComponent removes it', () => {
    const actor = new TestActor()
    actor.addComponent(new TestComponent())
    actor.removeComponent(TestComponent)
    expect(actor.getComponent(TestComponent)).toBeUndefined()
  })
})
```

**Step 2: Run test — expect failure**

```bash
npm test
```

**Step 3: Implement `src/engine/ActorComponent.ts`**

```typescript
export abstract class ActorComponent {
  readonly type: string = this.constructor.name
}
```

**Step 4: Implement `src/engine/Actor.ts`**

```typescript
import type { ActorComponent } from './ActorComponent'
import type { World } from './World'

export abstract class Actor {
  readonly id: string

  private _components = new Map<string, ActorComponent>()

  constructor(id?: string) {
    this.id = id ?? crypto.randomUUID()
  }

  addComponent<T extends ActorComponent>(component: T): T {
    this._components.set(component.constructor.name, component)
    return component
  }

  getComponent<T extends ActorComponent>(type: new (...args: never[]) => T): T | undefined {
    return this._components.get(type.name) as T | undefined
  }

  removeComponent<T extends ActorComponent>(type: new (...args: never[]) => T): void {
    this._components.delete(type.name)
  }

  tick(_deltaTime: number): void {}

  abstract onMount(world: World): void
  abstract onUnmount(world: World): void
}
```

**Step 5: Run tests — expect pass**

```bash
npm test
```

**Step 6: Commit**

```bash
git add src/engine/Actor.ts src/engine/ActorComponent.ts src/engine/Actor.test.ts
git commit -m "feat: add Actor base class with component system"
```

---

## Task 7: Pawn and Character

**Files:**
- Modify: `src/engine/Pawn.ts`
- Modify: `src/engine/Character.ts`

**Step 1: Implement `src/engine/Pawn.ts`**

```typescript
import { Actor } from './Actor'

export abstract class Pawn extends Actor {
  isPossessed = false

  possess(): void { this.isPossessed = true }
  unpossess(): void { this.isPossessed = false }
}
```

**Step 2: Implement `src/engine/Character.ts`**

```typescript
import { Pawn } from './Pawn'

export abstract class Character extends Pawn {
  isAlive = true
  destroy(): void { this.isAlive = false }
}
```

**Step 3: Commit**

```bash
git add src/engine/Pawn.ts src/engine/Character.ts
git commit -m "feat: add Pawn and Character engine classes"
```

---

## Task 8: Cities data

**Files:**
- Modify: `src/data/cities.ts`
- Create: `src/data/cities.test.ts`

**Step 1: Write failing test**

```typescript
// src/data/cities.test.ts
import { describe, it, expect } from 'vitest'
import { CITIES } from './cities'

describe('cities', () => {
  it('has at least 20 entries', () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(20)
  })

  it('every city has valid lat/lng', () => {
    for (const c of CITIES) {
      expect(c.lat).toBeGreaterThanOrEqual(-90)
      expect(c.lat).toBeLessThanOrEqual(90)
      expect(c.lng).toBeGreaterThanOrEqual(-180)
      expect(c.lng).toBeLessThanOrEqual(180)
    }
  })
})
```

**Step 2: Run test — expect failure**

```bash
npm test
```

**Step 3: Implement `src/data/cities.ts`**

```typescript
export type ThreatTier = 1 | 2 | 3

export interface City {
  id: string
  name: string
  lat: number
  lng: number
  tier: ThreatTier
  country: string
}

export const CITIES: City[] = [
  { id: 'moscow',    name: 'MOSCOW',    lat: 55.75,  lng:  37.62,  tier: 1, country: 'RU' },
  { id: 'beijing',   name: 'BEIJING',   lat: 39.91,  lng: 116.39,  tier: 1, country: 'CN' },
  { id: 'tehran',    name: 'TEHRAN',    lat: 35.69,  lng:  51.39,  tier: 1, country: 'IR' },
  { id: 'istanbul',  name: 'ISTANBUL',  lat: 41.01,  lng:  28.95,  tier: 2, country: 'TR' },
  { id: 'karachi',   name: 'KARACHI',   lat: 24.86,  lng:  67.01,  tier: 2, country: 'PK' },
  { id: 'delhi',     name: 'NEW DELHI', lat: 28.61,  lng:  77.23,  tier: 2, country: 'IN' },
  { id: 'riyadh',    name: 'RIYADH',    lat: 24.69,  lng:  46.72,  tier: 2, country: 'SA' },
  { id: 'pyongyang', name: 'PYONGYANG', lat: 39.02,  lng: 125.75,  tier: 1, country: 'KP' },
  { id: 'minsk',     name: 'MINSK',     lat: 53.91,  lng:  27.57,  tier: 2, country: 'BY' },
  { id: 'baku',      name: 'BAKU',      lat: 40.41,  lng:  49.87,  tier: 2, country: 'AZ' },
  { id: 'kabul',     name: 'KABUL',     lat: 34.53,  lng:  69.17,  tier: 1, country: 'AF' },
  { id: 'damascus',  name: 'DAMASCUS',  lat: 33.51,  lng:  36.29,  tier: 1, country: 'SY' },
  { id: 'tripoli',   name: 'TRIPOLI',   lat: 32.90,  lng:  13.18,  tier: 2, country: 'LY' },
  { id: 'khartoum',  name: 'KHARTOUM',  lat: 15.56,  lng:  32.53,  tier: 2, country: 'SD' },
  { id: 'almaty',    name: 'ALMATY',    lat: 43.24,  lng:  76.95,  tier: 3, country: 'KZ' },
  { id: 'tashkent',  name: 'TASHKENT',  lat: 41.30,  lng:  69.24,  tier: 3, country: 'UZ' },
  { id: 'odesa',     name: 'ODESA',     lat: 46.48,  lng:  30.72,  tier: 1, country: 'UA' },
  { id: 'aden',      name: 'ADEN',      lat: 12.78,  lng:  45.04,  tier: 2, country: 'YE' },
  { id: 'murmansk',  name: 'MURMANSK',  lat: 68.97,  lng:  33.07,  tier: 2, country: 'RU' },
  { id: 'vladivostok', name: 'VLADIVOSTOK', lat: 43.12, lng: 131.88, tier: 2, country: 'RU' },
  { id: 'latakia',   name: 'LATAKIA',   lat: 35.52,  lng:  35.79,  tier: 1, country: 'SY' },
  { id: 'bandar',    name: 'BANDAR ABBAS', lat: 27.19, lng: 56.27, tier: 2, country: 'IR' },
  { id: 'donetsk',   name: 'DONETSK',   lat: 48.00,  lng:  37.80,  tier: 1, country: 'UA' },
  { id: 'simferopol', name: 'SIMFEROPOL', lat: 44.95, lng: 34.10,  tier: 1, country: 'UA' },
  { id: 'dushanbe',  name: 'DUSHANBE',  lat: 38.56,  lng:  68.77,  tier: 3, country: 'TJ' },
  { id: 'yerevan',   name: 'YEREVAN',   lat: 40.18,  lng:  44.51,  tier: 3, country: 'AM' },
  { id: 'tbilisi',   name: 'TBILISI',   lat: 41.69,  lng:  44.83,  tier: 3, country: 'GE' },
  { id: 'aleppo',    name: 'ALEPPO',    lat: 36.20,  lng:  37.16,  tier: 1, country: 'SY' },
  { id: 'mosul',     name: 'MOSUL',     lat: 36.34,  lng:  43.12,  tier: 1, country: 'IQ' },
  { id: 'benghazi',  name: 'BENGHAZI',  lat: 32.12,  lng:  20.07,  tier: 2, country: 'LY' },
]
```

**Step 4: Run tests — expect pass**

```bash
npm test
```

**Step 5: Commit**

```bash
git add src/data/cities.ts src/data/cities.test.ts
git commit -m "feat: add 30 real city definitions with lat/lng and threat tier"
```

---

## Task 9: Asset type definitions

**Files:**
- Modify: `src/data/assetTypes.ts`

**Step 1: Implement**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/data/assetTypes.ts
git commit -m "feat: add ThreatAsset and IntelEvent type definitions"
```

---

## Task 10: World.ts — CesiumJS globe

**Files:**
- Modify: `src/engine/World.ts`
- Modify: `src/main.ts`
- Modify: `src/styles/globe.css`
- Modify: `index.html`

**Step 1: Write `src/styles/globe.css`**

```css
/* Strip all Cesium default UI chrome */
.cesium-widget-credits,
.cesium-viewer-toolbar,
.cesium-viewer-animationContainer,
.cesium-viewer-timelineContainer,
.cesium-viewer-bottom { display: none !important; }

#globe-container canvas { outline: none; }
```

**Step 2: Implement `src/engine/World.ts`**

```typescript
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import type { Actor } from './Actor'

// Free Cesium ion token — replace with project token for production
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk'

export class World {
  private viewer!: Cesium.Viewer
  private actors = new Map<string, Actor>()
  private lastTime = performance.now()
  private rafHandle = 0

  init(container: HTMLElement): void {
    this.viewer = new Cesium.Viewer(container, {
      baseLayer: Cesium.ImageryLayer.fromProviderAsync(
        Cesium.IonImageryProvider.fromAssetId(3954)  // Bing Maps Aerial
      ),
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      infoBox: false,
      selectionIndicator: false,
      scene3DOnly: true,
    })

    // Dark space background
    this.viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#06080C')
    this.viewer.scene.globe.enableLighting = true

    // Initial camera — Central Asia / Europe tilt
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(55.0, 45.0, 8_000_000),
      orientation: { heading: 0, pitch: -0.6, roll: 0 }
    })

    this.startTick()
  }

  spawnActor(actor: Actor): void {
    this.actors.set(actor.id, actor)
    actor.onMount(this)
  }

  destroyActor(id: string): void {
    const actor = this.actors.get(id)
    if (!actor) return
    actor.onUnmount(this)
    this.actors.delete(id)
  }

  getActor(id: string): Actor | undefined {
    return this.actors.get(id)
  }

  getViewer(): Cesium.Viewer {
    return this.viewer
  }

  private startTick(): void {
    const tick = (now: number) => {
      const delta = (now - this.lastTime) / 1000
      this.lastTime = now
      for (const actor of this.actors.values()) actor.tick(delta)
      this.rafHandle = requestAnimationFrame(tick)
    }
    this.rafHandle = requestAnimationFrame(tick)
  }

  dispose(): void {
    cancelAnimationFrame(this.rafHandle)
    this.viewer.destroy()
  }
}
```

**Step 3: Update `src/main.ts`**

```typescript
import './styles/global.css'
import './styles/hud.css'
import './styles/globe.css'
import { World } from './engine/World'

const app = document.getElementById('app')!
app.innerHTML = `
  <div id="globe-container"></div>
  <div id="hud-layer"></div>
  <div id="modal-layer"></div>
`

const world = new World()
world.init(document.getElementById('globe-container')!)
```

**Step 4: Run manually in browser**

```bash
npm run dev
```
Expected: 3D globe renders covering full viewport, all Cesium UI chrome hidden, background is near-black space. Globe responds to mouse drag/pinch.

**Step 5: Commit**

```bash
git add src/engine/World.ts src/main.ts src/styles/globe.css
git commit -m "feat: CesiumJS globe with dark theme and initial camera over Central Asia"
```

---

## Task 11: CityMarker actor

**Files:**
- Modify: `src/actors/CityMarker.ts`
- Modify: `src/data/cities.ts` (import type)

**Step 1: Implement `src/actors/CityMarker.ts`**

```typescript
import * as Cesium from 'cesium'
import { Actor } from '../engine/Actor'
import type { World } from '../engine/World'
import type { City } from '../data/cities'

export class CityMarker extends Actor {
  private city: City
  private entity: Cesium.Entity | null = null

  constructor(city: City) {
    super(city.id)
    this.city = city
  }

  onMount(world: World): void {
    const viewer = world.getViewer()
    this.entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(this.city.lng, this.city.lat),
      label: {
        text: this.city.name,
        font: '10px JetBrains Mono',
        fillColor: Cesium.Color.fromCssColorString('#FFFFFF8C'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      point: {
        pixelSize: 4,
        color: Cesium.Color.fromCssColorString('#FFFFFF40'),
        outlineColor: Cesium.Color.fromCssColorString('#FFFFFF20'),
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      }
    })
  }

  onUnmount(world: World): void {
    if (this.entity) world.getViewer().entities.remove(this.entity)
  }

  setThreatInbound(inbound: boolean): void {
    if (!this.entity?.point) return
    this.entity.point.color = new Cesium.ConstantProperty(
      Cesium.Color.fromCssColorString(inbound ? '#FF383880' : '#FFFFFF40')
    )
  }
}
```

**Step 2: Spawn city markers in `src/main.ts`**

```typescript
import { CITIES } from './data/cities'
import { CityMarker } from './actors/CityMarker'

// After world.init(...)
for (const city of CITIES) {
  world.spawnActor(new CityMarker(city))
}
```

**Step 3: Verify in browser**

Expected: 30 city labels visible on globe at correct real-world positions. Labels are subtle white, small font.

**Step 4: Commit**

```bash
git add src/actors/CityMarker.ts src/main.ts
git commit -m "feat: spawn CityMarker actors for 30 real cities on globe"
```

---

## Task 12: AircraftFeed — OpenSky normalizer

**Files:**
- Modify: `src/signals/AircraftFeed.ts`
- Create: `src/signals/AircraftFeed.test.ts`

**Step 1: Write failing test**

```typescript
// src/signals/AircraftFeed.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeOpenSkyState } from './AircraftFeed'

describe('normalizeOpenSkyState', () => {
  it('returns null for states with no position', () => {
    const raw = ['ABC123', 'TESTFLT', 'GB', 0, 0, null, null, null, false, null, null, null, null, null, 0, null, false]
    expect(normalizeOpenSkyState(raw)).toBeNull()
  })

  it('normalizes a valid state vector', () => {
    const raw = ['ABC123', 'RYANAIR1', 'GB', 0, 1000, 40.5, 35.2, 8000, false, 250, 90, 0, null, null, 0, null, false]
    const result = normalizeOpenSkyState(raw)
    expect(result).not.toBeNull()
    expect(result?.type).toBe('JET')
    expect(result?.vectorType).toBe('AIR')
    expect(result?.realWorldCallsign).toBe('RYANAIR1')
    expect(result?.lat).toBe(40.5)
    expect(result?.lng).toBe(35.2)
  })
})
```

**Step 2: Run test — expect failure**

```bash
npm test
```

**Step 3: Implement `src/signals/AircraftFeed.ts`**

```typescript
import type { ThreatAsset } from '../data/assetTypes'
import { SignalBus } from './SignalBus'
import { CITIES } from '../data/cities'

const BBOX = { minLat: 30, maxLat: 70, minLng: 20, maxLng: 90 }
const MAX_AIRCRAFT = 8
const POLL_MS = 15_000

// OpenSky state vector: [icao24, callsign, origin_country, time_position, last_contact,
//   longitude, latitude, baro_altitude, on_ground, velocity, true_track, vertical_rate,
//   sensors, geo_altitude, squawk, spi, position_source]
type OpenSkyState = (string | number | boolean | null)[]

export function normalizeOpenSkyState(state: OpenSkyState): ThreatAsset | null {
  const [icao24, callsign, , , , lng, lat, alt, onGround, velocity, heading] = state
  if (lat == null || lng == null || onGround === true) return null

  const nearestCity = findNearestCity(lat as number, lng as number)

  return {
    id: `aircraft-${icao24}`,
    type: 'JET',
    lat: lat as number,
    lng: lng as number,
    altitudeM: (alt as number) ?? 0,
    headingDeg: (heading as number) ?? 0,
    speedKnots: velocity ? Math.round((velocity as number) * 1.944) : 0,
    label: `ENEMY JET`,
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

  start(): void {
    this.poll()
    this.handle = window.setInterval(() => this.poll(), POLL_MS)
  }

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
      // Network errors are expected — silently skip
    }
  }
}
```

**Step 4: Run tests — expect pass**

```bash
npm test
```

**Step 5: Commit**

```bash
git add src/signals/AircraftFeed.ts src/signals/AircraftFeed.test.ts
git commit -m "feat: OpenSky AircraftFeed with normalization and SignalBus emission"
```

---

## Task 13: ThreatAircraft actor

**Files:**
- Modify: `src/actors/ThreatAircraft.ts`

**Step 1: Implement**

```typescript
import * as Cesium from 'cesium'
import { Pawn } from '../engine/Pawn'
import type { World } from '../engine/World'
import type { ThreatAsset } from '../data/assetTypes'
import { SignalBus } from '../signals/SignalBus'

export class ThreatAircraft extends Pawn {
  private asset: ThreatAsset
  private entity: Cesium.Entity | null = null
  private viewer: Cesium.Viewer | null = null

  constructor(asset: ThreatAsset) {
    super(asset.id)
    this.asset = asset
  }

  onMount(world: World): void {
    this.viewer = world.getViewer()
    this.entity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(this.asset.lng, this.asset.lat, this.asset.altitudeM),
      point: {
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString('#FF3838'),
        outlineColor: Cesium.Color.fromCssColorString('#FF383866'),
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: this.asset.realWorldCallsign ?? 'ENEMY JET',
        font: '10px JetBrains Mono',
        fillColor: Cesium.Color.fromCssColorString('#FF3838'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(12, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      }
    })

    // Click handler
    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas)
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = this.viewer?.scene.pick(click.position)
      if (Cesium.defined(picked) && picked.id === this.entity) {
        SignalBus.emit('asset:selected', { actorId: this.id })
        SignalBus.emit('modal:open', { actorId: this.id, mode: 'detail' })
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  updatePosition(asset: ThreatAsset): void {
    this.asset = asset
    if (!this.entity) return
    this.entity.position = new Cesium.ConstantPositionProperty(
      Cesium.Cartesian3.fromDegrees(asset.lng, asset.lat, asset.altitudeM)
    )
  }

  onUnmount(world: World): void {
    if (this.entity) world.getViewer().entities.remove(this.entity)
  }
}
```

**Step 2: Wire feed → actors in `src/main.ts`**

```typescript
import { AircraftFeed } from './signals/AircraftFeed'
import { ThreatAircraft } from './actors/ThreatAircraft'
import type { ThreatAsset } from './data/assetTypes'

const aircraftFeed = new AircraftFeed()
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

aircraftFeed.start()
```

**Step 3: Verify in browser**

Expected: After a few seconds, red dots appear on the globe over Europe/Central Asia with callsign labels. They update position every 15s.

**Step 4: Commit**

```bash
git add src/actors/ThreatAircraft.ts src/main.ts
git commit -m "feat: ThreatAircraft actor renders real OpenSky aircraft as red dots on globe"
```

---

## Task 14: HUD panel — Intel / Ops / Time

**Files:**
- Modify: `src/engine/HUD.ts`
- Create: `src/ui/panels/HUDCounters.ts`
- Modify: `src/styles/hud.css` (additions)

**Step 1: Implement `src/ui/panels/HUDCounters.ts`**

```typescript
import { GameState } from '../../engine/GameState'
import { SignalBus } from '../../signals/SignalBus'

export class HUDCounters {
  private el: HTMLElement

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'hud hud-meta-panel'
    this.el.innerHTML = `
      <div class="corner-bl"></div><div class="corner-br"></div>
      <div class="hud-meta">PALANTIR — ACTIVE</div>
      <div class="hud-counters">
        <div class="hud-stat">
          <span class="hud-label">INTEL</span>
          <span class="hud-value" id="stat-intel">0</span>
        </div>
        <div class="hud-stat">
          <span class="hud-label">OPS UNITS</span>
          <span class="hud-value hud-ops" id="stat-ops">3</span>
        </div>
        <div class="hud-stat">
          <span class="hud-label">TIME LEFT</span>
          <span class="hud-value hud-threat animate-blink" id="stat-time">--:--</span>
        </div>
      </div>
    `

    SignalBus.on('timer:tick', ({ secondsRemaining }) => {
      const m = Math.floor(secondsRemaining / 60).toString().padStart(2, '0')
      const s = (secondsRemaining % 60).toString().padStart(2, '0')
      this.el.querySelector('#stat-time')!.textContent = `${m}:${s}`
    })
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.el)
  }

  refresh(): void {
    const state = GameState.snapshot()
    const intel = this.el.querySelector('#stat-intel')!
    const ops = this.el.querySelector('#stat-ops')!
    if (intel.textContent !== String(state.intelScore)) intel.textContent = String(state.intelScore)
    if (ops.textContent !== String(state.opsUnitsRemaining)) ops.textContent = String(state.opsUnitsRemaining)
  }
}
```

**Step 2: Add HUD counter styles to `src/styles/hud.css`**

```css
.hud-meta-panel {
  position: absolute;
  top: 16px; right: 16px;
  min-width: 200px;
  padding-bottom: 12px;
}

.hud-counters {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px 0;
}

.hud-stat {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
}

.hud-label {
  font-size: 10px;
  letter-spacing: 0.15em;
  color: var(--text-subtle);
  text-transform: uppercase;
}

.hud-value {
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.hud-value.hud-ops    { color: var(--color-ops); }
.hud-value.hud-threat { color: var(--color-threat); }
```

**Step 3: Mount in `src/main.ts`**

```typescript
import { HUDCounters } from './ui/panels/HUDCounters'

const hudLayer = document.getElementById('hud-layer')!
const hudCounters = new HUDCounters()
hudCounters.mount(hudLayer)
```

**Step 4: Verify**

Expected: Top-right corner shows Intel/Ops Units/Time Left panel with corner brackets and dark glass background.

**Step 5: Commit**

```bash
git add src/ui/panels/HUDCounters.ts src/styles/hud.css src/main.ts
git commit -m "feat: HUD counters panel — Intel, Ops Units, Time Left"
```

---

## Task 15: Objectives panel

**Files:**
- Modify: `src/ui/panels/ObjectivesPanel.ts`

**Step 1: Implement**

```typescript
import type { Objective } from '../../engine/GameState'
import { GameState } from '../../engine/GameState'

export class ObjectivesPanel {
  private el: HTMLElement

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'hud hud-threat objectives-panel'
    this.el.innerHTML = `
      <div class="corner-bl"></div><div class="corner-br"></div>
      <div class="hud-meta">◄ OBJECTIVES</div>
      <ul class="objectives-list" id="objectives-list"></ul>
    `
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.el)
    this.render()
  }

  render(): void {
    const list = this.el.querySelector('#objectives-list')!
    const { objectives } = GameState.snapshot()

    if (objectives.length === 0) {
      list.innerHTML = '<li class="objective-item objective-idle">AWAITING MISSION DATA</li>'
      return
    }

    list.innerHTML = objectives.map(o => `
      <li class="objective-item objective-${o.status.toLowerCase()}">
        <span class="objective-bullet">►</span>
        <span class="objective-label">${o.label}</span>
      </li>
    `).join('')
  }
}
```

**Step 2: Add styles to `src/styles/hud.css`**

```css
.objectives-panel {
  position: absolute;
  top: 16px; left: 16px;
  min-width: 220px;
  max-width: 260px;
  padding-bottom: 12px;
}

.objectives-list {
  list-style: none;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.objective-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  line-height: 1.4;
}

.objective-bullet { color: var(--color-threat); flex-shrink: 0; }
.objective-label  { color: var(--text-primary); }
.objective-idle   { color: var(--text-subtle); font-style: italic; }

.objective-complete .objective-label {
  text-decoration: line-through;
  color: var(--color-ops);
}
.objective-complete .objective-bullet { color: var(--color-ops); }

.objective-failed .objective-label  { color: var(--text-subtle); }
.objective-failed .objective-bullet { color: var(--text-subtle); }
```

**Step 3: Mount in `src/main.ts`**

```typescript
import { ObjectivesPanel } from './ui/panels/ObjectivesPanel'
const objectives = new ObjectivesPanel()
objectives.mount(hudLayer)
```

**Step 4: Verify**

Expected: Top-left corner panel with red corners, "◄ OBJECTIVES" header, "AWAITING MISSION DATA" placeholder.

**Step 5: Commit**

```bash
git add src/ui/panels/ObjectivesPanel.ts src/styles/hud.css src/main.ts
git commit -m "feat: Objectives panel with threat-red corner brackets"
```

---

## Task 16: Intel panels — SIGINT, Traffic Cam, Recon Team

**Files:**
- Modify: `src/ui/panels/SigintPanel.ts`
- Modify: `src/ui/panels/CamPanel.ts`
- Modify: `src/ui/panels/ReconPanel.ts`
- Modify: `src/styles/intel-panels.css`

**Step 1: Write `src/styles/intel-panels.css`**

```css
.intel-strip {
  position: absolute;
  bottom: 48px; /* above action bar */
  left: 0; right: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
  padding: 0 4px;
  height: 180px;
}

.intel-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* SIGINT terminal */
.sigint-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--color-ops);
  background: #000;
}

.sigint-line { margin-bottom: 2px; }
.sigint-line.redacted { color: rgba(0,255,136,0.3); }
.sigint-timestamp { color: rgba(0,255,136,0.5); margin-right: 6px; }

/* Cam panel */
.cam-body {
  flex: 1;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-size: 11px;
  color: var(--text-subtle);
}

.cam-alert {
  position: absolute;
  bottom: 8px; left: 8px; right: 8px;
  background: rgba(255,56,56,0.15);
  border: 1px solid var(--color-threat);
  color: var(--color-threat);
  font-size: 11px;
  letter-spacing: 0.1em;
  padding: 4px 8px;
  text-align: center;
  display: none;
}
.cam-alert.visible { display: block; }

/* Recon panel */
.recon-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
}

.recon-status {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.recon-status.standing-by { color: var(--color-ops); }
.recon-status.on-mission  { color: var(--color-amber); }
.recon-status.compromised { color: var(--color-threat); animation: pulse-threat 1s infinite; }

/* Panel action buttons */
.intel-action {
  display: block;
  width: calc(100% - 16px);
  margin: 0 8px 8px;
  padding: 8px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-subtle);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 36px;
}
.intel-action:hover:not(:disabled) {
  border-color: var(--color-threat);
  color: var(--color-threat);
  background: rgba(255,56,56,0.06);
}
.intel-action.active {
  border-color: var(--color-ops);
  color: var(--color-ops);
  background: rgba(0,255,136,0.06);
}
.intel-action:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
```

**Step 2: Implement `src/ui/panels/SigintPanel.ts`**

```typescript
export class SigintPanel {
  private el: HTMLElement
  private logEl!: HTMLElement

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'hud hud-ops intel-panel scan-overlay'
    this.el.innerHTML = `
      <div class="corner-bl"></div><div class="corner-br"></div>
      <div class="hud-meta">
        <span>SIGINT ANALYSIS</span>
        <span class="animate-blink" style="color:var(--color-ops)">● LIVE</span>
      </div>
      <div class="sigint-body" id="sigint-log"></div>
      <button class="intel-action" id="sigint-trace">TRACE SIGNAL →</button>
    `
    this.logEl = this.el.querySelector('#sigint-log')!
  }

  appendLine(text: string, redacted = false): void {
    const ts = new Date().toISOString().slice(11, 19)
    const line = document.createElement('div')
    line.className = `sigint-line${redacted ? ' redacted' : ''}`
    line.innerHTML = `<span class="sigint-timestamp">${ts}</span>${text}`
    this.logEl.appendChild(line)
    this.logEl.scrollTop = this.logEl.scrollHeight
    // Cap at 100 lines
    while (this.logEl.children.length > 100) this.logEl.removeChild(this.logEl.firstChild!)
  }

  mount(parent: HTMLElement): void { parent.appendChild(this.el) }
}
```

**Step 3: Implement `src/ui/panels/CamPanel.ts`**

```typescript
export class CamPanel {
  private el: HTMLElement
  private alertEl!: HTMLElement

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'hud hud-threat intel-panel scan-overlay'
    this.el.innerHTML = `
      <div class="corner-bl"></div><div class="corner-br"></div>
      <div class="hud-meta">
        <span id="cam-title">TRAFFIC CAM</span>
        <span style="color:var(--text-subtle);font-size:9px">NO SIGNAL</span>
      </div>
      <div class="cam-body">
        <span style="letter-spacing:0.1em;font-size:10px">STANDBY</span>
        <div class="cam-alert" id="cam-alert"></div>
      </div>
      <button class="intel-action" id="cam-engage" disabled>ENGAGE</button>
    `
    this.alertEl = this.el.querySelector('#cam-alert')!
  }

  showAlert(text: string): void {
    this.alertEl.textContent = text
    this.alertEl.classList.add('visible')
    const btn = this.el.querySelector('#cam-engage') as HTMLButtonElement
    btn.disabled = false
    btn.classList.add('active')
  }

  clearAlert(): void {
    this.alertEl.classList.remove('visible')
    const btn = this.el.querySelector('#cam-engage') as HTMLButtonElement
    btn.disabled = true
    btn.classList.remove('active')
  }

  mount(parent: HTMLElement): void { parent.appendChild(this.el) }
}
```

**Step 4: Implement `src/ui/panels/ReconPanel.ts`**

```typescript
import { GameState } from '../../engine/GameState'
import { SignalBus } from '../../signals/SignalBus'

export type ReconStatus = 'STANDING BY' | 'ON MISSION' | 'COMPROMISED'

export class ReconPanel {
  private el: HTMLElement
  private statusEl!: HTMLElement

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'hud hud-amber intel-panel'
    this.el.innerHTML = `
      <div class="corner-bl"></div><div class="corner-br"></div>
      <div class="hud-meta">
        <span>RECON TEAM</span>
        <span style="color:var(--color-amber)">ALPHA-7</span>
      </div>
      <div class="recon-body">
        <div class="recon-portrait">
          <svg width="48" height="60" viewBox="0 0 48 60" fill="none">
            <circle cx="24" cy="18" r="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <path d="M4 56 Q4 36 24 36 Q44 36 44 56" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
          </svg>
        </div>
        <div class="recon-status standing-by" id="recon-status">STANDING BY</div>
      </div>
      <button class="intel-action" id="recon-deploy">DEPLOY TEAM</button>
    `
    this.statusEl = this.el.querySelector('#recon-status')!

    this.el.querySelector('#recon-deploy')!.addEventListener('click', () => {
      SignalBus.emit('action:deploy_drone', { actorId: GameState.snapshot().selectedActorId ?? '' })
    })
  }

  setStatus(status: ReconStatus): void {
    this.statusEl.textContent = status
    this.statusEl.className = `recon-status ${status.toLowerCase().replace(' ', '-')}`
    const btn = this.el.querySelector('#recon-deploy') as HTMLButtonElement
    btn.disabled = GameState.snapshot().opsUnitsRemaining === 0 || status === 'ON MISSION'
  }

  mount(parent: HTMLElement): void { parent.appendChild(this.el) }
}
```

**Step 5: Mount all three in `src/main.ts`**

```typescript
import { SigintPanel } from './ui/panels/SigintPanel'
import { CamPanel } from './ui/panels/CamPanel'
import { ReconPanel } from './ui/panels/ReconPanel'
import './styles/intel-panels.css'

const intelStrip = document.createElement('div')
intelStrip.className = 'intel-strip'

const sigint = new SigintPanel()
const cam = new CamPanel()
const recon = new ReconPanel()

sigint.mount(intelStrip)
cam.mount(intelStrip)
recon.mount(intelStrip)
hudLayer.appendChild(intelStrip)
```

**Step 6: Verify**

Expected: Three equal-width panels at bottom of screen — SIGINT (green terminal), Traffic Cam (dark standby), Recon Team (amber with silhouette). All have corner brackets.

**Step 7: Commit**

```bash
git add src/ui/panels/SigintPanel.ts src/ui/panels/CamPanel.ts src/ui/panels/ReconPanel.ts
git add src/styles/intel-panels.css src/main.ts
git commit -m "feat: three intel panels — SIGINT terminal, Traffic Cam, Recon Team"
```

---

## Task 17: Action bar + Threat Vector legend

**Files:**
- Modify: `src/ui/ActionBar.ts`
- Modify: `src/ui/ThreatVector.ts`
- Modify: `src/styles/action-bar.css`

**Step 1: Write `src/styles/action-bar.css`**

```css
.action-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(6,8,12,0.9);
  border-top: 1px solid var(--border-subtle);
  padding: 0 12px;
}

.action-buttons { display: flex; gap: 4px; }

.action-btn {
  height: 36px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-subtle);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  white-space: nowrap;
  min-width: 44px;
}

.action-btn::before { content: '✓'; color: var(--color-ops); }

.action-btn:not(:disabled):hover {
  border-color: var(--color-ops);
  color: var(--color-ops);
  background: rgba(0,255,136,0.06);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.action-btn:disabled::before { color: var(--text-subtle); }

/* Threat Vector legend */
.threat-vector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 9px;
  letter-spacing: 0.15em;
  color: var(--text-subtle);
}

.threat-vector-label { text-transform: uppercase; margin-right: 4px; }

.vector-indicator {
  padding: 2px 6px;
  border: 1px solid var(--border-subtle);
  text-transform: uppercase;
  font-size: 9px;
  letter-spacing: 0.12em;
  color: var(--text-subtle);
  transition: all 0.2s;
}

.vector-indicator.active {
  border-color: var(--color-threat);
  color: var(--color-threat);
  background: rgba(255,56,56,0.08);
  animation: pulse-threat 2s ease-in-out infinite;
}
```

**Step 2: Implement `src/ui/ActionBar.ts`**

```typescript
import { SignalBus } from '../signals/SignalBus'
import { GameState } from '../engine/GameState'

export class ActionBar {
  private el: HTMLElement

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'action-bar'
    this.el.innerHTML = `
      <div class="action-buttons">
        <button class="action-btn" id="btn-drone"       disabled>DEPLOY DRONE</button>
        <button class="action-btn" id="btn-jammer"      disabled>ACTIVATE SIGNAL JAMMER</button>
        <button class="action-btn" id="btn-interceptor" disabled>LAUNCH INTERCEPTOR</button>
      </div>
    `

    this.el.querySelector('#btn-drone')!.addEventListener('click', () => {
      const id = GameState.snapshot().selectedActorId ?? ''
      SignalBus.emit('action:deploy_drone', { actorId: id })
    })
    this.el.querySelector('#btn-jammer')!.addEventListener('click', () => {
      const id = GameState.snapshot().selectedActorId ?? ''
      SignalBus.emit('action:signal_jammer', { actorId: id })
    })
    this.el.querySelector('#btn-interceptor')!.addEventListener('click', () => {
      const id = GameState.snapshot().selectedActorId ?? ''
      SignalBus.emit('action:launch_interceptor', { actorId: id })
    })

    SignalBus.on('asset:selected', () => this.enableButtons(true))
    SignalBus.on('asset:deselected', () => this.enableButtons(false))
  }

  private enableButtons(enabled: boolean): void {
    const ops = GameState.snapshot().opsUnitsRemaining
    for (const btn of this.el.querySelectorAll<HTMLButtonElement>('.action-btn')) {
      btn.disabled = !enabled || ops === 0
    }
  }

  mount(parent: HTMLElement): void { parent.appendChild(this.el) }
}
```

**Step 3: Implement `src/ui/ThreatVector.ts`**

```typescript
import { SignalBus } from '../signals/SignalBus'
import type { ThreatAsset } from '../data/assetTypes'

export class ThreatVector {
  private el: HTMLElement
  private indicators = new Map<string, HTMLElement>()

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'threat-vector'
    this.el.innerHTML = `
      <span class="threat-vector-label">THREAT VECTOR:</span>
      <span class="vector-indicator" data-type="AIR">AIR</span>
      <span class="vector-indicator" data-type="LAND">LAND</span>
      <span class="vector-indicator" data-type="SEA">SEA</span>
    `

    for (const el of this.el.querySelectorAll<HTMLElement>('.vector-indicator')) {
      this.indicators.set(el.dataset['type']!, el)
    }

    SignalBus.on('signal:aircraft_updated', ({ assets }) => {
      this.update('AIR', (assets as ThreatAsset[]).length > 0)
    })
    SignalBus.on('signal:vessel_updated', ({ assets }) => {
      this.update('SEA', (assets as ThreatAsset[]).length > 0)
    })
  }

  update(type: string, active: boolean): void {
    this.indicators.get(type)?.classList.toggle('active', active)
  }

  mount(parent: HTMLElement): void { parent.appendChild(this.el) }
}
```

**Step 4: Mount in `src/main.ts`**

```typescript
import { ActionBar } from './ui/ActionBar'
import { ThreatVector } from './ui/ThreatVector'
import './styles/action-bar.css'

const actionBar = document.createElement('div')
actionBar.className = 'action-bar'
const actions = new ActionBar()
const threatVec = new ThreatVector()

// Rebuild action bar with both children
const bar = document.createElement('div')
bar.className = 'action-bar'
actions.mount(bar)   // mounts inner buttons div
threatVec.mount(bar) // mounts threat vector legend
hudLayer.appendChild(bar)
```

**Step 5: Verify**

Expected: Bottom strip with three action buttons (disabled), Threat Vector AIR lights up orange when aircraft feed returns data.

**Step 6: Commit**

```bash
git add src/ui/ActionBar.ts src/ui/ThreatVector.ts src/styles/action-bar.css src/main.ts
git commit -m "feat: Action bar and Threat Vector legend wired to SignalBus"
```

---

## Task 18: SigintSimulator — synthetic intel events

**Files:**
- Modify: `src/signals/SigintSimulator.ts`
- Create: `src/signals/SigintSimulator.test.ts`

**Step 1: Write failing test**

```typescript
// src/signals/SigintSimulator.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SigintSimulator } from './SigintSimulator'

describe('SigintSimulator', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('generates events with required fields', () => {
    const sim = new SigintSimulator()
    const event = sim.generateEvent()
    expect(event.id).toBeTruthy()
    expect(event.type).toBe('SIGINT')
    expect(event.headline.length).toBeGreaterThan(0)
    expect(event.severity).toMatch(/INFO|ALERT|URGENT/)
  })
})
```

**Step 2: Run test — expect failure**

```bash
npm test
```

**Step 3: Implement `src/signals/SigintSimulator.ts`**

```typescript
import type { IntelEvent } from '../data/assetTypes'
import { SignalBus } from './SignalBus'
import { GameState } from '../engine/GameState'

const CALLSIGNS = ['BLACKWIRE-1', 'SABER-ECHO', 'PHANTOM-7', 'GHOST-ACTUAL', 'VECTOR-ZULU', 'IRON-DELTA']
const FREQUENCIES = ['14.285 MHz', '7.030 MHz', '21.350 MHz', '3.710 MHz', '28.450 MHz']
const MESSAGES = [
  'PACKAGE DELIVERY CONFIRMED — AWAIT SECONDARY SIGNAL',
  'RENDEZVOUS AT [REDACTED] — 0300 LOCAL',
  'ASSET IN POSITION — STANDING BY FOR AUTHORIZATION',
  '[ENCRYPTED] ██████ ACKNOWLEDGED — PROCEEDING',
  'ABORT PROTOCOL SIERRA — COMPROMISED CHANNEL',
  'CONTACT ESTABLISHED — TRANSFERRING COORDINATES',
  'BLACKOUT WINDOW OPENS IN [REDACTED] HOURS',
  'ACKNOWLEDGE RECEIPT — ONE TIME PAD EXHAUSTED',
]

let _seq = 0

export class SigintSimulator {
  private handle = 0

  generateEvent(): IntelEvent {
    const severity = Math.random() < 0.2 ? 'URGENT' : Math.random() < 0.5 ? 'ALERT' : 'INFO'
    const callsign = CALLSIGNS[Math.floor(Math.random() * CALLSIGNS.length)]!
    const freq = FREQUENCIES[Math.floor(Math.random() * FREQUENCIES.length)]!
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]!
    const { threats } = GameState.snapshot() as { threats?: { id: string }[] }
    const linkedActor = threats?.length ? threats[Math.floor(Math.random() * threats.length)]!.id : null

    return {
      id: `sigint-${++_seq}`,
      type: 'SIGINT',
      timestamp: Date.now(),
      actorId: linkedActor ?? null,
      headline: `INTERCEPT — ${callsign} @ ${freq}`,
      bodyText: `${callsign}: ${msg}`,
      severity,
      hasAction: severity !== 'INFO',
      actionLabel: severity !== 'INFO' ? 'TRACE SIGNAL' : null,
    }
  }

  start(): void {
    this.scheduleNext()
  }

  stop(): void { clearTimeout(this.handle) }

  private scheduleNext(): void {
    const delay = 8_000 + Math.random() * 12_000 // 8-20s
    this.handle = window.setTimeout(() => {
      const event = this.generateEvent()
      SignalBus.emit('signal:intel_event', { event })
      this.scheduleNext()
    }, delay)
  }
}
```

**Step 4: Run tests — expect pass**

```bash
npm test
```

**Step 5: Wire to SIGINT panel in `src/main.ts`**

```typescript
import { SigintSimulator } from './signals/SigintSimulator'
import type { IntelEvent } from './data/assetTypes'

const simulator = new SigintSimulator()

SignalBus.on('signal:intel_event', ({ event }) => {
  const e = event as IntelEvent
  sigint.appendLine(e.bodyText, e.severity === 'INFO')
})

simulator.start()
```

**Step 6: Verify**

Expected: SIGINT terminal starts populating with intercepted comms every 8-20 seconds.

**Step 7: Commit**

```bash
git add src/signals/SigintSimulator.ts src/signals/SigintSimulator.test.ts src/main.ts
git commit -m "feat: SigintSimulator generates synthetic intercepts wired to SIGINT panel"
```

---

## Task 19: ModalStack + HoverPreview

**Files:**
- Modify: `src/ui/ModalStack.ts`
- Modify: `src/ui/HoverPreview.ts`
- Modify: `src/styles/modal.css`

**Step 1: Write `src/styles/modal.css`**

```css
/* Hover preview */
.hover-preview {
  position: absolute;
  pointer-events: none;
  z-index: 40;
  min-width: 180px;
  max-width: 260px;
  padding-bottom: 8px;
  transition: opacity 0.15s;
}
.hover-preview.hidden { opacity: 0; }

.hover-preview-body {
  padding: 8px 12px;
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hover-threat-badge {
  display: inline-block;
  padding: 1px 6px;
  font-size: 9px;
  letter-spacing: 0.12em;
  border: 1px solid currentColor;
  text-transform: uppercase;
}
.badge-low      { color: var(--color-ops); }
.badge-medium   { color: var(--color-amber); }
.badge-high, .badge-critical { color: var(--color-threat); }

/* Detail modal */
.detail-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(6,8,12,0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fade-in 0.15s ease;
}

.detail-modal {
  width: min(520px, 95vw);
  max-height: 80vh;
  overflow-y: auto;
  padding-bottom: 16px;
  animation: slide-up 0.2s ease;
}

.detail-modal-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
}

.detail-modal-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.modal-close-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-subtle);
  font-family: var(--font-mono);
  font-size: 12px;
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.modal-close-btn:hover { border-color: var(--color-threat); color: var(--color-threat); }

.detail-modal-body { padding: 16px; }

.modal-stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 12px;
}
.modal-stat-label { color: var(--text-subtle); letter-spacing: 0.08em; }
.modal-stat-value { color: var(--text-primary); font-weight: 500; }

.modal-action-row {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.modal-action-btn {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--color-threat);
  color: var(--color-threat);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
}
.modal-action-btn:hover { background: rgba(255,56,56,0.1); }

@keyframes fade-in  { from { opacity: 0; } }
@keyframes slide-up { from { transform: translateY(20px); opacity: 0; } }
```

**Step 2: Implement `src/ui/HoverPreview.ts`**

```typescript
export class HoverPreview {
  private el: HTMLElement

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'hud hud-threat hover-preview hidden'
    this.el.innerHTML = `
      <div class="corner-bl"></div><div class="corner-br"></div>
      <div class="hover-preview-body" id="preview-body"></div>
    `
  }

  show(x: number, y: number, content: { label: string; type: string; threatLevel: string }): void {
    const body = this.el.querySelector('#preview-body')!
    body.innerHTML = `
      <div style="font-size:10px;color:var(--text-subtle);letter-spacing:0.12em">${content.type}</div>
      <div style="font-weight:700">${content.label}</div>
      <span class="hover-threat-badge badge-${content.threatLevel.toLowerCase()}">${content.threatLevel}</span>
    `
    this.el.style.left = `${x + 12}px`
    this.el.style.top  = `${y - 20}px`
    this.el.classList.remove('hidden')
  }

  hide(): void { this.el.classList.add('hidden') }

  mount(parent: HTMLElement): void { parent.appendChild(this.el) }
}
```

**Step 3: Implement `src/ui/ModalStack.ts`**

```typescript
import type { ThreatAsset } from '../data/assetTypes'
import { SignalBus } from '../signals/SignalBus'

export class ModalStack {
  private layer: HTMLElement
  private stack: HTMLElement[] = []

  constructor(layer: HTMLElement) {
    this.layer = layer
    SignalBus.on('modal:open', ({ actorId, mode }) => {
      if (mode === 'detail') this.openDetail(actorId)
    })
    SignalBus.on('modal:close', () => this.closeTop())
  }

  openDetail(actorId: string): void {
    const backdrop = document.createElement('div')
    backdrop.className = 'detail-modal-backdrop'
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.closeTop()
    })

    const modal = document.createElement('div')
    modal.className = 'hud hud-threat detail-modal'
    modal.innerHTML = `
      <div class="corner-bl"></div><div class="corner-br"></div>
      <div class="detail-modal-header">
        <span class="detail-modal-title">ASSET INTEL — ${actorId.slice(0,12).toUpperCase()}</span>
        <button class="modal-close-btn" id="modal-close">✕</button>
      </div>
      <div class="detail-modal-body" id="modal-body">
        <div style="color:var(--text-subtle);text-align:center;padding:24px">
          LOADING ASSET DATA...
        </div>
      </div>
    `

    modal.querySelector('#modal-close')!.addEventListener('click', () => this.closeTop())
    backdrop.appendChild(modal)
    this.layer.appendChild(backdrop)
    this.stack.push(backdrop)
    this.layer.style.pointerEvents = 'auto'
  }

  populateDetail(actorId: string, asset: Partial<ThreatAsset>): void {
    const top = this.stack.at(-1)
    if (!top) return
    const body = top.querySelector('#modal-body')!
    body.innerHTML = `
      <div class="modal-stat-row"><span class="modal-stat-label">CALLSIGN</span><span class="modal-stat-value">${asset.realWorldCallsign ?? 'UNKNOWN'}</span></div>
      <div class="modal-stat-row"><span class="modal-stat-label">TYPE</span><span class="modal-stat-value">${asset.type ?? '—'}</span></div>
      <div class="modal-stat-row"><span class="modal-stat-label">THREAT LEVEL</span><span class="modal-stat-value" style="color:var(--color-threat)">${asset.threatLevel ?? '—'}</span></div>
      <div class="modal-stat-row"><span class="modal-stat-label">ALTITUDE</span><span class="modal-stat-value">${asset.altitudeM ? Math.round(asset.altitudeM) + ' m' : '—'}</span></div>
      <div class="modal-stat-row"><span class="modal-stat-label">SPEED</span><span class="modal-stat-value">${asset.speedKnots ?? '—'} kts</span></div>
      <div class="modal-stat-row"><span class="modal-stat-label">HEADING</span><span class="modal-stat-value">${asset.headingDeg != null ? Math.round(asset.headingDeg) + '°' : '—'}</span></div>
      <div class="modal-stat-row"><span class="modal-stat-label">VECTOR</span><span class="modal-stat-value">${asset.vectorType ?? '—'}</span></div>
      <div class="modal-action-row">
        <button class="modal-action-btn">DEPLOY DRONE</button>
        <button class="modal-action-btn">LAUNCH INTERCEPTOR</button>
      </div>
    `
  }

  closeTop(): void {
    const top = this.stack.pop()
    if (top) { top.remove() }
    if (this.stack.length === 0) this.layer.style.pointerEvents = 'none'
  }
}
```

**Step 4: Mount in `src/main.ts`**

```typescript
import { ModalStack } from './ui/ModalStack'
import { HoverPreview } from './ui/HoverPreview'
import './styles/modal.css'

const modalLayer = document.getElementById('modal-layer')!
modalLayer.style.pointerEvents = 'none'
const modalStack = new ModalStack(modalLayer)

const hoverPreview = new HoverPreview()
hoverPreview.mount(hudLayer)
```

**Step 5: Verify**

Click an aircraft dot on the globe — modal appears with asset data, dark glass styling, corner brackets, close button.

**Step 6: Commit**

```bash
git add src/ui/ModalStack.ts src/ui/HoverPreview.ts src/styles/modal.css src/main.ts
git commit -m "feat: ModalStack and HoverPreview — click aircraft opens detail modal"
```

---

## Task 20: GameLoop stub

**Files:**
- Modify: `src/game/GameLoop.ts`

**Step 1: Implement stub with documented hooks**

```typescript
// GAME LOOP ENTRY POINT
// All game logic lives here. Wire your rules to SignalBus events below.
// Components and actors must not contain game logic — delegate to this file.

import { SignalBus } from '../signals/SignalBus'
import { GameState } from '../engine/GameState'

// HOOK: Player deploys a drone against a ThreatAsset
SignalBus.on('action:deploy_drone', ({ actorId }) => {
  // TODO: resolve intercept attempt, update intelScore, consume opsUnit
  void actorId
})

// HOOK: Player activates signal jammer
SignalBus.on('action:signal_jammer', ({ actorId }) => {
  // TODO: slow asset movement, generate SIGINT event, consume opsUnit
  void actorId
})

// HOOK: Player launches interceptor
SignalBus.on('action:launch_interceptor', ({ actorId }) => {
  // TODO: resolve intercept, check objective completion, trigger debrief if final
  void actorId
})

// HOOK: HUD timer fires each second
SignalBus.on('timer:tick', ({ secondsRemaining }) => {
  // TODO: check mission fail conditions, trigger DEBRIEF if time reaches 0
  void secondsRemaining
})

// HOOK: ThreatAsset reaches its target city
SignalBus.on('asset:reached_target', ({ actorId, cityId }) => {
  // TODO: apply city consequence, update objectives, check mission end
  void actorId; void cityId
})

export {}
```

**Step 2: Import in `src/main.ts`**

```typescript
import './game/GameLoop'
```

**Step 3: Commit**

```bash
git add src/game/GameLoop.ts src/main.ts
git commit -m "feat: GameLoop stub with documented SignalBus hook points"
```

---

## Task 21: PWA manifest

**Files:**
- Create: `public/manifest.json`
- Modify: `index.html`
- Modify: `vite.config.ts`

**Step 1: Create `public/manifest.json`**

```json
{
  "name": "PALANTIR",
  "short_name": "PALANTIR",
  "description": "Global intelligence operations game",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#06080C",
  "theme_color": "#06080C",
  "orientation": "landscape",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Step 2: Add manifest link to `index.html`**

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#06080C" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

**Step 3: Commit**

```bash
git add public/manifest.json index.html
git commit -m "feat: PWA manifest — installable on mobile home screen"
```

---

## Task 22: Final verification

**Step 1: Run all tests**

```bash
npm test
```
Expected: All tests pass.

**Step 2: Build for production**

```bash
npm run build
```
Expected: No TypeScript errors. `dist/` folder generated.

**Step 3: Verify production build**

```bash
npm run preview
```
Open in Chrome. Check:
- [ ] Globe renders with real aircraft within 10 seconds
- [ ] All HUD panels visible: objectives (top-left), counters (top-right)
- [ ] Three intel panels at bottom with correct styling
- [ ] Action bar at bottom with Threat Vector legend
- [ ] Click aircraft → detail modal opens with telemetry data
- [ ] SIGINT terminal populates every ~15 seconds
- [ ] AIR indicator in Threat Vector lights orange when aircraft present
- [ ] Zero console errors

**Step 4: Commit**

```bash
git add .
git commit -m "feat: phase 1 complete — globe, HUD, intel panels, modal system, PWA"
```

---

## Reference

- Design doc: `docs/plans/2026-04-25-interface-architecture-design.md`
- CesiumJS docs: https://cesium.com/learn/cesiumjs/ref-doc/
- OpenSky API: https://opensky-network.org/apidoc/rest.html
- Art direction: `docs/art-direction/interface_design.png`, `docs/art-direction/remixed-a95be325.html`
