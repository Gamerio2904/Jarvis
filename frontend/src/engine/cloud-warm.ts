import { loadSettings, type Settings } from './store.ts'

/** TLS/DNS warmup so the first cloud turn does not pay the handshake. No API key in the URL. */

let warmed = false

/** Origins only — never GET the host root (Bing answers 400 and Chrome paints it red). */
export function warmOrigins(s: Settings = loadSettings()): string[] {
  const hits = ['https://speech.platform.bing.com']
  if (s.gemini_api_key.trim()) hits.push('https://generativelanguage.googleapis.com')
  if (s.groq_api_key.trim()) hits.push('https://api.groq.com')
  return hits
}

function preconnect(origin: string) {
  if (typeof document === 'undefined') return
  const href = origin.replace(/\/+$/, '')
  if (document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = href
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}

export function warmCloud(): void {
  if (warmed) return
  warmed = true
  for (const origin of warmOrigins()) preconnect(origin)
}

export function resetCloudWarm() {
  warmed = false
}
