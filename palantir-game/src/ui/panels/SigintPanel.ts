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
    while (this.logEl.children.length > 100) this.logEl.removeChild(this.logEl.firstChild!)
  }

  mount(parent: HTMLElement): void { parent.appendChild(this.el) }
}
