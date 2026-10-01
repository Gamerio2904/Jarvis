// @ts-nocheck
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = (rel) => readFileSync(join(here, '..', rel), 'utf8')
const intro = src('src/ui/UltronIntro.tsx')
const css = src('src/ultron-shell.css')
const app = src('src/App.tsx')
const block = css.slice(css.indexOf('/* Öffnen, eine Sekunde.'))

assert.match(app, /UltronIntro/)
assert.match(intro, /visibilitychange/)
assert.match(intro, /FULL_MS = 1000/)
assert.match(intro, /Ultron/)
assert.doesNotMatch(intro, /Jarvis/)
assert.match(block, /ultronIntroVeil 1s/)
assert.match(block, /ultronIntroIris 1s/)
assert.match(block, /ultronIntroSheen 1s/)
assert.doesNotMatch(block, /infinite/)
assert.doesNotMatch(block, /backdrop-filter/)
assert.match(block, /prefers-reduced-motion: reduce/)

console.log('test-intro ok')
