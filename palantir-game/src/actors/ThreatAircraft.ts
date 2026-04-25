import * as Cesium from 'cesium'
import { Pawn } from '../engine/Pawn'
import type { World } from '../engine/World'
import type { ThreatAsset } from '../data/assetTypes'
import { SignalBus } from '../signals/SignalBus'

export class ThreatAircraft extends Pawn {
  private asset: ThreatAsset
  private entity: Cesium.Entity | null = null
  private viewer: Cesium.Viewer | null = null
  private clickHandler: Cesium.ScreenSpaceEventHandler | null = null

  constructor(asset: ThreatAsset) {
    super(asset.id)
    this.asset = asset
  }

  onMount(world: World): void {
    this.viewer = world.getViewer()
    this.entity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(this.asset.lng, this.asset.lat, this.asset.altitudeM),
      point: {
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString('#FF3838'),
        outlineColor: Cesium.Color.fromCssColorString('#FF383866'),
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: this.asset.realWorldCallsign ?? 'ENEMY JET',
        font: '10px JetBrains Mono',
        fillColor: Cesium.Color.fromCssColorString('#FF3838'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(12, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      }
    })

    this.clickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas)
    this.clickHandler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = this.viewer?.scene.pick(click.position)
      if (Cesium.defined(picked) && picked.id === this.entity) {
        SignalBus.emit('asset:selected', { actorId: this.id })
        SignalBus.emit('modal:open', { actorId: this.id, mode: 'detail' })
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  updatePosition(asset: ThreatAsset): void {
    this.asset = asset
    if (!this.entity) return
    this.entity.position = new Cesium.ConstantPositionProperty(
      Cesium.Cartesian3.fromDegrees(asset.lng, asset.lat, asset.altitudeM)
    )
    if (this.entity.label) {
      this.entity.label.text = new Cesium.ConstantProperty(asset.realWorldCallsign ?? 'ENEMY JET')
    }
  }

  onUnmount(world: World): void {
    this.clickHandler?.destroy()
    if (this.entity) world.getViewer().entities.remove(this.entity)
  }
}
