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
page.on('pageerror', (e) => pageErrors.push(e instanceof Error ? e.message : String(e)))
page.on('dialog', (d) => d.dismiss())

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
        globe_layer: '',
      }),
    )
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app')
  rec(!(await page.$('.setup-overlay')), 'Setup weg')

  await page.waitForSelector('textarea[placeholder="Nachricht an Jarvis…"]')
  await page.focus('textarea[placeholder="Nachricht an Jarvis…"]')
  await page.type('textarea[placeholder="Nachricht an Jarvis…"]', 'Öffne das watchlist overlay', { delay: 0 })
  await page.click('button[aria-label="Senden"]')
  await sleep(400)
  await page.waitForFunction(() => !document.querySelector('.composer.is-busy'), { timeout: 20_000 }).catch(() => {})
  await sleep(700)
  const watch = await page.evaluate(() => {
    const overlay = document.querySelector('.watch-overlay, .watchlist-overlay, [class*="watch"]')
    const title = [...document.querySelectorAll('h2, h1, .watch-title, .overlay-title')].map((n) => n.textContent || '')
    const body = (document.body.innerText || '').replace(/\s+/g, ' ')
    const drive = /Fahrmodus|keine Informationen über Ihr Ziel|Navigation starten/i.test(body)
    const watchHit = /Watchliste/i.test(body)
    return {
      overlay: Boolean(overlay),
      title: title.join(' | ').slice(0, 120),
      drive,
      watchHit,
      snippet: body.slice(0, 240),
    }
  })
  rec(watch.watchHit && !watch.drive, 'Watchlist-Overlay statt Fahrmodus', watch.snippet)
  rec(Boolean(await page.$('.watch-overlay')), 'Watchliste-Folie offen')
  rec(!(await page.$('.drive-overlay, .carplay')), 'kein Fahrmodus-Overlay')
  await page.screenshot({ path: `${SHOTS}/watchlist_overlay_open.png` })

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Fertig')
    btn?.click()
  })
  await sleep(500)
  rec(!(await page.$('.watch-overlay')), 'Watchliste-Folie zu')

  await page.waitForSelector('textarea[placeholder="Nachricht an Jarvis…"]')
  await page.focus('textarea[placeholder="Nachricht an Jarvis…"]')
  await page.evaluate(() => {
    const t = document.querySelector('textarea[placeholder="Nachricht an Jarvis…"]')
    if (t instanceof HTMLTextAreaElement) t.value = ''
  })
  await page.type('textarea[placeholder="Nachricht an Jarvis…"]', 'Was fährt auf See', { delay: 0 })
  await page.click('button[aria-label="Senden"]')
  await sleep(400)
  await page.waitForFunction(() => !document.querySelector('.composer.is-busy'), { timeout: 20_000 }).catch(() => {})
  await sleep(800)
  rec(Boolean(await page.$('.globe-view')), 'See-Schicht öffnet die Kugel')
  rec(
    await page.evaluate(() =>
      [...document.querySelectorAll('.lage-chip')].some((b) => /See aus/.test(b.textContent || '')),
    ),
    'Chip See aus',
  )
  rec(
    await page.evaluate(() => {
      const intel = document.querySelector('.lage-intel')
      const text = `${intel?.textContent || ''} ${document.body.innerText || ''}`
      return Boolean(intel) || /See|Tabelle|Kein Live|Häfen|Hormus/i.test(text)
    }),
    'Intel-Leiste oder See-Fakten sichtbar',
  )
  await page.screenshot({ path: `${SHOTS}/lage_ships_layer.png` })

  rec(pageErrors.length === 0, 'keine pageerror', pageErrors.slice(0, 3).join(' | '))
} catch (err) {
  rec(false, 'Lauf abgebrochen', String(err).slice(0, 240))
} finally {
  const fail = out.filter((x) => !x.ok).length
  console.log(`${fail} fehlgeschlagen`)
  await browser.close()
  if (fail) process.exit(1)
}
