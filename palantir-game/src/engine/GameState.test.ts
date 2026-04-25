import { describe, it, expect, beforeEach } from 'vitest'
import { GameState } from './GameState'

describe('GameState', () => {
  beforeEach(() => GameState.reset())

  it('initialises with default idle state', () => {
    expect(GameState.snapshot().phase).toBe('IDLE')
    expect(GameState.snapshot().intelScore).toBe(0)
  })

  it('patch() merges partial state', () => {
    GameState.patch({ intelScore: 150 })
    expect(GameState.snapshot().intelScore).toBe(150)
  })

  it('patch() does not affect unrelated fields', () => {
    GameState.patch({ opsUnitsRemaining: 5 })
    expect(GameState.snapshot().phase).toBe('IDLE')
  })
})
