import { describe, it, expect, vi } from 'vitest'
import { SignalBus } from './SignalBus'

describe('SignalBus', () => {
  it('delivers typed events to subscribers', () => {
    const handler = vi.fn()
    SignalBus.on('asset:selected', handler)
    SignalBus.emit('asset:selected', { actorId: 'abc' })
    expect(handler).toHaveBeenCalledWith({ actorId: 'abc' })
  })

  it('on() returns unsubscribe function', () => {
    const handler = vi.fn()
    const unsub = SignalBus.on('modal:close', handler)
    unsub()
    SignalBus.emit('modal:close', { actorId: 'x' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('once() fires exactly one time', () => {
    const handler = vi.fn()
    SignalBus.once('timer:tick', handler)
    SignalBus.emit('timer:tick', { secondsRemaining: 60 })
    SignalBus.emit('timer:tick', { secondsRemaining: 59 })
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
