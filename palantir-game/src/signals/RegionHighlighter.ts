import * as Cesium from 'cesium'
import type { World } from '../engine/World'

// Nations classified as hostile based on game context
const HOSTILE_ISO2 = new Set([
  'RU', 'CN', 'IR', 'KP', 'SY', 'BY', 'LY', 'SD', 'YE', 'AF', 'IQ', 'VE', 'CU', 'MM', 'ZW',
])

const FILL_HOSTILE_DIM    = Cesium.Color.RED.withAlpha(0.04)
const FILL_HOSTILE_HOVER  = Cesium.Color.RED.withAlpha(0.18)
const FILL_FRIENDLY_DIM   = Cesium.Color.fromCssColorString('#00FF88').withAlpha(0.03)
const FILL_FRIENDLY_HOVER = Cesium.Color.fromCssColorString('#00FF88').withAlpha(0.14)
const OUTLINE_HOSTILE     = Cesium.Color.RED.withAlpha(0.35)
const OUTLINE_FRIENDLY    = Cesium.Color.fromCssColorString('#00FF88').withAlpha(0.18)

const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

function isHostile(entity: Cesium.Entity): boolean {
  const iso = entity.properties?.['ISO_A2']?.getValue(Cesium.JulianDate.now()) as string | undefined
  return HOSTILE_ISO2.has(iso ?? '')
}

function styleEntity(entity: Cesium.Entity, hovered: boolean): void {
  if (!entity.polygon) return
  const hostile = isHostile(entity)
  entity.polygon.material = new Cesium.ColorMaterialProperty(
    hovered
      ? (hostile ? FILL_HOSTILE_HOVER : FILL_FRIENDLY_HOVER)
      : (hostile ? FILL_HOSTILE_DIM  : FILL_FRIENDLY_DIM)
  )
  entity.polygon.outlineColor = new Cesium.ConstantProperty(
    hostile ? OUTLINE_HOSTILE : OUTLINE_FRIENDLY
  )
}

export class RegionHighlighter {
  private dataSource: Cesium.GeoJsonDataSource | null = null
  private hovered: Cesium.Entity | null = null
  private handler: Cesium.ScreenSpaceEventHandler | null = null

  async init(world: World): Promise<void> {
    const viewer = world.getViewer()

    try {
      this.dataSource = await Cesium.GeoJsonDataSource.load(GEOJSON_URL, {
        stroke: Cesium.Color.TRANSPARENT,
        fill: Cesium.Color.TRANSPARENT,
        strokeWidth: 1,
        clampToGround: true,
      })
      await viewer.dataSources.add(this.dataSource)

      for (const entity of this.dataSource.entities.values) {
        if (!entity.polygon) continue
        entity.polygon.outline = new Cesium.ConstantProperty(true)
        entity.polygon.outlineWidth = new Cesium.ConstantProperty(1)
        entity.polygon.heightReference = new Cesium.ConstantProperty(Cesium.HeightReference.CLAMP_TO_GROUND)
        styleEntity(entity, false)
      }
    } catch {
      return // Gracefully skip if GeoJSON unavailable
    }

    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
    this.handler.setInputAction((e: { endPosition: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(e.endPosition)
      const entity = picked?.id instanceof Cesium.Entity ? picked.id : null

      if (entity === this.hovered) return

      if (this.hovered) styleEntity(this.hovered, false)
      this.hovered = entity && entity.polygon ? entity : null
      if (this.hovered) styleEntity(this.hovered, true)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }

  destroy(world: World): void {
    this.handler?.destroy()
    if (this.dataSource) world.getViewer().dataSources.remove(this.dataSource)
  }
}
