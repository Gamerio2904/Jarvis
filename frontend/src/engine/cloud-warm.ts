import { loadSettings } from './store.ts'

/** TLS/DNS warmup so the first cloud turn does not pay the handshake. No API key in the URL. */

let warmed = false

export function warmCloud(): void {
  if (warmed) return
  warmed = true
  const s = loadSettings()
  const hits: string[] = ['https://speech.platform.bing.com/']
  if (s.gemini_api_key.trim()) hits.push('https://generativelanguage.googleapis.com/')
  if (s.groq_api_key.trim()) hits.push('https://api.groq.com/')
  for (const url of hits) {
    void fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store', keepalive: true }).catch(() => undefined)
  }
}

export function resetCloudWarm() {
  warmed = false
}
