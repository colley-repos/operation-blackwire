import { SignalBus } from '../signals/SignalBus'
import type { ThreatAsset } from '../data/assetTypes'

export class ThreatVector {
  readonly el: HTMLElement
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
