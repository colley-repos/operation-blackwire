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
        <svg width="48" height="60" viewBox="0 0 48 60" fill="none">
          <circle cx="24" cy="18" r="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
          <path d="M4 56 Q4 36 24 36 Q44 36 44 56" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        </svg>
        <div class="recon-status standing-by" id="recon-status">STANDING BY</div>
      </div>
      <button class="intel-action" id="recon-deploy">DEPLOY TEAM</button>
    `
    this.statusEl = this.el.querySelector('#recon-status')!

    this.el.querySelector('#recon-deploy')!.addEventListener('click', () => {
      const id = GameState.snapshot().selectedActorId ?? ''
      SignalBus.emit('action:deploy_drone', { actorId: id })
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
