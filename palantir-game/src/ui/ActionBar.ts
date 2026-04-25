import { SignalBus } from '../signals/SignalBus'
import { GameState } from '../engine/GameState'

export class ActionBar {
  readonly el: HTMLElement

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'action-buttons'
    this.el.innerHTML = `
      <button class="action-btn" id="btn-drone"       disabled>DEPLOY DRONE</button>
      <button class="action-btn" id="btn-jammer"      disabled>ACTIVATE SIGNAL JAMMER</button>
      <button class="action-btn" id="btn-interceptor" disabled>LAUNCH INTERCEPTOR</button>
    `

    this.el.querySelector('#btn-drone')!.addEventListener('click', () => {
      SignalBus.emit('action:deploy_drone', { actorId: GameState.snapshot().selectedActorId ?? '' })
    })
    this.el.querySelector('#btn-jammer')!.addEventListener('click', () => {
      SignalBus.emit('action:signal_jammer', { actorId: GameState.snapshot().selectedActorId ?? '' })
    })
    this.el.querySelector('#btn-interceptor')!.addEventListener('click', () => {
      SignalBus.emit('action:launch_interceptor', { actorId: GameState.snapshot().selectedActorId ?? '' })
    })

    SignalBus.on('asset:selected', () => this.setEnabled(true))
    SignalBus.on('asset:deselected', () => this.setEnabled(false))
  }

  private setEnabled(enabled: boolean): void {
    const ops = GameState.snapshot().opsUnitsRemaining
    for (const btn of this.el.querySelectorAll<HTMLButtonElement>('.action-btn')) {
      btn.disabled = !enabled || ops === 0
    }
  }

  mount(parent: HTMLElement): void { parent.appendChild(this.el) }
}
