import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = dirname(fileURLToPath(import.meta.url))

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
