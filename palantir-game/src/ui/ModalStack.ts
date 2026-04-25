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
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) this.closeTop() })

    const modal = document.createElement('div')
    modal.className = 'hud hud-threat detail-modal'
    modal.innerHTML = `
      <div class="corner-bl"></div><div class="corner-br"></div>
      <div class="detail-modal-header">
        <span class="detail-modal-title">ASSET INTEL — ${actorId.slice(0, 20).toUpperCase()}</span>
        <button class="modal-close-btn" id="modal-close">✕</button>
      </div>
      <div class="detail-modal-body" id="modal-body">
        <div style="color:var(--text-subtle);text-align:center;padding:24px">LOADING ASSET DATA...</div>
      </div>
    `
    modal.querySelector('#modal-close')!.addEventListener('click', () => this.closeTop())
    backdrop.appendChild(modal)
    this.layer.appendChild(backdrop)
    this.stack.push(backdrop)
    this.layer.style.pointerEvents = 'auto'
  }

  populateDetail(asset: Partial<ThreatAsset>): void {
    const top = this.stack.at(-1)
    if (!top) return
    const body = top.querySelector('#modal-body')!
    body.innerHTML = `
      <div class="modal-stat-row"><span class="modal-stat-label">CALLSIGN</span><span class="modal-stat-value">${asset.realWorldCallsign ?? 'UNKNOWN'}</span></div>
      <div class="modal-stat-row"><span class="modal-stat-label">TYPE</span><span class="modal-stat-value">${asset.type ?? '—'}</span></div>
      <div class="modal-stat-row"><span class="modal-stat-label">THREAT LEVEL</span><span class="modal-stat-value" style="color:var(--color-threat)">${asset.threatLevel ?? '—'}</span></div>
      <div class="modal-stat-row"><span class="modal-stat-label">ALTITUDE</span><span class="modal-stat-value">${asset.altitudeM != null ? Math.round(asset.altitudeM) + ' m' : '—'}</span></div>
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
    if (top) top.remove()
    if (this.stack.length === 0) this.layer.style.pointerEvents = 'none'
  }
}
