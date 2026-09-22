/**
 * Restkontingent der Cloud-Anbieter, gelesen statt geraten.
 *
 * Groqs Free Tier ist über Raten begrenzt, nicht über ein Monatsbudget: rund
 * 1.000 Anfragen und 200.000 Tokens am Tag, pro Organisation
 * (`docs/69-modell-grundlagen.md` §3). Bei etwa 2.500 Tokens je Zug sind das
 * ungefähr 80 Züge — im Alltag genug, nach einem Debug-Nachmittag leer.
 *
 * Bisher merkte Jarvis das erst am `429`. Groq schickt
 * `x-ratelimit-remaining-*` in **jeder** Antwort mit; damit lässt sich vorher
 * umschalten. Aus „Jarvis sagt ab" wird „Jarvis wird schlichter".
 */
export type QuotaState = {
  remainingRequests: number | null
  remainingTokens: number | null
  /** Zeitpunkt, ab dem wieder normal gerechnet werden darf. */
  blockedUntil: number
  updatedAt: number
}

const EMPTY: QuotaState = {
  remainingRequests: null,
  remainingTokens: null,
  blockedUntil: 0,
  updatedAt: 0,
}

const states = new Map<string, QuotaState>()

/**
 * Reserve, keine Null. Wer bis zur letzten Anfrage wartet, verliert den Zug,
 * in dem er es merkt.
 */
export const QUOTA_RESERVE_REQUESTS = 12
export const QUOTA_RESERVE_TOKENS = 8_000

/** „1m30s", „2.5s", „60" — Groq mischt die Schreibweisen. */
export function parseDuration(raw: string | undefined | null): number | null {
  if (!raw) return null
  const t = raw.trim().toLowerCase()
  if (!t) return null
  if (/^\d+(\.\d+)?$/.test(t)) return Math.round(Number(t) * 1000)
  let ms = 0
  let hit = false
  for (const [, num, unit] of t.matchAll(/(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)/g)) {
    const n = Number(num)
    if (!Number.isFinite(n)) continue
    hit = true
    if (unit === 'ms') ms += n
    else if (unit === 's') ms += n * 1000
    else if (unit === 'm') ms += n * 60_000
    else if (unit === 'h') ms += n * 3_600_000
    else ms += n * 86_400_000
  }
  return hit ? Math.round(ms) : null
}

function num(raw: string | undefined): number | null {
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function noteQuotaHeaders(
  provider: string,
  headers: Record<string, string>,
  now = Date.now(),
): QuotaState {
  const prev = states.get(provider) ?? EMPTY
  const reqs = num(headers['x-ratelimit-remaining-requests'])
  const toks = num(headers['x-ratelimit-remaining-tokens'])
  const next: QuotaState = {
    remainingRequests: reqs ?? prev.remainingRequests,
    remainingTokens: toks ?? prev.remainingTokens,
    blockedUntil: prev.blockedUntil,
    updatedAt: now,
  }
  states.set(provider, next)
  return next
}

/** Nach einem `429`: bis zum genannten Reset gar nicht erst fragen. */
export function noteQuotaExhausted(
  provider: string,
  headers: Record<string, string> = {},
  now = Date.now(),
): void {
  const wait =
    parseDuration(headers['retry-after']) ??
    parseDuration(headers['x-ratelimit-reset-requests']) ??
    parseDuration(headers['x-ratelimit-reset-tokens']) ??
    60_000
  const prev = states.get(provider) ?? EMPTY
  states.set(provider, {
    ...prev,
    remainingRequests: 0,
    blockedUntil: now + Math.min(wait, 3 * 3_600_000),
    updatedAt: now,
  })
}

export function quotaState(provider: string): QuotaState {
  return states.get(provider) ?? EMPTY
}

/**
 * Soll die Cloud diesen Zug übersprungen werden?
 *
 * Wichtig für den Ton: Das lokale Modell ist schlechter, nicht kaputt. Der
 * Nutzer soll das wissen, aber keine Absage bekommen. Ein leeres Kontingent
 * ist kein Fehler, sondern ein erwarteter Zustand des Free Tiers.
 */
export function quotaBlocked(provider: string, now = Date.now()): boolean {
  const s = states.get(provider)
  if (!s) return false
  if (s.blockedUntil > now) return true
  /**
   * Ist die Sperre abgelaufen, sind die alten Restzahlen wertlos: sie stammen
   * aus der Zeit vor dem Reset und stünden sonst für immer auf null.
   */
  if (s.blockedUntil) {
    states.set(provider, { ...EMPTY, updatedAt: now })
    return false
  }
  if (s.remainingRequests != null && s.remainingRequests <= QUOTA_RESERVE_REQUESTS) return true
  if (s.remainingTokens != null && s.remainingTokens <= QUOTA_RESERVE_TOKENS) return true
  return false
}

export function quotaHint(provider: string, now = Date.now()): string {
  if (!quotaBlocked(provider, now)) return ''
  return 'Ich antworte gerade offline, das Tageslimit ist fast leer.'
}

/** Einmal warten, gedeckelt — Recover, kein Key-Tausch. */
export function retryAfterMs(headers: Record<string, string> = {}, cap = 2_500): number {
  const wait = parseDuration(headers['retry-after']) ?? 0
  if (wait <= 0) return 0
  return Math.min(wait, cap)
}

export function resetQuota(): void {
  states.clear()
}

/** Für den Debug-Bogen. */
export function quotaSnapshot(): Array<{ provider: string } & QuotaState> {
  return [...states.entries()].map(([provider, s]) => ({ provider, ...s }))
}
