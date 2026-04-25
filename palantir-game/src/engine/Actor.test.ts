import { describe, it, expect } from 'vitest'
import { Actor } from './Actor'
import { ActorComponent } from './ActorComponent'

class TestComponent extends ActorComponent { value = 42 }
class TestActor extends Actor {
  onMount(): void {}
  onUnmount(): void {}
}

describe('Actor', () => {
  it('generates a unique id', () => {
    expect(new TestActor().id).not.toBe(new TestActor().id)
  })

  it('addComponent / getComponent round-trips', () => {
    const actor = new TestActor()
    actor.addComponent(new TestComponent())
    expect(actor.getComponent(TestComponent)?.value).toBe(42)
  })

  it('removeComponent removes it', () => {
    const actor = new TestActor()
    actor.addComponent(new TestComponent())
    actor.removeComponent(TestComponent)
    expect(actor.getComponent(TestComponent)).toBeUndefined()
  })
})
