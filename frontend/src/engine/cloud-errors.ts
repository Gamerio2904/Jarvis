/** Pure helpers for Gemini/Groq cascade — no network, safe to unit-test. */

export const GEMINI_MODELS_BEST_FIRST = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
] as const

export const GROQ_MODELS_BEST_FIRST = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'openai/gpt-oss-20b',
  'gemma2-9b-it',
] as const

const SKIP_MS = 12 * 60 * 1000

export function parseSkipMap(raw: string | undefined | null): Record<string, number> {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(parsed)) {
      const n = Number(v)
      if (k && Number.isFinite(n) && n > Date.now()) out[k] = n
    }
    return out
  } catch {
    return {}
  }
}

export function markSkip(raw: string | undefined | null, model: string, now = Date.now()): string {
  const map = parseSkipMap(raw)
  map[model] = now + SKIP_MS
  return JSON.stringify(map)
}

export function geminiModelOrder(skipRaw: string | undefined | null, missing: Iterable<string> = []): string[] {
  const skip = parseSkipMap(skipRaw)
  const gone = new Set(missing)
  const all = GEMINI_MODELS_BEST_FIRST.filter((m) => !gone.has(m))
  const ready = all.filter((m) => !skip[m])
  const later = all.filter((m) => skip[m])
  return [...ready, ...later]
}

function blob(status: number, message: string, errorStatus = ''): string {
  return `${status} ${message} ${errorStatus}`.toLowerCase()
}

export function isFatalAuth(status: number, message: string, errorStatus = ''): boolean {
  const m = blob(status, message, errorStatus)
  if (
    m.includes('api_key_invalid') ||
    m.includes('api key not valid') ||
    m.includes('invalid api key') ||
    m.includes('incorrect api key') ||
    m.includes('provided api key')
  ) {
    return true
  }
  if (status === 401) return true
  if (status === 403 && (m.includes('api key') || m.includes('unauthenticated'))) return true
  return false
}

export function isUnknownModel(status: number, message: string, errorStatus = ''): boolean {
  const m = blob(status, message, errorStatus)
  if (status === 404) return true
  if (m.includes('not found') || m.includes('not_found') || m.includes('is not found')) return true
  return false
}

export function isRetryableCloud(status: number, message: string, errorStatus = ''): boolean {
  const m = blob(status, message, errorStatus)
  if (status === 429 || status === 503 || status === 502 || status === 504) return true
  if (status === 500 && (m.includes('unavailable') || m.includes('overload') || m.includes('capacity'))) {
    return true
  }
  return (
    m.includes('resource_exhausted') ||
    m.includes('unavailable') ||
    m.includes('high demand') ||
    m.includes('quota') ||
    m.includes('rate limit') ||
    m.includes('rate_limit') ||
    m.includes('try again later') ||
    m.includes('overloaded') ||
    m.includes('too many requests') ||
    m.includes('capacity') ||
    m.includes('currently experiencing') ||
    m.includes('spikes in demand')
  )
}

export function looksLikeProviderEnglish(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('high demand') ||
    m.includes('try again later') ||
    m.includes('resource_exhausted') ||
    m.includes('spikes in demand') ||
    m.includes('currently experiencing') ||
    m.includes('rate limit') ||
    m.includes('please try again') ||
    m.includes('this model is currently')
  )
}

export function germanAuthError(): string {
  return 'Gemini-Key ungültig. In Google AI Studio einen neuen Key holen.'
}

export function germanQuotaHint(groqConfigured: boolean): string {
  if (groqConfigured) {
    return 'Google und Groq antworten gerade nicht. Später erneut senden.'
  }
  return 'Google ist überlastet oder das Tageslimit ist leer. Optional Groq-Schlüssel unter Einstellungen (console.groq.com/keys) — hoher Free-Tier. Oder später erneut senden.'
}

export function germanNetworkError(): string {
  return 'Keine Verbindung zur Cloud. WLAN prüfen.'
}

export function userFacingCloudError(raw: string, groqConfigured: boolean): string {
  const m = raw.toLowerCase()
  if (isFatalAuth(0, raw)) return germanAuthError()
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('timeout')) {
    return germanNetworkError()
  }
  if (isRetryableCloud(0, raw) || looksLikeProviderEnglish(raw)) {
    return germanQuotaHint(groqConfigured)
  }
  if (/[äöüÄÖÜß]/.test(raw)) return raw
  return germanQuotaHint(groqConfigured)
}

