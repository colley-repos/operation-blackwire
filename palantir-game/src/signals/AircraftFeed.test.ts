import { describe, it, expect } from 'vitest'
import { normalizeOpenSkyState } from './AircraftFeed'

describe('normalizeOpenSkyState', () => {
  it('returns null for states with no position', () => {
    const raw = ['ABC123', 'TEST', 'GB', 0, 0, null, null, null, false, null, null, null, null, null, 0, null, false]
    expect(normalizeOpenSkyState(raw)).toBeNull()
  })

  it('returns null for aircraft on the ground', () => {
    const raw = ['ABC123', 'TEST', 'GB', 0, 0, 35.2, 40.5, 0, true, 0, 0, null, null, null, 0, null, false]
    expect(normalizeOpenSkyState(raw)).toBeNull()
  })

  it('normalizes a valid airborne state vector', () => {
    const raw = ['ABC123', 'RYANAIR1', 'GB', 0, 1000, 40.5, 35.2, 8000, false, 250, 90, 0, null, null, 0, null, false]
    const result = normalizeOpenSkyState(raw)
    expect(result).not.toBeNull()
    expect(result?.type).toBe('JET')
    expect(result?.vectorType).toBe('AIR')
    expect(result?.realWorldCallsign).toBe('RYANAIR1')
    expect(result?.lat).toBe(35.2)
    expect(result?.lng).toBe(40.5)
  })
})
