export type GamePhase = 'IDLE' | 'ACTIVE' | 'PAUSED' | 'DEBRIEF'

export interface Objective {
  id: string
  label: string
  status: 'ACTIVE' | 'COMPLETE' | 'FAILED'
  linkedActorId?: string
}

export interface State {
  phase: GamePhase
  intelScore: number
  opsUnitsRemaining: number
  secondsRemaining: number
  objectives: Objective[]
  selectedActorId: string | null
}

const defaults: State = {
  phase: 'IDLE',
  intelScore: 0,
  opsUnitsRemaining: 3,
  secondsRemaining: 0,
  objectives: [],
  selectedActorId: null,
}

let _state: State = { ...defaults }

export const GameState = {
  snapshot: (): Readonly<State> => ({ ..._state }),
  patch: (partial: Partial<State>): void => { _state = { ..._state, ...partial } },
  reset: (): void => { _state = { ...defaults } },
}
