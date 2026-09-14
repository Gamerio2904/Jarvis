/**
 * Benannte Migrationsschritte für die Einstellungen.
 *
 * Bis 16.1.1 war die einzige „Migration" ein `{...DEFAULT_SETTINGS, ...prev}`.
 * Das reicht, solange nur Felder dazukommen. Sobald eines umbenannt oder
 * entfernt wird, ist der alte Wert lautlos weg — der Nutzer merkt es an einer
 * Einstellung, die wieder auf Werk steht, und weiss nicht warum.
 *
 * Jeder Schritt hier hat einen Namen, läuft genau einmal und hat einen Test.
 * `settings_rev` merkt sich, wie weit ein Hausstand schon gewandert ist.
 */

export type Household = Record<string, unknown>

export type MigrationStep = {
  /** Fortlaufend nummeriert, damit die Reihenfolge im Dateibaum sichtbar ist. */
  id: string
  apply: (raw: Household) => Household
}

/**
 * Wert von `from` nach `to` umziehen, ohne ihn zu verlieren. Ein bereits
 * gesetztes `to` gewinnt: es ist der neuere Wert.
 */
export function renameField(raw: Household, from: string, to: string): Household {
  if (!(from in raw)) return raw
  const out = { ...raw }
  const carried = out[from]
  delete out[from]
  if (!(to in raw) || raw[to] === undefined) out[to] = carried
  return out
}

/** Feld ersatzlos streichen. Nur für Felder, die nichts mehr liest. */
export function dropFields(raw: Household, keys: readonly string[]): Household {
  let touched = false
  const out = { ...raw }
  for (const key of keys) {
    if (!(key in out)) continue
    delete out[key]
    touched = true
  }
  return touched ? out : raw
}

/**
 * `routing_mode` und `brain_gemini_roles_tts` standen seit dem Umbau auf die
 * Agenten-Auswahl bzw. auf `brain_primary` nur noch im Datensatz herum. Kein
 * Lesezugriff in der App, keine Oberfläche, kein Test.
 */
const DEAD_FIELDS = ['routing_mode', 'brain_gemini_roles_tts'] as const

export const MIGRATIONS: MigrationStep[] = [
  {
    id: '001-tote-felder-entfernen',
    apply: (raw) => dropFields(raw, DEAD_FIELDS),
  },
]

/** Stand, auf dem ein frisch geschriebener Hausstand steht. */
export const SETTINGS_REV = MIGRATIONS.length

export type MigrationResult = {
  value: Household
  /** Namen der Schritte, die auf diesen Hausstand angewandt wurden. */
  applied: string[]
  rev: number
}

function revOf(raw: Household): number {
  const got = raw.settings_rev
  if (typeof got !== 'number' || !Number.isFinite(got) || got < 0) return 0
  return Math.floor(got)
}

export function migrateSettings(raw: Household): MigrationResult {
  const from = revOf(raw)
  let value = raw
  const applied: string[] = []
  for (let i = from; i < MIGRATIONS.length; i += 1) {
    value = MIGRATIONS[i].apply(value)
    applied.push(MIGRATIONS[i].id)
  }
  // Ein höherer Stand kommt von einer neueren Fassung der App. Den nicht
  // zurückdrehen, sonst laufen die Schritte beim nächsten Update erneut.
  const rev = Math.max(from, SETTINGS_REV)
  if (applied.length === 0 && from === rev) return { value, applied, rev }
  return { value: { ...value, settings_rev: rev }, applied, rev }
}
