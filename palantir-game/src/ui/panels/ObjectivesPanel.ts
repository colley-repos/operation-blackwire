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
    this.render()
  }

  mount(parent: HTMLElement): void { parent.appendChild(this.el); this.render() }

  render(): void {
    const list = this.el.querySelector('#objectives-list')
    if (!list) return
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
