import { TEST_COPY_GROUPS } from './test-copy.ts'

export const DEBUG_OFF_BY_DEFAULT = new Set(['Fernseher & Film', 'PC'])

export function defaultDebugPicked(): string[] {
  return TEST_COPY_GROUPS.filter((g) => !DEBUG_OFF_BY_DEFAULT.has(g.title)).map((g) => g.title)
}

/** Nur noch existierende Katalog-Titel. Leere Liste bleibt leer (Knopf „keine“). */
export function sanitizeDebugPicked(titles: string[] | null | undefined): string[] {
  const known = new Set(TEST_COPY_GROUPS.map((g) => g.title))
  return (titles || []).filter((t) => known.has(t))
}

/** Persist nach dem Katalog-Schnitt: unbekannte V-Titel → Default, explizit leer bleibt leer. */
export function restoreDebugPicked(titles: string[] | null | undefined): string[] {
  const next = sanitizeDebugPicked(titles)
  if (next.length) return next
  if (Array.isArray(titles) && titles.length) return defaultDebugPicked()
  return Array.isArray(titles) ? [] : defaultDebugPicked()
}
