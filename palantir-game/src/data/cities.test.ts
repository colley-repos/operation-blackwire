import { describe, it, expect } from 'vitest'
import { CITIES } from './cities'

describe('cities', () => {
  it('has at least 20 entries', () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(20)
  })
  it('every city has valid lat/lng', () => {
    for (const c of CITIES) {
      expect(c.lat).toBeGreaterThanOrEqual(-90)
      expect(c.lat).toBeLessThanOrEqual(90)
      expect(c.lng).toBeGreaterThanOrEqual(-180)
      expect(c.lng).toBeLessThanOrEqual(180)
    }
  })
})
