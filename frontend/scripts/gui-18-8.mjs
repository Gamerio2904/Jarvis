// @ts-nocheck
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5173/'
const CHROME = process.env.CHROME || '/usr/local/bin/google-chrome'
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts/screenshots'
mkdirSync(SHOTS, { recursive: true })

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const fails = []
const pageErrors = []
function rec(ok, name, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) fails.push(name)
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
page.on('pageerror', (e) => pageErrors.push(e instanceof Error ? e.message : String(e)))
page.on('dialog', (d) => d.dismiss())

async function tapNav(id) {
  await page.evaluate((nav) => {
    document.querySelector(`[data-nav="${nav}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }, id)
  await sleep(450)
}

async function send(text) {
  if (!(await page.$('textarea[placeholder="Nachricht an Jarvis…"]'))) {
    await tapNav('chat')
    await sleep(350)
  }
  await page.waitForSelector('textarea[placeholder="Nachricht an Jarvis…"]')
  await page.evaluate(() => {
    const t = document.querySelector('textarea[placeholder="Nachricht an Jarvis…"]')
    if (t instanceof HTMLTextAreaElement) {
      t.focus()
      const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
      proto?.set?.call(t, '')
      t.dispatchEvent(new Event('input', { bubbles: true }))
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

async function lastReply() {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('.row.assistant .bubble-text')]
    return rows[rows.length - 1]?.textContent?.trim() || ''
  })
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

  await send('Termin morgen 15 Uhr Zahnarzt')
  const ask = await lastReply()
  rec(/Wann soll ich Sie erinnern/i.test(ask), 'Chat fragt nach Erinnerung', ask.slice(0, 120))
  rec(!/absagen/i.test(ask), 'Create ist keine Absage')

  await send('24 Stunden davor und 2 Stunden davor')
  const frist = await lastReply()
  rec(/1 Tag|24 Stunden/i.test(frist) && /2 Stunden/i.test(frist), 'Fristen bestätigt', frist.slice(0, 120))

  await send('Termin absagen')
  const gone = await lastReply()
  rec(/Termin weg|Kein Termin/i.test(gone), 'Termin absagen löscht', gone.slice(0, 120))
  rec(!/Wann soll ich/i.test(gone), 'Absage ohne Erinnerungsfrage')

  await tapNav('calendar')
  await page.waitForSelector('.cal-view, .cal-fab')
  rec(Boolean(await page.$('.cal-fab')), 'Kalender-FAB')
  await page.evaluate(() => {
    document.querySelector('.cal-fab')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  rec(Boolean(await page.$('.cal-sheet.is-open')), 'Termin-Sheet offen')
  await page.waitForSelector('.cal-form input[placeholder="Titel"]')
  await page.type('.cal-form input[placeholder="Titel"]', 'Teammeeting', { delay: 0 })
  await page.click('.cal-add-btn')
  await sleep(700)
  const chips = await page.$$eval('.cal-remind-chip', (els) => els.map((e) => (e.textContent || '').trim()))
  rec(chips.includes('24 h') && chips.includes('2 h') && chips.includes('keine'), 'Erinnerungs-Chips', chips.join(' | '))
  await page.screenshot({ path: `${SHOTS}/calendar_remind_chips_open.png` })
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.cal-remind-chip')]
    btns.find((b) => /2 h/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    btns.find((b) => /15 min/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(200)
  rec(Boolean(await page.$('.cal-add-btn')), 'Übernehmen nach Chips')
  await page.click('.cal-add-btn')
  await sleep(500)
  rec(!(await page.$('.cal-sheet.is-open')), 'Sheet nach Übernehmen zu')
  await page.screenshot({ path: `${SHOTS}/18-8-kalender-chips.png` })
  await tapNav('chat')

  await tapNav('settings')
  await page.waitForSelector('.settings-screen')
  await page.evaluate(() => {
    document.querySelector('[data-nav="tests"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(500)
  await page.waitForSelector('.probe-shelf')
  const lanes = await page.$$eval('.probe-lanes .probe-lane', (els) => els.map((e) => (e.textContent || '').trim()))
  rec(lanes.join(' ') === 'Heute Gespräch Alltag Gerät Lage Probe Story Lauf', 'acht Test-Spuren', lanes.join(' | '))
  const heute = await page.$$eval('.probe-groups .probe-lane', (els) => els.map((e) => (e.textContent || '').trim()))
  rec(heute.some((t) => /18\.8/.test(t)), 'Heute hat 18.8', heute.join(' | '))
  rec(!heute.some((t) => /^V\d/.test(t) || /8\.34|Kaputt/.test(t)), 'keine Versions-Titel in Heute')
  await page.screenshot({ path: `${SHOTS}/18-8-tests-heute.png` })

  await page.evaluate(() => {
    document.querySelector('.probe-lanes [data-nav="probe"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  const probeTitles = await page.$$eval('.copy-block-title', (els) => els.map((e) => (e.textContent || '').trim()))
  rec(probeTitles[0] === 'Memory-10', 'Probe beginnt mit Memory-10', probeTitles.slice(0, 3).join(' | '))
  rec(probeTitles.length === 13, `Probe hat 13 Packs (${probeTitles.length})`)
  rec(!probeTitles.some((t) => /^V\d/.test(t)), 'Probe ohne V1–V9')

  await page.click('.probe-search input')
  await page.type('.probe-search input', 'Zahnarzt', { delay: 0 })
  await sleep(300)
  const zahn = await page.$$eval('.copy-field input', (els) => els.map((e) => e.value))
  rec(zahn.some((t) => /Zahnarzt/i.test(t)), 'Suche Zahnarzt', String(zahn.length))
  await page.evaluate(() => {
    const input = document.querySelector('.probe-search input')
    if (input instanceof HTMLInputElement) {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
      proto?.set?.call(input, '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  await page.type('.probe-search input', 'Watchliste', { delay: 0 })
  await sleep(300)
  const watch = await page.$$eval('.copy-field input', (els) => els.map((e) => e.value))
  rec(watch.some((t) => /Watchliste/i.test(t)), 'Suche Watchliste', String(watch.length))
  await page.screenshot({ path: `${SHOTS}/18-8-suche-watchliste.png` })

  await page.evaluate(() => {
    const input = document.querySelector('.probe-search input')
    if (input instanceof HTMLInputElement) {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
      proto?.set?.call(input, '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  await sleep(200)
  await page.evaluate(() => {
    document.querySelector('.probe-lanes [data-nav="lauf"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  rec(Boolean(await page.$('.settings-card h3')), 'Spur Lauf zeigt Debug')
  const titles = await page.$$eval('.debug-box-row', (els) =>
    els.map((el) => el.textContent || '').join('\n'),
  )
  rec(!/^V\d/m.test(titles) && !/\bV2\b/.test(titles), 'Debug-Klickboxen ohne V2')
  rec(/18\.8 Debug/.test(titles), 'Klickbox 18.8 Debug & Termin')
  rec(/Memory-10/.test(titles), 'Klickbox Memory-10')

  rec(pageErrors.length === 0, 'keine pageerror', pageErrors.slice(0, 3).join(' | '))
} catch (e) {
  rec(false, 'crash', e instanceof Error ? e.message : String(e))
} finally {
  await browser.close().catch(() => {})
}

if (fails.length) {
  console.error(`gui-18-8 FAIL ${fails.length}: ${fails.join(', ')}`)
  process.exit(1)
}
console.log('OK gui-18-8')
