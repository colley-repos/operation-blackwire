import type { IntelEvent } from '../data/assetTypes'
import { SignalBus } from './SignalBus'

const CALLSIGNS = ['BLACKWIRE-1', 'SABER-ECHO', 'PHANTOM-7', 'GHOST-ACTUAL', 'VECTOR-ZULU', 'IRON-DELTA']
const FREQUENCIES = ['14.285 MHz', '7.030 MHz', '21.350 MHz', '3.710 MHz', '28.450 MHz']
const MESSAGES = [
  'PACKAGE DELIVERY CONFIRMED — AWAIT SECONDARY SIGNAL',
  'RENDEZVOUS AT [REDACTED] — 0300 LOCAL',
  'ASSET IN POSITION — STANDING BY FOR AUTHORIZATION',
  '[ENCRYPTED] ██████ ACKNOWLEDGED — PROCEEDING',
  'ABORT PROTOCOL SIERRA — COMPROMISED CHANNEL',
  'CONTACT ESTABLISHED — TRANSFERRING COORDINATES',
  'BLACKOUT WINDOW OPENS IN [REDACTED] HOURS',
  'ACKNOWLEDGE RECEIPT — ONE TIME PAD EXHAUSTED',
]

let _seq = 0

export class SigintSimulator {
  private handle = 0

  generateEvent(): IntelEvent {
    const severity = Math.random() < 0.2 ? 'URGENT' : Math.random() < 0.5 ? 'ALERT' : 'INFO'
    const callsign = CALLSIGNS[Math.floor(Math.random() * CALLSIGNS.length)]!
    const freq = FREQUENCIES[Math.floor(Math.random() * FREQUENCIES.length)]!
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]!
    return {
      id: `sigint-${++_seq}`,
      type: 'SIGINT',
      timestamp: Date.now(),
      actorId: null,
      headline: `INTERCEPT — ${callsign} @ ${freq}`,
      bodyText: `${callsign}: ${msg}`,
      severity,
      hasAction: severity !== 'INFO',
      actionLabel: severity !== 'INFO' ? 'TRACE SIGNAL' : null,
    }
  }

  start(): void { this.scheduleNext() }
  stop(): void { clearTimeout(this.handle) }

  private scheduleNext(): void {
    const delay = 8_000 + Math.random() * 12_000
    this.handle = window.setTimeout(() => {
      SignalBus.emit('signal:intel_event', { event: this.generateEvent() })
      this.scheduleNext()
    }, delay)
  }
}
