import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5173/'
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
  await sleep(400)

  const home = await page.evaluate(() => ({
    screen: Boolean(document.querySelector('.home-screen')),
    apps: [...document.querySelectorAll('[data-home-app]')].map((e) => e.getAttribute('data-home-app')),
    composer: Boolean(document.querySelector('.composer')),
    rail: Boolean(document.querySelector('.glance-rail')),
    mini: Boolean(document.querySelector('.mini-chat')),
    sphere: Boolean(document.querySelector('.voice-shortcut .voice-sphere')),
    dock: [...document.querySelectorAll('.nav-dock .nav-island-label')].map((e) => (e.textContent || '').trim()),
    thumb: document.querySelector('.nav-dock .nav-island-item.is-on')?.getAttribute('data-nav') || '',
  }))
  rec(home.screen, 'Homescreen sichtbar')
  rec(!home.composer, 'Chat-Composer nicht auf Start')
  rec(home.apps.join() === 'chat,voice,calendar,globe,lage,overlay,hirn,settings,watchlist', 'neun Kacheln', home.apps.join('|'))
  rec(home.rail && home.mini && home.sphere, 'Leiste + Mini-Chat + Kugel', JSON.stringify(home))
  rec(home.dock[0] === 'Start' && home.thumb === 'home', 'Dock Start', `${home.thumb} ${home.dock.join('|')}`)
  await page.screenshot({ path: `${SHOTS}/18-18-homescreen.png` })

  await page.evaluate(() => {
    document.querySelector('.glance-rail-tab')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(300)
  const rail = await page.evaluate(() => ({
    open: document.querySelector('.glance-rail')?.classList.contains('is-open'),
    next: document.querySelector('.glance-rail-panel dd')?.textContent || '',
    hirn: [...document.querySelectorAll('.glance-rail-panel dt')].map((e) => e.textContent).join('|'),
  }))
  rec(rail.open && /Nichts geplant/.test(rail.next), 'Werte-Leiste auf', JSON.stringify(rail))
  rec(/Als Nächstes|Wetter|Einkauf|Hirn/.test(rail.hirn), 'Leiste-Felder', rail.hirn)
  await page.screenshot({ path: `${SHOTS}/18-18-werte-leiste.png` })
  await page.evaluate(() => {
    document.querySelector('.glance-rail-tab')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(200)

  await page.evaluate(() => {
    document.querySelector('.mini-chat-fab')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(300)
  rec(Boolean(await page.$('.mini-chat-panel')), 'Mini-Chat auf')
  await page.screenshot({ path: `${SHOTS}/18-18-mini-chat.png` })
  await page.evaluate(() => {
    document.querySelector('.mini-chat-actions .ghost-btn:last-child')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(200)

  await page.evaluate(() => {
    document.querySelector('.voice-shortcut .voice-sphere')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(500)
  const voice = await page.evaluate(() => ({
    compact: Boolean(document.querySelector('.voice-compact')),
    sheet: Boolean(document.querySelector('.voice-mode .voice-sheet')),
  }))
  rec(voice.compact && !voice.sheet, 'kompakte Sprach-Kugel', JSON.stringify(voice))
  await page.screenshot({ path: `${SHOTS}/18-18-sprach-kugel.png` })
  if (voice.compact) {
    await page.evaluate(() => {
      document.querySelector('.voice-compact-close')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await sleep(300)
  }

  await page.evaluate(() => {
    document.querySelector('[data-home-app="chat"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  const chat = await page.evaluate(() => ({
    home: Boolean(document.querySelector('.home-screen')),
    composer: Boolean(document.querySelector('.composer')),
    thumb: document.querySelector('.nav-dock .nav-island-item.is-on')?.getAttribute('data-nav') || '',
  }))
  rec(!chat.home && chat.composer && chat.thumb === 'chat', 'Kachel Chat öffnet Chat', JSON.stringify(chat))
  await page.screenshot({ path: `${SHOTS}/18-18-voller-chat.png` })

  await page.evaluate(() => {
    document.querySelector('[data-nav="home"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  rec(Boolean(await page.$('.home-screen')), 'Dock Start zurück')

  await page.evaluate(() => {
    document.querySelector('[data-home-app="calendar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  rec(Boolean(await page.$('.cal-view')), 'Kachel Kalender')
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.cal-toolbar-btn')].find((b) => /Zurück/.test(b.textContent || ''))
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  rec(Boolean(await page.$('.home-screen')), 'Kalender zu → Homescreen')

  await page.evaluate(() => {
    document.querySelector('[data-home-app="settings"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  rec(Boolean(await page.$('.settings-screen')), 'Kachel Einstellungen')
  await page.evaluate(() => {
    document.querySelector('.settings-close')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  rec(Boolean(await page.$('.home-screen')), 'Einstellungen zu → Homescreen')

  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false })
  await sleep(400)
  rec(Boolean(await page.$('.home-screen')), 'Desktop Homescreen')
  await page.screenshot({ path: `${SHOTS}/18-18-homescreen-desktop.png` })
} catch (e) {
  rec(false, 'crash', e instanceof Error ? e.message : String(e))
} finally {
  await browser.close()
}

if (fails.length) {
  console.error(`FAIL ${fails.join(', ')}`)
  process.exit(1)
}
console.log('ok gui-18.18-home')
