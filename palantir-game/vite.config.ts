import { defineConfig } from 'vitest/config'
import { cpSync } from 'fs'
import { resolve } from 'path'

const cesiumSrc = resolve(__dirname, 'node_modules/cesium/Build/Cesium')

const copyCesiumAssets = {
  name: 'copy-cesium-assets',
  closeBundle() {
    for (const dir of ['Workers', 'Assets', 'ThirdParty', 'Widgets']) {
      cpSync(`${cesiumSrc}/${dir}`, `dist/cesium/${dir}`, { recursive: true })
    }
  }
}

export default defineConfig({
  plugins: [copyCesiumAssets],
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium/')
  },
  test: {
    environment: 'jsdom'
  }
})
