import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  applyKeyboardMetrics,
  dockLiftPx,
  KB_OPEN_PX,
  keyboardInsetPx,
  mainBottomPadPx,
} from '../src/engine/keyboard-inset.ts'

assert.equal(keyboardInsetPx(800, 800, 0), 0)
assert.equal(keyboardInsetPx(800, 790, 0), 0, 'Chrome-Jitter unter der Schwelle')
assert.equal(keyboardInsetPx(800, 800 - (KB_OPEN_PX - 1), 0), 0)
assert.equal(keyboardInsetPx(800, 500, 0), 300)
assert.equal(keyboardInsetPx(800, 520, 20), 260)
assert.equal(keyboardInsetPx(800, Number.NaN, 0), 0)
assert.equal(dockLiftPx(300), 0, 'Dock bleibt am Layout-Boden')
assert.equal(dockLiftPx(0), 0)
assert.equal(mainBottomPadPx(0, 82), 82)
assert.equal(mainBottomPadPx(320, 82), 320)

const vars = /** @type {Record<string, string>} */ ({})
const root = {
  style: {
    setProperty(k, v) {
      vars[k] = v
    },
    removeProperty(k) {
      delete vars[k]
    },
  },
  className: '',
  classList: {
    toggle(name, on) {
      root.className = on ? name : ''
    },
    remove(name) {
      if (root.className === name) root.className = ''
    },
  },
}

applyKeyboardMetrics(/** @type {any} */ (root), 280)
assert.equal(vars['--kb'], '280px')
assert.equal(vars['--kb-lift'], '280px')
assert.equal(vars['--kb-dock'], '0px')
assert.equal(root.className, 'is-kb')

applyKeyboardMetrics(/** @type {any} */ (root), 0)
assert.equal(vars['--kb'], '0px')
assert.equal(root.className, '')

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(here, '../src/index.css'), 'utf8')
assert.match(css, /--kb:\s*0px/)
assert.match(css, /\.app\.has-nav-dock\.is-kb \.main/)
assert.match(css, /padding-bottom:\s*var\(--kb\)/)
assert.match(css, /\.nav-dock[\s\S]*var\(--kb-dock\)/)
assert.match(css, /\.main\.is-lage\.is-lage-chat \{[\s\S]*grid-template-rows/)
assert.match(css, /\.main\.is-lage\.is-lage-chat \.messages \{[\s\S]*isolation:\s*isolate/)
assert.match(css, /\.watch-overlay \{[\s\S]*bottom:\s*var\(--kb\)/)
assert.match(css, /\.cal-view \{[\s\S]*bottom:\s*var\(--kb\)/)
assert.doesNotMatch(css, /\.main\.is-lage\.is-lage-chat \.lage \{[\s\S]{0,220}min-height:\s*260px/)

const html = readFileSync(join(here, '../index.html'), 'utf8')
assert.match(html, /interactive-widget=overlays-content/)

const activity = readFileSync(join(here, '../native/tv/MainActivity.java'), 'utf8')
assert.match(activity, /SOFT_INPUT_ADJUST_NOTHING/)

const applyNative = readFileSync(join(here, 'apply-native-tv.mjs'), 'utf8')
assert.match(applyNative, /windowSoftInputMode="adjustNothing"/)

const app = readFileSync(join(here, '../src/App.tsx'), 'utf8')
assert.match(app, /bindKeyboardInset/)

console.log('test:keyboard-inset ok')
