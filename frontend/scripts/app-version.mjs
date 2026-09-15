import { readFileSync } from 'node:fs'

/**
 * Eine Quelle für die Version. Vorher stand `18.0.3` als Literal in sechs
 * Testskripten: der Versionssprung auf `18.0.4` ließ sie alle rot laufen, und
 * niemand sah es, weil der Sammellauf sie erst hinter den grünen Tests zeigt.
 */
export const PKG_VERSION = String(
  JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version || '',
)

/** `18.0.5` → `180005`, wie `apply-native-tv.mjs` es in Gradle schreibt. */
export function versionCodeOf(name = PKG_VERSION) {
  const [major = 0, minor = 0, patch = 0] = name
    .split('.')
    .map((p) => Number.parseInt(String(p).replace(/\D/g, ''), 10) || 0)
  return Math.max(major * 10000 + minor * 100 + patch, 10000)
}
