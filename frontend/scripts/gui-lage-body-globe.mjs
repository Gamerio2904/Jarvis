// @ts-nocheck — Sichtlauf gegen den Dev-Server, wie die anderen GUI-Skripte.
/**
 * Sichtprüfung: Körper-Netz hat Höhe, Waldbrände nicht von allein an,
 * Pin-Tap öffnet die Karte. Läuft gegen den Vite-Dev-Server.
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5173/'
const CHROME = process.env.CHROME || '/usr/local/bin/google-chrome'
const SHOTS = process.env.SHOTS || '/tmp/shots'
mkdirSync(SHOTS, { recursive: true })

const out = []
function rec(ok, name, detail = '') {
  out.push({ ok, name, detail })
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const FIRE = {
  events: [
    {
      title: 'Testwaldbrand Mitte',
      geometry: [{ coordinates: [10.4, 50.1] }],
    },
  ],
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: process.env.HEADED === '1' ? false : true,
  protocolTimeout: 45_000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=430,900'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})
const page = await browser.newPage()
page.setDefaultTimeout(20_000)
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))
page.on('dialog', (d) => d.dismiss())

await page.setRequestInterception(true)
page.on('request', (req) => {
  const url = req.url()
  if (/eonet\.gsfc\.nasa\.gov/i.test(url) || /events\?status=open&category=wildfires/i.test(decodeURIComponent(url))) {
    void req.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FIRE),
    })
    return
  }
  void req.continue()
})

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

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
        globe_layer: 'fires',
        body_with_chat: true,
        body_view: 'agents',
      }),
    )
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app')
  rec(!(await page.$('.setup-overlay')), 'Setup weg')

  await page.click('.nav-dock button[aria-label="Lage"]')
  await sleep(700)
  rec(Boolean(await page.$('.globe-view')), 'Dock Lage öffnet die Kugel')
  const chip = await page.evaluate(() =>
    [...document.querySelectorAll('.lage-chip')].some((b) => /Waldbrände aus/.test(b.textContent || '')),
  )
  rec(!chip, 'Dock löscht die Waldbrand-Schicht', chip ? 'Chip ist da' : '')
  const layer = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('jarvis_settings_v13') || '{}').globe_layer || ''
    } catch {
      return '?'
    }
  })
  rec(layer === '', 'globe_layer nach Dock leer', layer)

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.lage-tab')].find((n) => n.textContent.trim() === 'Körper')
    b?.click()
  })
  await sleep(800)
  rec(Boolean(await page.$('.agent-map-canvas')), 'Körper-Netz ist da')
  rec(Boolean(await page.$('.app.is-lage-chat, .main.is-lage-chat')), 'Split Körper+Chat')

  const layout = await page.evaluate(() => {
    const canvas = document.querySelector('.agent-map-canvas')
    const halo = document.querySelector('.empty-halo')
    const wake = document.querySelector('.wake-bubble')
    const status = document.querySelector('.agent-status-bar')
    const brand = document.querySelector('.lage-brand')
    const lage = document.querySelector('.lage')
    const empty = document.querySelector('.empty')
    const cs = (el) => (el ? getComputedStyle(el) : null)
    const r = canvas?.getBoundingClientRect()
    return {
      canvasH: r ? Math.round(r.height) : 0,
      canvasW: r ? Math.round(r.width) : 0,
      lageH: lage ? Math.round(lage.getBoundingClientRect().height) : 0,
      halo: halo ? cs(halo).display : 'missing',
      wake: wake ? cs(wake).display : 'missing',
      status: status ? cs(status).display : 'missing',
      brand: brand ? cs(brand).display : 'missing',
      emptyPad: empty ? cs(empty).paddingTop : '',
    }
  })
  rec(layout.canvasH >= 160, 'Netz mindestens 160px hoch', `${layout.canvasH}×${layout.canvasW}, Lage ${layout.lageH}`)
  rec(layout.halo === 'none' || layout.halo === 'missing', 'leerer Halo aus', layout.halo)
  rec(layout.wake === 'none' || layout.wake === 'missing', 'Wake-Bubble aus', layout.wake)
  rec(layout.status === 'none' || layout.status === 'missing', 'Statusleiste im Split aus', layout.status)
  rec(layout.brand === 'none' || layout.brand === 'missing', 'Marke im Split aus', layout.brand)
  await page.screenshot({ path: `${SHOTS}/lage_body_chat.png` })

  await page.click('.nav-dock button[aria-label="Lage"]')
  await sleep(400)
  rec(Boolean(await page.$('.agent-map-canvas')), 'Dock lässt Körper stehen')

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.lage-tab')].find((n) => n.textContent.trim() === 'Kugel')
    b?.click()
  })
  await sleep(500)
  rec(!(await page.$('.pin-bubble-backdrop')), 'kein Vollschirm-Hintergrund auf der Kugel')

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.lage-tab')].find((n) => n.textContent.trim() === 'Körper')
    b?.click()
  })
  await sleep(500)
  await page.waitForSelector('textarea[placeholder="Nachricht an Jarvis…"]')
  await page.focus('textarea[placeholder="Nachricht an Jarvis…"]')
  await page.type('textarea[placeholder="Nachricht an Jarvis…"]', 'Zeig Waldbrände', { delay: 0 })
  await page.click('button[aria-label="Senden"]')
  await sleep(400)
  await page.waitForFunction(() => !document.querySelector('.composer.is-busy'), { timeout: 20_000 }).catch(() => {})
  await sleep(900)
  rec(Boolean(await page.$('.globe-view')), 'Zeig Waldbrände öffnet die Kugel')
  rec(
    await page.evaluate(() =>
      [...document.querySelectorAll('.lage-chip')].some((b) => /Waldbrände aus/.test(b.textContent || '')),
    ),
    'Chip Waldbrände aus wenn Schicht an',
  )

  const box = await page.$eval('.globe-view', (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })
  await page.mouse.click(box.x, box.y)
  await sleep(500)
  const tapped = await page.evaluate(() => {
    const bubble = document.querySelector('.pin-bubble')
    return bubble ? (bubble.textContent || '').replace(/\s+/g, ' ').trim() : 'keine Karte'
  })
  rec(/Testwaldbrand|EONET|Waldbrand/i.test(tapped), 'Waldbrand-Pin öffnet Infos', tapped.slice(0, 120))
  rec(!/Keine Kurzlage/.test(tapped), 'keine leere Kurzlage', tapped.slice(0, 80))
  await page.screenshot({ path: `${SHOTS}/lage_globe_fire_pin.png` })

  await page.click('.nav-dock button[aria-label="Lage"]')
  await sleep(500)
  const afterDock = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('jarvis_settings_v13') || '{}').globe_layer || ''
    } catch {
      return '?'
    }
  })
  rec(afterDock === '', 'Dock Lage erneut ohne Schicht', afterDock)
  rec(!(await page.$('.pin-bubble-backdrop')), 'Backdrop bleibt weg')

  rec(pageErrors.length === 0, 'keine pageerror', pageErrors.slice(0, 3).join(' | '))
} catch (err) {
  rec(false, 'Lauf abgebrochen', String(err).slice(0, 200))
} finally {
  const fail = out.filter((x) => !x.ok).length
  console.log(`${fail} fehlgeschlagen`)
  await browser.close()
  if (fail) process.exit(1)
}
