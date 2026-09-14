import type { Settings } from './store.ts'

/**
 * Feldweise Prüfung der Einstellungen. Bis 16.1.1 galt alles oder nichts: ein
 * kaputtes Feld liess `JSON.parse` entweder durchgehen (dann rechnete die App
 * mit Unsinn) oder der ganze Eintrag landete auf Werkseinstellung.
 *
 * Bewusst von Hand statt mit `zod`: die Prüfung läuft einmal je
 * `loadSettings()` über gut 250 Felder. Ein Schema-Paket kostet dafür Bundle
 * und Startzeit, ohne mehr zu fangen — die Felder sind ausnahmslos flach.
 */

/**
 * Felder mit festem Wertevorrat. Ein `hud_view: 'kugel'` aus einer alten
 * Fassung würde sonst die Oberfläche leer lassen: `typeof` allein sieht dort
 * nur eine Zeichenkette.
 */
export const ENUM_FIELDS = {
  hud_accent: ['green', 'amber'],
  ui_theme: ['dark', 'light', 'system'],
  hud_view: ['tiles', 'body', 'globe'],
  drive_speak: ['after', 'only'],
  presence_role: ['brain', 'window'],
  body_view: ['classic', 'agents'],
  brain_primary: ['groq', 'gemini', 'local'],
  globe_layer: ['', 'quakes', 'fires', 'overhead'],
} as const satisfies Partial<Record<keyof Settings, readonly string[]>>

/** Felder, deren Default `null` ist und die daneben einen Bool tragen dürfen. */
const NULLABLE_BOOL = new Set<string>(['pc_dashboard_v2'])

function fieldOk(key: string, value: unknown, fallback: unknown): boolean {
  if (NULLABLE_BOOL.has(key)) return value === null || typeof value === 'boolean'
  if (typeof value !== typeof fallback) return false
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') {
    const allowed = (ENUM_FIELDS as Record<string, readonly string[] | undefined>)[key]
    if (allowed && !allowed.includes(value)) return false
  }
  return true
}

export type CoerceResult = {
  value: Settings
  /** Namen der Felder, die auf ihren Default zurückfallen mussten. */
  repaired: string[]
}

/**
 * Baut aus Rohdaten einen vollständigen Einstellungssatz. Jedes Feld, dessen
 * Typ oder Wertevorrat nicht passt, kostet genau dieses Feld.
 *
 * Unbekannte Schlüssel bleiben erhalten. Wer eine ältere Fassung der App
 * einspielt und danach wieder die neue, soll seine Felder wiederfinden;
 * absichtlich entfernte Felder räumt stattdessen ein Migrationsschritt weg.
 */
export function coerceSettings(raw: Record<string, unknown>, defaults: Settings): CoerceResult {
  const out = { ...raw } as Record<string, unknown>
  const repaired: string[] = []
  for (const [key, fallback] of Object.entries(defaults)) {
    if (!(key in raw)) {
      out[key] = fallback
      continue
    }
    if (fieldOk(key, raw[key], fallback)) continue
    out[key] = fallback
    repaired.push(key)
  }
  return { value: out as Settings, repaired }
}
