export class CamPanel {
  private el: HTMLElement
  private alertEl!: HTMLElement

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'hud hud-threat intel-panel scan-overlay'
    this.el.innerHTML = `
      <div class="corner-bl"></div><div class="corner-br"></div>
      <div class="hud-meta">
        <span>TRAFFIC CAM</span>
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
