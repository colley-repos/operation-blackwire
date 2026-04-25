export class HoverPreview {
  readonly el: HTMLElement

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
