import { SignalBus } from '../signals/SignalBus'

SignalBus.on('action:deploy_drone', ({ actorId }) => {
  // TODO: resolve intercept attempt, update intelScore, consume opsUnit
  void actorId
})

SignalBus.on('action:signal_jammer', ({ actorId }) => {
  // TODO: slow asset movement, generate SIGINT event, consume opsUnit
  void actorId
})

SignalBus.on('action:launch_interceptor', ({ actorId }) => {
  // TODO: resolve intercept, check objective completion, trigger debrief if final
  void actorId
})

SignalBus.on('timer:tick', ({ secondsRemaining }) => {
  // TODO: check mission fail conditions, trigger DEBRIEF if time reaches 0
  void secondsRemaining
})

SignalBus.on('asset:reached_target', ({ actorId, cityId }) => {
  // TODO: apply city consequence, update objectives, check mission end
  void actorId; void cityId
})

export {}
