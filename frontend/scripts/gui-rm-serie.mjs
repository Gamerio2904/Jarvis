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
  rec(
    await page.evaluate(() => /826 Charaktere/.test(document.querySelector('.lage-hint')?.textContent || '')),
    'Hinweis nennt 826 Charaktere',
  )
  await sleep(4500)
  const faces = await page.evaluate(() => {
    const canvas = document.querySelector('.serie-map-canvas')
    return canvas instanceof HTMLCanvasElement ? canvas.dataset.faces || '' : ''
  })
  rec(true, 'Avatar-Stand', faces)
  await page.screenshot({ path: `${SHOTS}/lage-serie-nodes.png` })

  await page.waitForSelector('.serie-search')
  await page.click('.serie-search')
  await page.type('.serie-search', 'Rick Sanchez', { delay: 20 })
  await sleep(300)
  rec(
    await page.evaluate(() =>
      [...document.querySelectorAll('.serie-hits button')].some((b) => /Rick Sanchez/.test(b.textContent || '')),
    ),
    'Suche listet Rick Sanchez',
  )
  await sleep(900)
  await page.screenshot({ path: `${SHOTS}/lage-serie-search.png` })
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.serie-hits button')].find((n) =>
      /^Rick Sanchez$/.test((n.textContent || '').trim()),
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
