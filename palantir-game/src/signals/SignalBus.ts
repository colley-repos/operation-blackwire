export type SignalMap = {
  'asset:selected':            { actorId: string }
  'asset:deselected':          { actorId: string }
  'asset:reached_target':      { actorId: string; cityId: string }
  'modal:open':                { actorId: string; mode: 'hover' | 'detail' }
  'modal:close':               { actorId: string }
  'action:deploy_drone':       { actorId: string }
  'action:signal_jammer':      { actorId: string }
  'action:launch_interceptor': { actorId: string }
  'signal:aircraft_updated':   { assets: unknown[] }
  'signal:vessel_updated':     { assets: unknown[] }
  'signal:intel_event':        { event: unknown }
  'timer:tick':                { secondsRemaining: number }
  'mission:start':             Record<string, never>
  'mission:end':               { outcome: 'success' | 'failure' }
}

type Handler<T> = (data: T) => void

class SignalBusClass {
  private listeners = new Map<string, Set<Handler<unknown>>>()

  on<K extends keyof SignalMap>(event: K, handler: Handler<SignalMap[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    const set = this.listeners.get(event)!
    set.add(handler as Handler<unknown>)
    return () => set.delete(handler as Handler<unknown>)
  }

  once<K extends keyof SignalMap>(event: K, handler: Handler<SignalMap[K]>): void {
    const unsub = this.on(event, (data) => { unsub(); handler(data) })
  }

  emit<K extends keyof SignalMap>(event: K, data: SignalMap[K]): void {
    this.listeners.get(event)?.forEach(h => h(data as unknown))
  }
}

export const SignalBus = new SignalBusClass()
