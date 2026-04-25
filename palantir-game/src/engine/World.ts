import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import type { Actor } from './Actor'

Cesium.Ion.defaultAccessToken = import.meta.env['VITE_CESIUM_TOKEN'] as string

export class World {
  private viewer!: Cesium.Viewer
  private actors = new Map<string, Actor>()
  private lastTime = performance.now()
  private rafHandle = 0

  init(container: HTMLElement): void {
    this.viewer = new Cesium.Viewer(container, {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      infoBox: false,
      selectionIndicator: false,
      scene3DOnly: true,
    })

    this.viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#06080C')
    this.viewer.scene.globe.enableLighting = true

    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(55.0, 45.0, 8_000_000),
      orientation: { heading: 0, pitch: -0.6, roll: 0 }
    })

    this.startTick()
  }

  spawnActor(actor: Actor): void {
    this.actors.set(actor.id, actor)
    actor.onMount(this)
  }

  destroyActor(id: string): void {
    const actor = this.actors.get(id)
    if (!actor) return
    actor.onUnmount(this)
    this.actors.delete(id)
  }

  getActor(id: string): Actor | undefined {
    return this.actors.get(id)
  }

  getViewer(): Cesium.Viewer {
    return this.viewer
  }

  private startTick(): void {
    const tick = (now: number) => {
      const delta = (now - this.lastTime) / 1000
      this.lastTime = now
      for (const actor of this.actors.values()) actor.tick(delta)
      this.rafHandle = requestAnimationFrame(tick)
    }
    this.rafHandle = requestAnimationFrame(tick)
  }

  dispose(): void {
    cancelAnimationFrame(this.rafHandle)
    this.viewer.destroy()
  }
}
