import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5174/'
const CHROME = process.env.CHROME || '/usr/local/bin/google-chrome'
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts/screenshots'
mkdirSync(SHOTS, { recursive: true })

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
const fails = []
function rec(ok, name, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) fails.push(name)
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
        globe_layer: '',
      }),
    )
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app.has-nav-dock')
  await page.waitForSelector('[data-nav="watchlist"]')
  await page.evaluate(() => {
    document.querySelector('.setup-overlay button, .setup-overlay [data-dismiss]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(200)

  const labels = await page.$$eval('.nav-dock .nav-island-label', (els) => els.map((e) => (e.textContent || '').trim()))
  rec(labels.join(' ') === 'Chat Lage Hören Kalender Filme Mehr', 'sechs Dock-Labels', labels.join(' | '))
  await page.screenshot({ path: `${SHOTS}/18-7-dock.png` })

  await page.evaluate(() => {
    document.querySelector('[data-nav="watchlist"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  const open1 = await page.evaluate(() => ({
    watch: Boolean(document.querySelector('.watch-overlay')),
    drive: Boolean(document.querySelector('.drive-overlay, .carplay')),
    thumb: document.querySelector('.nav-island-item.is-on')?.getAttribute('data-nav') || '',
  }))
  rec(open1.watch && !open1.drive, 'Filme öffnet Watchliste', JSON.stringify(open1))
  rec(open1.thumb === 'watchlist', 'Thumb auf Filme')
  await page.screenshot({ path: `${SHOTS}/18-7-filme-overlay.png` })

  await page.evaluate(() => {
    document.querySelector('[data-nav="watchlist"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  rec(!(await page.$('.watch-overlay')), 'zweiter Tap Filme schließt')

  await page.evaluate(() => {
    document.querySelector('[data-nav="watchlist"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(300)
  await page.evaluate(() => {
    document.querySelector('[data-nav="chat"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  rec(!(await page.$('.watch-overlay')), 'Chat schließt Folie')
  await page.screenshot({ path: `${SHOTS}/18-7-dock-chat.png` })

  const box = await page.$('textarea[placeholder="Nachricht an Jarvis…"]')
  rec(Boolean(box), 'Composer da')
  if (box) {
    await box.click()
    await box.type('Öffne Lieblinge', { delay: 0 })
    await page.click('button[aria-label="Senden"]')
    await sleep(500)
    await page.waitForFunction(() => !document.querySelector('.composer.is-busy'), { timeout: 20_000 }).catch(() => {})
    await sleep(600)
    const after = await page.evaluate(() => {
      const overlay = document.querySelector('.watch-overlay')
      const fav = [...document.querySelectorAll('button, [role="tab"]')].some(
        (n) => /Liebling/i.test(n.textContent || '') && (n.getAttribute('aria-selected') === 'true' || n.className.includes('is-on')),
      )
      const drive = Boolean(document.querySelector('.drive-overlay, .carplay'))
      return { overlay: Boolean(overlay), fav, drive }
    })
    rec(after.overlay && !after.drive, 'Befehl Öffne Lieblinge öffnet Folie', JSON.stringify(after))
    await page.screenshot({ path: `${SHOTS}/18-7-lieblinge-befehl.png` })
  }
} catch (err) {
  rec(false, 'probe', err instanceof Error ? err.message : String(err))
  await page.screenshot({ path: `${SHOTS}/18-7-fail.png` }).catch(() => {})
} finally {
  await browser.close()
}

if (fails.length) {
  console.error(`${fails.length} fehlgeschlagen`)
  process.exit(1)
}
console.log('OK gui-18-7-dock')
