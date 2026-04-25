import * as Cesium from 'cesium'
import type { World } from '../engine/World'

// ── Faction classification ────────────────────────────────────
const HOSTILE_ISO2 = new Set([
  'RU', 'CN', 'IR', 'KP', 'SY', 'BY', 'LY', 'SD', 'YE', 'AF', 'IQ', 'VE', 'CU', 'MM', 'ZW',
])

// ── Visual tuning ─────────────────────────────────────────────
const FRIENDLY_OUTLINE_ALPHA = 1.0
const HOSTILE_OUTLINE_ALPHA  = 1.0
const SELECTION_WIDTH_PX     = 6
const BASE_BORDER_ALPHA      = 0.18
const BASE_BORDER_WIDTH_PX   = 1
// ──────────────────────────────────────────────────────────────

const OUTLINE_HOSTILE  = Cesium.Color.RED.withAlpha(HOSTILE_OUTLINE_ALPHA)
const OUTLINE_FRIENDLY = Cesium.Color.fromCssColorString('#00FF88').withAlpha(FRIENDLY_OUTLINE_ALPHA)
const BASE_BORDER      = Cesium.Color.WHITE.withAlpha(BASE_BORDER_ALPHA)

const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

interface Region {
  entity: Cesium.Entity
  positions: Cesium.Cartesian3[]
  bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number }
  hostile: boolean
}

function isHostile(entity: Cesium.Entity): boolean {
  const iso = entity.properties?.['ISO_A2']?.getValue(Cesium.JulianDate.now()) as string | undefined
  return HOSTILE_ISO2.has(iso ?? '')
}

function isValidPositions(positions: Cesium.Cartesian3[]): boolean {
  if (positions.length < 3) return false
  return positions.every(p => {
    return isFinite(p.x) && isFinite(p.y) && isFinite(p.z) &&
      (Math.abs(p.x) + Math.abs(p.y) + Math.abs(p.z)) > 0.01
  })
}

function computeBBox(positions: Cesium.Cartesian3[]) {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const pos of positions) {
    const c = Cesium.Cartographic.fromCartesian(pos)
    const lon = Cesium.Math.toDegrees(c.longitude)
    const lat = Cesium.Math.toDegrees(c.latitude)
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  return { minLon, maxLon, minLat, maxLat }
}

export class RegionHighlighter {
  private viewer!: Cesium.Viewer
  private regions: Region[] = []
  private selected: Region | null = null
  private selectionOutline: Cesium.GroundPolylinePrimitive | null = null
  private handler: Cesium.ScreenSpaceEventHandler | null = null

  async init(world: World): Promise<void> {
    this.viewer = world.getViewer()

    let dataSource: Cesium.GeoJsonDataSource
    try {
      dataSource = await Cesium.GeoJsonDataSource.load(GEOJSON_URL, {
        stroke: Cesium.Color.TRANSPARENT,
        fill: Cesium.Color.TRANSPARENT,
      })
      await this.viewer.dataSources.add(dataSource)
    } catch (e) {
      console.warn('[region] GeoJSON load failed', e)
      return
    }

    const borderInstances: Cesium.GeometryInstance[] = []

    for (const entity of dataSource.entities.values) {
      const hierarchy = entity.polygon?.hierarchy?.getValue(Cesium.JulianDate.now()) as Cesium.PolygonHierarchy | undefined
      const positions = hierarchy?.positions
      if (!positions || !isValidPositions(positions)) continue

      const bbox = computeBBox(positions)
      const hostile = isHostile(entity)

      // Hide entity polygon — we render via GroundPolylinePrimitive only
      if (entity.polygon) {
        entity.polygon.show = new Cesium.ConstantProperty(false)
      }

      this.regions.push({ entity, positions, bbox, hostile })

      // Add to grey border batch
      borderInstances.push(new Cesium.GeometryInstance({
        geometry: new Cesium.GroundPolylineGeometry({ positions, width: BASE_BORDER_WIDTH_PX }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(BASE_BORDER) },
      }))
    }

    console.log('[region] loaded', this.regions.length, 'regions')

    // Single batched primitive for all grey borders
    if (borderInstances.length) {
      this.viewer.scene.primitives.add(new Cesium.GroundPolylinePrimitive({
        geometryInstances: borderInstances,
        appearance: new Cesium.PolylineColorAppearance(),
      }))
    }

    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas)
    this.handler.setInputAction((e: { position: Cesium.Cartesian2 }) => {
      const cartesian = this.viewer.camera.pickEllipsoid(e.position, this.viewer.scene.globe.ellipsoid)
      if (!cartesian) { this.clearSelection(); return }

      const carto = Cesium.Cartographic.fromCartesian(cartesian)
      const lon = Cesium.Math.toDegrees(carto.longitude)
      const lat = Cesium.Math.toDegrees(carto.latitude)

      const match = this.regions.find(r =>
        lon >= r.bbox.minLon && lon <= r.bbox.maxLon &&
        lat >= r.bbox.minLat && lat <= r.bbox.maxLat
      ) ?? null

      if (match === this.selected) return
      this.clearSelection()
      if (match) this.applySelection(match)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  private clearSelection(): void {
    if (this.selectionOutline) {
      this.viewer.scene.primitives.remove(this.selectionOutline)
      this.selectionOutline = null
    }
    this.selected = null
  }

  private applySelection(region: Region): void {
    this.selected = region

    // GroundPolylinePrimitive — real pixel width, instant, no translucent sort
    const color = region.hostile ? OUTLINE_HOSTILE : OUTLINE_FRIENDLY
    this.selectionOutline = new Cesium.GroundPolylinePrimitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.GroundPolylineGeometry({
          positions: region.positions,
          width: SELECTION_WIDTH_PX,
        }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(color) },
      }),
      appearance: new Cesium.PolylineColorAppearance(),
    })
    this.viewer.scene.primitives.add(this.selectionOutline)
  }

  setFaction(_faction: 'east' | 'west'): void {
    // TODO: reclassify HOSTILE_ISO2 based on faction, re-apply to selected
  }

  destroy(): void {
    this.handler?.destroy()
    if (this.selectionOutline) this.viewer.scene.primitives.remove(this.selectionOutline)
  }
}
