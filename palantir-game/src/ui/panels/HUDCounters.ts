import { GameState } from '../../engine/GameState'
import { SignalBus } from '../../signals/SignalBus'

export class HUDCounters {
  private el: HTMLElement

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'hud hud-meta-panel'
    this.el.innerHTML = `
      <div class="corner-bl"></div><div class="corner-br"></div>
      <div class="hud-meta">BLACKWIRE — ACTIVE</div>
      <div class="hud-counters">
        <div class="hud-stat">
          <span class="hud-label">INTEL</span>
          <span class="hud-value" id="stat-intel">0</span>
        </div>
        <div class="hud-stat">
          <span class="hud-label">OPS UNITS</span>
          <span class="hud-value hud-val-ops" id="stat-ops">3</span>
        </div>
        <div class="hud-stat">
          <span class="hud-label">TIME LEFT</span>
          <span class="hud-value hud-val-threat animate-blink" id="stat-time">--:--</span>
        </div>
      </div>
    `

    SignalBus.on('timer:tick', ({ secondsRemaining }) => {
      const m = Math.floor(secondsRemaining / 60).toString().padStart(2, '0')
      const s = (secondsRemaining % 60).toString().padStart(2, '0')
      const el = this.el.querySelector('#stat-time')
      if (el) el.textContent = `${m}:${s}`
    })
  }

  mount(parent: HTMLElement): void { parent.appendChild(this.el) }

  refresh(): void {
    const state = GameState.snapshot()
    const intel = this.el.querySelector('#stat-intel')
    const ops = this.el.querySelector('#stat-ops')
    if (intel) intel.textContent = String(state.intelScore)
    if (ops) ops.textContent = String(state.opsUnitsRemaining)
  }
}
