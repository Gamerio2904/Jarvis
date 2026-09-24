// @ts-nocheck
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5173/'
const CHROME = process.env.CHROME || '/usr/local/bin/google-chrome'
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts/screenshots'
mkdirSync(SHOTS, { recursive: true })

const out = []
function rec(ok, name, detail = '') {
  out.push({ ok, name, detail })
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 45_000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=430,900'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})
const page = await browser.newPage()
page.setDefaultTimeout(20_000)
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app')
  await page.evaluate(() => {
    localStorage.setItem(
      'jarvis_settings_v13',
      JSON.stringify({
        setup_dismissed: true,
        hud_force: false,
        hud_hidden: true,
        hud_view: 'tiles',
        body_with_chat: true,
      }),
    )
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app')

  await page.click('.nav-dock button[aria-label="Lage"]')
  await sleep(600)
  rec(Boolean(await page.$('.lage')), 'Lage offen')

  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll('.lage-tab')].map((n) => (n.textContent || '').trim()),
  )
  rec(tabs.includes('Serie'), 'Tab Serie', tabs.join('|'))

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.lage-tab')].find((n) => (n.textContent || '').trim() === 'Serie')
    b?.click()
  })
  await sleep(700)
  rec(Boolean(await page.$('.serie-map-canvas')), 'Canvas da')
  rec(Boolean(await page.$('.serie-faces')), 'Avatar-Schicht da')
  rec(
    await page.evaluate(() => /826 Charaktere/.test(document.querySelector('.lage-hint')?.textContent || '')),
    'Hinweis nennt 826 Charaktere',
  )
  const nodeCount = await page.evaluate(() => document.querySelectorAll('.serie-face').length)
  rec(nodeCount === 826, '826 runde Knoten-Bilder', String(nodeCount))

  await page.waitForFunction(
    () =>
      ['1', '2', '3', '4', '5'].every((id) =>
        document.querySelector(`.serie-face[data-id="${id}"]`)?.classList.contains('is-ready'),
      ),
    { timeout: 15_000 },
  )
  await sleep(2500)
  const faces = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.serie-face')]
    const canvas = document.querySelector('.serie-map-canvas')
    const ready = all.filter((n) => n.classList.contains('is-ready'))
    const srcTooSoon = all.filter((n) => n.getAttribute('src') && !n.classList.contains('is-ready'))
    const broken = all.filter(
      (n) => n instanceof HTMLImageElement && n.getAttribute('src') && n.complete && n.naturalWidth === 0,
    )
    const coreReady = ['1', '2', '3', '4', '5'].every((id) =>
      document.querySelector(`.serie-face[data-id="${id}"]`)?.classList.contains('is-ready'),
    )
    const round = all.slice(0, 8).every((n) => {
      const s = getComputedStyle(n)
      return s.borderRadius.includes('50%') && s.objectFit === 'cover'
    })
    return {
      dataset: canvas instanceof HTMLCanvasElement ? canvas.dataset.faces || '' : '',
      ready: ready.length,
      srcTooSoon: srcTooSoon.length,
      broken: broken.length,
      coreReady,
      round,
    }
  })
  rec(faces.coreReady, 'Kernfamilie hat Portraits')
  rec(faces.ready >= 20, 'Portraits geladen', `${faces.ready} ready, dataset=${faces.dataset}`)
  rec(faces.srcTooSoon === 0, 'kein src vor dem Laden', String(faces.srcTooSoon))
  rec(faces.broken === 0, 'keine kaputten Knoten-Icons', String(faces.broken))
  rec(faces.round, 'Knoten sind kreisförmig mit Cover')
  await page.screenshot({ path: `${SHOTS}/lage-serie-nodes.png` })

  const rickFace = await page.evaluate(() => {
    const img = document.querySelector('.serie-face[data-id="1"]')
    const r = img?.getBoundingClientRect()
    return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } : null
  })
  rec(Boolean(rickFace && rickFace.w >= 20), 'Rick-Knoten sichtbar', rickFace ? `${Math.round(rickFace.w)}px` : 'fehlt')
  if (rickFace) {
    await page.mouse.click(rickFace.x, rickFace.y)
    await sleep(500)
  }
  rec(
    await page.evaluate(() => document.querySelector('#serie-dossier-title')?.textContent === 'Rick Sanchez'),
    'Klick auf Rick-Knoten öffnet Steckbrief',
  )
  await page.evaluate(() => document.querySelector('.serie-dossier .pin-bubble-x')?.click())
  await sleep(200)

  await page.waitForSelector('.serie-search')
  await page.click('.serie-search')
  await page.type('.serie-search', 'Rick Sanchez', { delay: 20 })
  await sleep(400)
  const hits = await page.evaluate(() =>
    [...document.querySelectorAll('.serie-hits button')].map((b) => ({
      text: (b.textContent || '').trim(),
      ready:
        b.querySelector('img') instanceof HTMLImageElement &&
        b.querySelector('img').complete &&
        b.querySelector('img').naturalWidth > 0,
    })),
  )
  rec(
    hits.some((h) => /Rick Sanchez · Earth \(C-137\)/.test(h.text)),
    'Suche trennt Rick C-137',
    hits.map((h) => h.text).join(' | '),
  )
  rec(
    hits.filter((h) => /Rick Sanchez/.test(h.text)).length >= 2,
    'mehrere Rick-Sanchez-Treffer',
    String(hits.length),
  )
  rec(
    hits.some((h) => /C-137/.test(h.text) && h.ready),
    'Such-Avatar von C-137 geladen',
  )
  await sleep(600)
  await page.screenshot({ path: `${SHOTS}/lage-serie-search.png` })
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.serie-hits button')].find((n) =>
      /Earth \(C-137\)/.test(n.textContent || ''),
    )
    b?.click()
  })
  await sleep(500)
  const dossier = await page.evaluate(() => {
    const box = document.querySelector('.serie-dossier')
    const text = box?.textContent || ''
    return {
      open: Boolean(box),
      title: document.querySelector('#serie-dossier-title')?.textContent || '',
      race: /Rasse\s+Human/.test(text),
      shield: /Persönlicher Schild/.test(text) && /Staffel 3 Folge 5/.test(text),
      wrong: /Schild[\s\S]*Staffel 5 Folge 5/.test(text),
      morty: /Morty Smith/.test(text),
    }
  })
  rec(dossier.open, 'Steckbrief offen')
  rec(dossier.title === 'Rick Sanchez', 'Titel Rick Sanchez', dossier.title)
  rec(dossier.race, 'Rasse Human')
  rec(dossier.shield, 'Schild Staffel 3 Folge 5')
  rec(!dossier.wrong, 'kein falscher S05E05-Schild')
  rec(dossier.morty, 'Kante zu Morty')
  await page.waitForFunction(() => {
    const img = document.querySelector('.serie-dossier-photo img')
    return img instanceof HTMLImageElement && img.complete && img.naturalWidth >= 200
  })
  const photo = await page.evaluate(() => {
    const img = document.querySelector('.serie-dossier-photo img')
    const r = img?.getBoundingClientRect()
    return {
      w: r ? Math.round(r.width) : 0,
      h: r ? Math.round(r.height) : 0,
      nw: img instanceof HTMLImageElement ? img.naturalWidth : 0,
    }
  })
  rec(photo.nw >= 200, 'Vollbild geladen', `${photo.nw}px Quelle`)
  rec(photo.w >= 200 && photo.h >= 160, 'Vollbild groß im Steckbrief', `${photo.w}×${photo.h}`)
  await sleep(800)
  await page.screenshot({ path: `${SHOTS}/lage-serie-rick.png` })

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.serie-dossier-links button')].find((n) =>
      /Morty Smith/.test(n.textContent || ''),
    )
    b?.click()
  })
  await sleep(400)
  rec(
    await page.evaluate(() => document.querySelector('#serie-dossier-title')?.textContent === 'Morty Smith'),
    'Klick auf Morty wechselt den Steckbrief',
  )
  await page.screenshot({ path: `${SHOTS}/lage-serie-morty.png` })

  await page.evaluate(() => document.querySelector('.serie-dossier .pin-bubble-x')?.click())
  await page.click('.serie-search', { clickCount: 3 })
  await page.keyboard.press('Backspace')
  await sleep(200)
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.lage-chip')].find((n) => /Mit Fähigkeit/.test(n.textContent || ''))
    b?.click()
  })
  await sleep(400)
  const skillFilter = await page.evaluate(() => {
    const vis = [...document.querySelectorAll('.serie-face')].filter((n) => !n.hidden)
    return vis.length
  })
  rec(skillFilter === 30, 'Filter Mit Fähigkeit grenzt ein', String(skillFilter))

  rec(!pageErrors.length, 'keine Page-Errors', pageErrors.slice(0, 2).join(' | '))
} finally {
  await browser.close()
}

const fail = out.filter((r) => !r.ok)
if (fail.length) {
  console.error(`${fail.length} GUI-Checks rot`)
  process.exit(1)
}
console.log('gui-rm-serie ok')
