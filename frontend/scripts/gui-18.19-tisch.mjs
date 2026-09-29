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
        tischplatte_on: false,
      }),
    )
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app.has-nav-dock')
  await sleep(400)

  const off = await page.evaluate(() => {
    const raw = document.querySelector('.home-app-ico')
    const ico = raw instanceof HTMLElement ? raw : null
    const cs = ico ? getComputedStyle(ico) : null
    return {
      wall: document.querySelector('.home-screen')?.getAttribute('data-home-wall') || '',
      tisch: document.querySelector('.home-screen')?.classList.contains('is-tischplatte'),
      apps: document.querySelectorAll('[data-home-app]').length,
      hidden: document.querySelector('.home-grid')?.hasAttribute('hidden'),
      tint: ico?.style.getPropertyValue('--app-tint') || '',
      bg: cs?.backgroundImage || '',
    }
  })
  rec(off.wall === 'launcher' && !off.tisch, 'Wand A Launcher', JSON.stringify(off))
  rec(off.apps === 9 && !off.hidden, 'Icons sichtbar', JSON.stringify(off))
  rec(!off.tint, 'kein Candy-Tint', off.tint)
  await page.screenshot({ path: `${SHOTS}/18-19-launcher.png` })

  await page.evaluate(() => {
    document.querySelector('.glance-rail-tab')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(300)
  await page.evaluate(() => {
    document.querySelector('[data-tischplatte="on"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(500)

  const on = await page.evaluate(() => {
    const grid = document.querySelector('.home-grid')
    return {
      wall: document.querySelector('.home-screen')?.getAttribute('data-home-wall') || '',
      tisch: document.querySelector('.home-screen')?.classList.contains('is-tischplatte'),
      hidden: grid?.hasAttribute('hidden'),
      inert: grid?.hasAttribute('inert'),
      aria: grid?.getAttribute('aria-hidden'),
      bench: Boolean(document.querySelector('.workbench')),
      face: Boolean(document.querySelector('.workbench img, .workbench .face')),
      mini: Boolean(document.querySelector('.mini-chat')),
      sphere: Boolean(document.querySelector('.voice-shortcut .voice-sphere')),
    }
  })
  rec(on.wall === 'board' && on.tisch, 'Wand B Tischplatte', JSON.stringify(on))
  rec(on.hidden && on.inert && on.aria === 'true', 'Icons hart aus', JSON.stringify(on))
  rec(on.bench && !on.face, 'Werkbank ohne Gesicht', JSON.stringify(on))
  rec(on.mini && on.sphere, 'Mini-Chat und Kugel bleiben', JSON.stringify(on))
  await page.screenshot({ path: `${SHOTS}/18-19-tischplatte.png` })

  await page.evaluate(() => {
    document.querySelector('[data-tischplatte="off"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(500)
  const back = await page.evaluate(() => ({
    wall: document.querySelector('.home-screen')?.getAttribute('data-home-wall') || '',
    hidden: document.querySelector('.home-grid')?.hasAttribute('hidden'),
    apps: document.querySelectorAll('[data-home-app]').length,
  }))
  rec(back.wall === 'launcher' && !back.hidden && back.apps === 9, 'Zurück auf A mit Icons', JSON.stringify(back))
  await page.screenshot({ path: `${SHOTS}/18-19-launcher-back.png` })
} catch (err) {
  rec(false, 'crash', String(err))
} finally {
  await browser.close()
}

if (fails.length) {
  console.error(`gui-18.19 fail: ${fails.join(', ')}`)
  process.exit(1)
}
console.log('ok gui-18.19-tisch')
