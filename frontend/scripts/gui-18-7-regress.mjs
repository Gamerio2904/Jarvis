// @ts-nocheck
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5174/'
const CHROME = process.env.CHROME || '/usr/local/bin/google-chrome'
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts/screenshots'
mkdirSync(SHOTS, { recursive: true })

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function rec(ok, name, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) fails.push(name)
}

const fails = []
const pageErrors = []

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 45_000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=430,900'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})
const page = await browser.newPage()
page.setDefaultTimeout(20_000)
page.on('pageerror', (e) => pageErrors.push(e instanceof Error ? e.message : String(e)))
page.on('dialog', (d) => d.dismiss())

async function tapNav(id) {
  await page.evaluate((nav) => {
    document.querySelector(`[data-nav="${nav}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }, id)
  await sleep(450)
}

async function send(text) {
  await page.waitForSelector('textarea[placeholder="Nachricht an Jarvis…"]')
  await page.evaluate(() => {
    const t = document.querySelector('textarea[placeholder="Nachricht an Jarvis…"]')
    if (t instanceof HTMLTextAreaElement) {
      t.focus()
      t.value = ''
    }
  })
  const box = await page.$('textarea[placeholder="Nachricht an Jarvis…"]')
  if (!box) throw new Error('kein Composer')
  await box.type(text, { delay: 0 })
  await page.click('button[aria-label="Senden"]')
  await sleep(400)
  await page.waitForFunction(() => !document.querySelector('.composer.is-busy'), { timeout: 20_000 }).catch(() => {})
  await sleep(500)
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

  const labels = await page.$$eval('.nav-dock .nav-island-label', (els) => els.map((e) => (e.textContent || '').trim()))
  rec(labels.join(' ') === 'Chat Lage Hören Kalender Filme Mehr', 'Dock sechs Labels', labels.join('|'))

  const overflow = await page.evaluate(() => {
    return [...document.querySelectorAll('.nav-dock .nav-island-label')].map((el) => ({
      t: (el.textContent || '').trim(),
      overflow: el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2,
    }))
  })
  rec(
    overflow.every((r) => !r.overflow),
    'Labels nicht aus der Insel',
    overflow
      .filter((r) => r.overflow)
      .map((r) => r.t)
      .join(','),
  )

  await tapNav('lage')
  const lage = await page.evaluate(() => ({
    app: document.querySelector('.app')?.classList.contains('is-lage'),
    globe: Boolean(document.querySelector('.globe-view, .lage, [class*="lage-"]')),
    body: (document.body.innerText || '').slice(0, 200),
  }))
  rec(lage.app || lage.globe, 'Lage-Dock öffnet Lage', lage.body)
  await page.screenshot({ path: `${SHOTS}/18-7-regress-lage.png` })

  await tapNav('calendar')
  rec(Boolean(await page.$('.cal-view, .calendar, [class*="cal-"]')), 'Kalender-Dock öffnet Kalender')
  await page.screenshot({ path: `${SHOTS}/18-7-regress-kalender.png` })

  await tapNav('settings')
  rec(Boolean(await page.$('.settings-screen')), 'Mehr öffnet Einstellungen')
  await page.screenshot({ path: `${SHOTS}/18-7-regress-mehr.png` })

  await tapNav('chat')
  rec(!(await page.$('.settings-screen')), 'Chat räumt Einstellungen')
  rec(!(await page.$('.cal-view')), 'Chat räumt Kalender')

  await tapNav('watchlist')
  rec(Boolean(await page.$('.watch-overlay')), 'Filme öffnet Watchliste')
  rec(!(await page.$('.drive-overlay, .carplay')), 'Filme nicht Fahrmodus')
  await tapNav('chat')
  rec(!(await page.$('.watch-overlay')), 'Chat schließt Watchliste')

  await send('Timer 8 Minuten Nudeln')
  const timer = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' '))
  rec(/Timer|Minuten|Soll ich|Nudeln/i.test(timer), 'Timer-Satz kommt an', timer.slice(-180))

  await send('Milch auf die Einkaufsliste')
  const shop = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' '))
  rec(/Milch|Liste|Einkauf/i.test(shop), 'Einkaufsliste weiter da', shop.slice(-180))

  await send('Wetter heute')
  const wetter = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' '))
  rec(/Wetter|Grad|Open-Meteo|Regen|Sonne|Wolken|Luft/i.test(wetter), 'Wetter bleibt Wetter', wetter.slice(-180))

  await send('Fernseher an')
  const tv = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' '))
  rec(/Fernseher|TV|Gerät|koppeln|nicht/i.test(tv), 'Fernseher bleibt TV', tv.slice(-180))

  await send('Öffne Lieblinge')
  rec(Boolean(await page.$('.watch-overlay')), 'Öffne Lieblinge öffnet Folie')
  const favOn = await page.evaluate(() => {
    const tab = document.querySelector('.watch-tab.is-on, [aria-selected="true"]')
    return (tab?.textContent || '').trim()
  })
  rec(/Lieblinge/i.test(favOn), 'Lieblinge-Tab aktiv', favOn)
  rec(!(await page.$('.drive-overlay, .carplay')), 'Lieblinge nicht Fahrmodus')
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Fertig')
    btn?.click()
  })
  await sleep(400)
  rec(!(await page.$('.watch-overlay')), 'Fertig nach Lieblinge')

  await send('Öffne Watchliste')
  rec(Boolean(await page.$('.watch-overlay')), 'Befehl Watchliste öffnet Folie')
  rec(!(await page.$('.drive-overlay, .carplay')), 'Watchliste-Befehl nicht Drive')

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Fertig')
    btn?.click()
  })
  await sleep(400)
  rec(!(await page.$('.watch-overlay')), 'Fertig schließt Folie')

  await send('Einstellungen zu')
  rec(!(await page.$('.watch-overlay')), 'Einstellungen zu ohne Folie bleibt ruhig')

  await send('Research an')
  const research = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' '))
  rec(/Soll ich/i.test(research), 'Research an fragt nach', research.slice(-160))

  await send('Mach WLAN aus')
  const wlan = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' '))
  rec(!/habe ich (gemacht|ausgeschaltet)/i.test(wlan), 'WLAN keine Fake-Ausführung', wlan.slice(-160))
  rec(
    /WLAN-Einstellungen|Schalter lege ich nicht|nicht selbst|nur auf dem Handy|nicht geöffnet/i.test(wlan),
    'WLAN bleibt Gerät statt Modell',
    wlan.slice(-160),
  )

  await send('Zeig Erdbeben')
  await sleep(400)
  const quake = await page.evaluate(() => ({
    lage: document.querySelector('.app')?.classList.contains('is-lage'),
    globe: Boolean(document.querySelector('.globe-view')),
    text: (document.body.innerText || '').replace(/\s+/g, ' ').slice(-200),
  }))
  rec(quake.lage || quake.globe || /Erdbeben|Kugel|Lage/i.test(quake.text), 'Zeig Erdbeben bleibt Lage', quake.text)
  await page.screenshot({ path: `${SHOTS}/18-7-regress-erdbeben.png` })

  rec(pageErrors.length === 0, 'keine pageerror', pageErrors.join(' | '))
} catch (err) {
  rec(false, 'probe', err instanceof Error ? err.message : String(err))
  await page.screenshot({ path: `${SHOTS}/18-7-regress-fail.png` }).catch(() => {})
} finally {
  await browser.close()
}

if (fails.length) {
  console.error(`${fails.length} fehlgeschlagen`)
  process.exit(1)
}
console.log('OK gui-18-7-regress')
