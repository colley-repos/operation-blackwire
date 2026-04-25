# OPERATION BLACKWIRE — Tech Stack

## Deployment Architecture

| Layer | Service | Why |
|-------|---------|-----|
| PWA Frontend (static) | Cloudflare Pages | Free CDN, global edge, instant deploy from GitHub |
| Node.js Backend | Railway | Persistent process, WebSockets, real filesystem |

### Why Cloudflare Pages cannot host the backend

Three load-bearing backend requirements that Cloudflare Workers/Pages fundamentally cannot satisfy:

1. **Socket.io** — requires persistent WebSocket connections. Cloudflare Workers are stateless, spin up per request and die. Socket.io breaks.
2. **WorldEngine tick loop** — the world heartbeat needs a process that stays alive. No persistent process exists on Pages/Workers.
3. **SQLite** — requires a real filesystem. Cloudflare's environment has no persistent disk.

Cloudflare does have workarounds (Durable Objects for state, D1 for SQLite, Queues for ticking) but that is a full architecture rewrite and those services are not free tier.

### Why Railway for the backend

- Persistent Node.js process (Socket.io + WorldEngine tick loop work as designed)
- Real filesystem (SQLite works natively)
- WebSocket support out of the box
- Free tier sufficient for alpha (~50 concurrent users)
- Zero config — point at repo, it runs
- Migration path: when scaling, move backend to Azure/AWS without touching frontend

### Scale-up path

```
Alpha:   Cloudflare Pages (frontend) + Railway free tier (backend)
Beta:    Cloudflare Pages (frontend) + Railway paid (backend)
Production: Cloudflare Pages (frontend) + Azure/AWS (backend, horizontally scaled)
```

Cloudflare remains the CDN for the frontend at every stage. Backend scaling is independent.

---

## Frontend Stack

| Concern | Choice |
|---------|--------|
| Language | TypeScript (strict mode) |
| Build | Vite 8 |
| Globe | CesiumJS (WebGL, real-world terrain) |
| Testing | Vitest + jsdom |
| Distribution | PWA (installable, landscape-locked) |

**No UI framework.** Vanilla TS + CSS. The DOM layer is thin — globe takes 100% viewport, UI panels are absolutely positioned overlays.

## Backend Stack (Phase 2+)

| Concern | Choice |
|---------|--------|
| Runtime | Node.js |
| Real-time | Socket.io |
| Database | SQLite (better-sqlite3) |
| World simulation | WorldEngine — persistent tick loop (30s heartbeat) |

## Repository

- GitHub: `colley-repos/operation-blackwire`
- Frontend deploys to Cloudflare Pages from `palantir-game/` subdirectory
- Backend will live in `server/` (Phase 2)

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_CESIUM_TOKEN` | `.env` (not committed) | Cesium ion access token for globe imagery |

`.env` is gitignored. Copy `.env.example` and fill in values locally.
