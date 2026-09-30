import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(here, '../src/index.css'), 'utf8')
const app = readFileSync(join(here, '../src/App.tsx'), 'utf8')
const lage = readFileSync(join(here, '../src/ui/lage/Lage.tsx'), 'utf8')
const blocks = readFileSync(join(here, '../src/engine/chat-blocks.ts'), 'utf8')

assert.match(css, /min-width:\s*900px[\s\S]*\.main\.is-lage:not\(\.is-lage-sidechat\) \.messages/)
assert.match(css, /\.main\.is-lage\.is-lage-sidechat/)
assert.match(css, /\.sidebar \.nav-island-side \{[\s\S]*order:\s*4/)
assert.match(css, /data-motif='grid'/)
assert.match(css, /data-motif='pulse'/)
assert.match(app, /function showTischplatte/)
assert.match(app, /is-lage-sidechat/)
assert.match(app, /onToggleSideChat/)
assert.match(app, /tischplatte_on: on/)
assert.match(lage, /data-lage-chat/)
assert.match(lage, /lage-stage/)
assert.match(blocks, /hud\|board/)

console.log('ok test-tablet-layout')
