import { defineConfig } from 'vitest/config'
import { cpSync, createReadStream, existsSync, statSync } from 'fs'
import { resolve, extname, join } from 'path'

const cesiumSrc = resolve(__dirname, 'node_modules/cesium/Build/Cesium')

const MIME: Record<string, string> = {
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const copyCesiumAssets = {
  name: 'copy-cesium-assets',
  configureServer(server: any) {
    server.middlewares.use('/cesium', (req: any, res: any, next: any) => {
      const filePath = join(cesiumSrc, (req.url as string).split('?')[0]!)
      if (existsSync(filePath) && statSync(filePath).isFile()) {
        res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream')
        createReadStream(filePath).pipe(res)
      } else {
        next()
      }
    })
  },
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
