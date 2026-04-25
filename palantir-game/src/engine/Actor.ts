import type { ActorComponent } from './ActorComponent'
import type { World } from './World'

export abstract class Actor {
  readonly id: string
  private _components = new Map<string, ActorComponent>()

  constructor(id?: string) {
    this.id = id ?? crypto.randomUUID()
  }

  addComponent<T extends ActorComponent>(component: T): T {
    this._components.set(component.constructor.name, component)
    return component
  }

  getComponent<T extends ActorComponent>(type: new (...args: never[]) => T): T | undefined {
    return this._components.get(type.name) as T | undefined
  }

  removeComponent<T extends ActorComponent>(type: new (...args: never[]) => T): void {
    this._components.delete(type.name)
  }

  tick(_deltaTime: number): void {}

  abstract onMount(world: World): void
  abstract onUnmount(world: World): void
}
