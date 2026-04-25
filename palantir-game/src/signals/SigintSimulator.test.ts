import { describe, it, expect } from 'vitest'
import { SigintSimulator } from './SigintSimulator'

describe('SigintSimulator', () => {
  it('generates events with required fields', () => {
    const sim = new SigintSimulator()
    const event = sim.generateEvent()
    expect(event.id).toBeTruthy()
    expect(event.type).toBe('SIGINT')
    expect(event.headline.length).toBeGreaterThan(0)
    expect(['INFO', 'ALERT', 'URGENT']).toContain(event.severity)
  })
})
