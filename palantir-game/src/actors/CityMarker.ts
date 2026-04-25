import * as Cesium from 'cesium'
import { Actor } from '../engine/Actor'
import type { World } from '../engine/World'
import type { City } from '../data/cities'

export class CityMarker extends Actor {
  private city: City
  private entity: Cesium.Entity | null = null

  constructor(city: City) {
    super(city.id)
    this.city = city
  }

  onMount(world: World): void {
    const viewer = world.getViewer()
    this.entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(this.city.lng, this.city.lat),
      label: {
        text: this.city.name,
        font: '10px JetBrains Mono',
        fillColor: Cesium.Color.fromCssColorString('#FFFFFF8C'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      point: {
        pixelSize: 4,
        color: Cesium.Color.fromCssColorString('#FFFFFF40'),
        outlineColor: Cesium.Color.fromCssColorString('#FFFFFF20'),
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      }
    })
  }

  onUnmount(world: World): void {
    if (this.entity) world.getViewer().entities.remove(this.entity)
  }

  setThreatInbound(inbound: boolean): void {
    if (!this.entity?.point) return
    this.entity.point.color = new Cesium.ConstantProperty(
      Cesium.Color.fromCssColorString(inbound ? '#FF383880' : '#FFFFFF40')
    )
  }
}
