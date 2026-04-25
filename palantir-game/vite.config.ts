import { defineConfig } from 'vitest/config'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'node_modules/cesium/Build/Cesium/Workers', dest: '' },
        { src: 'node_modules/cesium/Build/Cesium/ThirdParty', dest: '' },
        { src: 'node_modules/cesium/Build/Cesium/Assets', dest: '' },
        { src: 'node_modules/cesium/Build/Cesium/Widgets', dest: '' },
      ]
    })
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify('')
  },
  test: {
    environment: 'jsdom'
  }
})
