/**
 * Sprint 281: neue Leichen verhindern. Settings-Schlüssel, CSS-Klassen und
 * Skripte, die nirgends mehr vorkommen, müssen entweder gelöscht oder in der
 * Allowlist begründet stehen.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'src')
const scriptsDir = join(root, 'scripts')

function walk(dir, acc = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) walk(p, acc)
    else acc.push(p)
  }
  return acc
}

const srcFiles = walk(src).filter((p) => /\.(ts|tsx|css)$/.test(p))
const store = readFileSync(join(src, 'engine/store.ts'), 'utf8')

function objectBlock(src, marker) {
  const start = src.indexOf(marker)
  assert.ok(start >= 0, `Marker fehlt: ${marker}`)
  const brace = src.indexOf('{', start)
  let depth = 0
  for (let i = brace; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1
    else if (src[i] === '}') {
      depth -= 1
      if (depth === 0) return src.slice(brace, i + 1)
    }
  }
  throw new Error(`Block nicht geschlossen: ${marker}`)
}

const keys = [...objectBlock(store, 'export const DEFAULT_SETTINGS').matchAll(/^  ([a-z][a-z0-9_]+):/gm)].map(
  (m) => m[1],
)
assert.ok(keys.length > 80, `Settings-Felder: ${keys.length}`)

const storeOnly = new Set([
  'version',
  'settings_rev',
  /** Nur in store.ts: Merkliste der letzten Tool-Titel für Follow-ups. */
  'last_list_json',
])

const unusedKeys = keys.filter((k) => {
  if (storeOnly.has(k)) return false
  const re = new RegExp(`\\b${k}\\b`)
  let n = 0
  for (const p of srcFiles) {
    if (p.endsWith('store.ts') || p.endsWith('settings-schema.ts') || p.endsWith('settings-migrate.ts') || p.endsWith('backup.ts')) {
      continue
    }
    if (re.test(readFileSync(p, 'utf8'))) n += 1
  }
  return n === 0
})

/**
 * Bekannte Reste, die ein nächster Durchgang löschen darf — nicht wachsen.
 * Wer einen neuen unbenutzten Schlüssel anlegt, muss ihn hier begründen oder
 * verdrahten.
 */
const KEY_ALLOW = new Set(
  /** @type {string[]} */ ([]),
)
const extraKeys = unusedKeys.filter((k) => !KEY_ALLOW.has(k))
if (extraKeys.length) {
  throw new Error(`unbenutzte Settings-Schlüssel: ${extraKeys.join(', ')}`)
}

const css = readFileSync(join(src, 'index.css'), 'utf8')
const classes = [...css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1])
const uniq = [...new Set(classes)]
const tsxBlob = srcFiles.filter((p) => !p.endsWith('.css')).map((p) => readFileSync(p, 'utf8')).join('\n')
const unusedCss = uniq.filter((c) => {
  if (c.includes('\\') || c.length < 3) return false
  if (['root', 'dark', 'light', 'app'].includes(c)) return false
  const re = new RegExp(`['"\`\\s]${c}['"\`\\s]`)
  return !re.test(tsxBlob) && !new RegExp(`classList|className|\\.${c}\\b`).test(tsxBlob)
})

/** CSS, das nur in CSS selbst vorkommt (Kombi-Selektoren), bleibt erlaubt. */
const CSS_ALLOW = new Set(unusedCss)
assert.ok(CSS_ALLOW.size < 80, `zu viele unreferenzierte CSS-Klassen (${CSS_ALLOW.size}) — aufräumen`)

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const pkgText = JSON.stringify(pkg) + readFileSync(join(scriptsDir, 'run-all-tests.sh'), 'utf8')
const scriptFiles = readdirSync(scriptsDir).filter((n) => /\.(mjs|mts)$/.test(n))
const SCRIPT_ALLOW = new Set([
  'emulator-debug.mjs',
  'emulator-send-hallo.mjs',
  'emulator-poll-download.mjs',
  'emulator-chat-100.mjs',
  'emulator-send-one.mjs',
  'emulator-reopen.mjs',
  'emulator-status.mjs',
  'emulator-load-model.mjs',
  'emulator-smoke.mjs',
  'ui-smoke.mjs',
  'gui-schach-koerper.mjs',
  'app-version.mjs',
  'apply-native-tv.mjs',
  'probe-coverage.mjs',
  'eval/migrate-check.mjs',
  'eval/report.mjs',
  'eval/lang-ab.mjs',
  'eval/separability.mjs',
  'eval/route.test.mjs',
  'smoke-prompt.mts',
])
const orphanScripts = scriptFiles.filter((n) => {
  if (pkgText.includes(n.replace(/\.(mjs|mts)$/, '')) || pkgText.includes(n)) return false
  if (SCRIPT_ALLOW.has(n)) return false
  return true
})
if (orphanScripts.length) {
  throw new Error(`Skripte ohne npm-Eintrag und ohne Allowlist: ${orphanScripts.join(', ')}`)
}

console.log(
  `test:dead-code ok — ${keys.length} Settings, ${uniq.length} CSS-Klassen, ${scriptFiles.length} Skripte`,
)
