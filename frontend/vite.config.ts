import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@wllama/wllama'],
  },
  server: {
    host: true,
    port: 5173,
  },
})
