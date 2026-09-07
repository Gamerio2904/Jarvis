import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin, ViteDevServer } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { shouldProxyWebHost, WEB_PROXY_PATH } from './src/engine/web-proxy.ts'

const root = dirname(fileURLToPath(import.meta.url))
const PROXY_UA = 'Jarvis/13.31.3 (local.jarvis.app)'

function attachJarvisProxy(server: ViteDevServer) {
  server.middlewares.use(async (req, res, next) => {
    const raw = req.url || ''
    if (!raw.startsWith(`${WEB_PROXY_PATH}?`)) {
      next()
      return
    }
    const target = new URL(raw, 'http://127.0.0.1').searchParams.get('url') || ''
    let parsed: URL
    try {
      parsed = new URL(target)
    } catch {
      res.statusCode = 400
      res.end('bad url')
      return
    }
    if (parsed.protocol !== 'https:' || !shouldProxyWebHost(parsed.hostname)) {
      res.statusCode = 403
      res.end('host')
      return
    }
    try {
      const ac = new AbortController()
      const timer = setTimeout(() => ac.abort(), 12_000)
      const r = await fetch(parsed.toString(), {
        headers: { Accept: String(req.headers.accept || '*/*'), 'User-Agent': PROXY_UA },
        signal: ac.signal,
      })
      clearTimeout(timer)
      res.statusCode = r.status
      const ct = r.headers.get('content-type')
      if (ct) res.setHeader('content-type', ct)
      res.setHeader('cache-control', 'no-store')
      res.end(Buffer.from(await r.arrayBuffer()))
    } catch {
      res.statusCode = 502
      res.end('proxy fail')
    }
  })
}

function jarvisCorsProxy(): Plugin {
  return {
    name: 'jarvis-cors-proxy',
    configureServer: attachJarvisProxy,
    configurePreviewServer: attachJarvisProxy,
  }
}

function copyWllamaAssets() {
  const dest = resolve(root, 'public/wllama')
  mkdirSync(dest, { recursive: true })
  const files: Array<[string, string]> = [
    ['node_modules/@wllama/wllama/esm/wasm/wllama.wasm', 'wllama.wasm'],
    ['node_modules/@wllama/wllama-compat/wasm/wllama.wasm', 'compat.wasm'],
    ['node_modules/@wllama/wllama-compat/wasm/wllama.js', 'compat.js'],
  ]
  for (const [from, to] of files) {
    copyFileSync(resolve(root, from), resolve(dest, to))
  }
}

export default defineConfig({
  plugins: [
    {
      name: 'copy-wllama-assets',
      buildStart() {
        copyWllamaAssets()
      },
    },
    jarvisCorsProxy(),
    react(),
  ],
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@wllama/wllama', '@wllama/wllama-compat'],
  },
  server: {
    host: true,
    port: 5173,
  },
})
