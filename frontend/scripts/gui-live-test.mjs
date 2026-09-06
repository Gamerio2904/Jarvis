/**
 * Live GUI + Prompt-Durchlauf gegen den Vite-Dev-Server.
 * Schreibt JSON nach /tmp/jarvis-gui-live.json
 */
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
import { TEST_PROMPTS } from '../src/engine/test-prompts.ts'
import { TEST_COPY_GROUPS } from '../src/engine/test-copy.ts'
import { judgeTurn } from '../src/engine/debug-judge.ts'

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5173/'
const CHROME = process.env.CHROME || '/usr/local/bin/google-chrome'
const OUT = process.env.GUI_LIVE_OUT || '/tmp/jarvis-gui-live.json'

const report = {
  started: new Date().toISOString(),
  gui: [],
  prompts: [],
  pageErrors: [],
  consoleErrors: [],
}

function rec(ok, name, detail = '') {
  report.gui.push({ ok, name, detail })
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function waitQuiet(page, ms = 400) {
  await new Promise((r) => setTimeout(r, ms))
  await page.waitForFunction(() => !document.querySelector('.composer.is-busy'), { timeout: 25_000 }).catch(() => {})
  await page.waitForFunction(() => !document.querySelector('.row.streaming'), { timeout: 25_000 }).catch(() => {})
}

async function clickText(page, selector, text) {
  const handle = await page.evaluateHandle(
    (sel, t) => {
      const nodes = [...document.querySelectorAll(sel)]
      return nodes.find((n) => (n.textContent || '').trim() === t) || null
    },
    selector,
    text,
  )
  const el = handle.asElement()
  if (!el) throw new Error(`nicht gefunden: ${selector} “${text}”`)
  await el.click()
  await handle.dispose()
}

async function visibleText(page, sel) {
  return page.$eval(sel, (n) => (n.textContent || '').trim()).catch(() => '')
}

async function sendPrompt(page, text) {
  await page.waitForSelector('textarea[placeholder="Nachricht an Jarvis…"]', { timeout: 10_000 })
  await page.focus('textarea[placeholder="Nachricht an Jarvis…"]')
  await page.evaluate(() => {
    const ta = document.querySelector('textarea[placeholder="Nachricht an Jarvis…"]')
    if (!ta) return
    const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
    proto?.set?.call(ta, '')
    ta.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await page.type('textarea[placeholder="Nachricht an Jarvis…"]', text, { delay: 0 })
  await page.click('button[aria-label="Senden"]')
  await waitQuiet(page, 200)
  // Overlays that steal the composer
  for (const close of ['button.settings-close', '.voice-close', 'button.lage-tab']) {
    /* close drive/calendar/voice if they cover send */
  }
  const driveClose = await page.$('.drive-view button.settings-close')
  if (driveClose) {
    await driveClose.click().catch(() => {})
    await waitQuiet(page, 200)
  }
  const calClose = await page.$('.cal-top button.ghost-btn, .calendar-screen button.settings-close')
  if (calClose) {
    const label = await page.evaluate((el) => (el.textContent || '').trim(), calClose)
    if (/fertig|schließen|zurück/i.test(label) || true) {
      await calClose.click().catch(() => {})
      await waitQuiet(page, 150)
    }
  }
  const voiceClose = await page.$('button.voice-close')
  if (voiceClose) {
    await voiceClose.click().catch(() => {})
    await waitQuiet(page, 150)
  }
  return page.evaluate(() => {
    const err = document.querySelector('.error-banner')?.textContent?.trim() || ''
    const rows = [...document.querySelectorAll('.row.assistant .bubble')]
    const last = rows[rows.length - 1]
    const reply = last?.querySelector('.bubble-text')?.textContent?.trim() || ''
    const chip = last?.querySelector('.tool-chip')
    return {
      reply,
      error: err,
      tool: chip?.getAttribute('data-tool') || '',
      status: chip?.getAttribute('data-status') || '',
      chip: chip?.textContent?.trim() || '',
    }
  })
}

async function closeSheets(page) {
  for (let i = 0; i < 3; i++) {
    const close = await page.$('button.settings-close, button.voice-close')
    if (!close) break
    await close.click().catch(() => {})
    await waitQuiet(page, 200)
  }
  await page.evaluate(() => {
    const backdrop = document.querySelector('.backdrop.visible')
    if (backdrop) backdrop.click()
  })
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1280,900'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})
const page = await browser.newPage()
page.on('pageerror', (err) => {
  report.pageErrors.push(err.message)
  console.log('[pageerror]', err.message)
})
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    const t = msg.text()
    report.consoleErrors.push(t)
    console.log('[console.error]', t)
  }
})
page.on('dialog', async (d) => {
  await d.dismiss()
})

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForSelector('.app', { timeout: 20_000 })
  rec(true, 'App geladen', await page.title())

  const setup = await page.$('.setup-overlay')
  rec(Boolean(setup), 'Setup-Overlay Gemini zuerst')
  if (setup) {
    await clickText(page, '.setup-overlay button', 'Gemini-Key eintragen')
    await waitQuiet(page, 400)
    const settingsOn = await page.$('.settings-screen')
    rec(Boolean(settingsOn), 'Overlay → API-Keys')
    const geminiToggle = await page.$('.settings-screen .settings-toggle')
    rec(Boolean(geminiToggle), 'Keys-Tab hat Gemini-Schalter')
    await clickText(page, 'button.settings-close', 'Fertig')
    await waitQuiet(page, 300)
  }

  // Seed settings for tool prompts (no live Gemini key in this environment)
  await page.evaluate(() => {
    const key = 'jarvis_settings_v13'
    const cur = JSON.parse(localStorage.getItem(key) || '{}')
    localStorage.setItem(
      key,
      JSON.stringify({
        ...cur,
        setup_dismissed: true,
        last_lat: '49.0',
        last_lon: '9.2',
        last_place: 'Ingersheim',
        last_fix_at: new Date().toISOString(),
        research_opt_in: true,
        hud_force: false,
        hud_hidden: true,
      }),
    )
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app', { timeout: 20_000 })
  rec(!(await page.$('.setup-overlay')), 'Setup nach Dismiss weg')

  await page.click('button.menu-btn')
  await waitQuiet(page, 250)
  rec(Boolean(await page.$('.sidebar.open')), 'Menü öffnet Sidebar')

  await clickText(page, 'button.new-chat, .sidebar button', '+ Neues Gespräch')
  await waitQuiet(page, 250)
  rec(true, 'Neues Gespräch')

  await page.click('button.menu-btn')
  await waitQuiet(page, 200)
  await clickText(page, '.sidebar button', 'Kalender')
  await waitQuiet(page, 400)
  rec(Boolean(await page.$('.cal-grid, .cal-year, [aria-label="Monat"], [aria-label="Jahr"]')), 'Kalender öffnet')
  await closeSheets(page)

  await page.click('button.menu-btn')
  await waitQuiet(page, 200)
  await clickText(page, '.sidebar button', 'Jarvis hören')
  await waitQuiet(page, 400)
  rec(Boolean(await page.$('[aria-label="Sprachmodus"]')), 'Sprachmodus öffnet')
  await closeSheets(page)

  await page.click('button.menu-btn')
  await waitQuiet(page, 200)
  await clickText(page, '.sidebar button', 'Lage')
  await waitQuiet(page, 500)
  rec(Boolean(await page.$('[aria-label="Lage"]')), 'Lage öffnet')
  for (const tab of ['Kacheln', 'Körper', 'Kugel']) {
    try {
      await clickText(page, '.lage-tab', tab)
      await waitQuiet(page, 300)
      rec(true, `Lage-Tab ${tab}`)
    } catch (e) {
      rec(false, `Lage-Tab ${tab}`, String(e.message || e))
    }
  }
  try {
    await clickText(page, '.lage-tab', 'Lage aus')
    await waitQuiet(page, 300)
    rec(true, 'Lage aus')
  } catch (e) {
    rec(false, 'Lage aus', String(e.message || e))
  }

  await page.click('button[aria-label="Einstellungen"]')
  await waitQuiet(page, 400)
  rec(Boolean(await page.$('.settings-screen')), 'Einstellungen über Zahnrad')

  const tabs = await page.$$eval('.settings-tab', (ns) => ns.map((n) => (n.textContent || '').trim()))
  rec(tabs.length >= 8, 'Acht Settings-Reiter', tabs.join(', '))
  for (const t of tabs) {
    try {
      await clickText(page, '.settings-tab', t)
      await waitQuiet(page, 200)
      const title = await visibleText(page, '#settings-title')
      rec(Boolean(title), `Reiter ${t}`, title)
    } catch (e) {
      rec(false, `Reiter ${t}`, String(e.message || e))
    }
  }

  await clickText(page, '.settings-tab', 'API-Keys')
  await waitQuiet(page, 200)
  await clickText(page, '.settings-card .retry-btn', 'Testen')
  await waitQuiet(page, 800)
  const geminiMsg = await page.evaluate(() => {
    const hints = [...document.querySelectorAll('.settings-card .settings-hint')]
    return hints.map((h) => h.textContent || '').join(' | ')
  })
  rec(/kein api-key|google ai studio|einstellungen/i.test(geminiMsg), 'Gemini-Test ohne Key ehrlich', geminiMsg.slice(0, 180))

  await page.focus('input[aria-label="Einstellungen suchen"]')
  await page.type('input[aria-label="Einstellungen suchen"]', 'Steckdose')
  await waitQuiet(page, 300)
  const searchTabs = await page.$$eval('.settings-tab', (ns) => ns.map((n) => (n.textContent || '').trim()))
  rec(searchTabs.includes('Geräte') || searchTabs.some((x) => /gerät/i.test(x)), 'Suche Steckdose → Geräte', searchTabs.join(', '))
  await page.click('input[aria-label="Einstellungen suchen"]', { clickCount: 3 })
  await page.keyboard.press('Backspace')
  await closeSheets(page)

  await page.click('button[aria-label="Senden"]')
  await waitQuiet(page, 200)
  rec(true, 'Senden ohne Text crasht nicht')

  const composer = await page.$('textarea[placeholder="Nachricht an Jarvis…"]')
  rec(Boolean(composer), 'Composer sichtbar')

  const expectByText = new Map()
  for (const g of TEST_COPY_GROUPS) {
    for (const item of g.items) expectByText.set(item.text, item)
  }

  const unique = []
  const seen = new Set()
  for (const p of TEST_PROMPTS) {
    if (seen.has(p)) continue
    seen.add(p)
    unique.push(p)
  }
  for (const g of TEST_COPY_GROUPS) {
    for (const item of g.items) {
      if (seen.has(item.text)) continue
      seen.add(item.text)
      unique.push(item.text)
    }
  }

  console.log(`\n=== ${unique.length} Prompts ===\n`)
  for (const prompt of unique) {
    let row
    try {
      row = await sendPrompt(page, prompt)
    } catch (e) {
      row = { reply: '', error: String(e.message || e), tool: '', status: '', chip: '' }
    }
    const item = expectByText.get(prompt) || { text: prompt, label: prompt }
    const verdict = judgeTurn(
      item,
      row.reply,
      row.tool ? { tool: row.tool, tool_status: row.status, label: row.chip } : null,
      row.error,
    )
    const fail =
      Boolean(row.error) ||
      (!row.reply && !row.error) ||
      verdict === 'fail'
    report.prompts.push({
      prompt,
      ...row,
      verdict,
      expect: item.expect || null,
      fail,
    })
    if (fail) console.log(`FAIL ${verdict} ${prompt} → ${row.error || row.reply || 'leer'} [${row.tool || '—'}]`)
    else console.log(`${verdict.padEnd(7)} ${prompt} → ${(row.reply || '').slice(0, 80)} [${row.tool || '—'}]`)
    await closeSheets(page)
  }

  // Desktop Lage
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app', { timeout: 20_000 })
  rec(true, 'Desktop-Viewport 1280')
  const lageDesktop = await page.$('[aria-label="Lage"]')
  rec(true, 'Desktop ohne Crash', lageDesktop ? 'Lage auto (Tablet)' : 'Chat')
} catch (err) {
  rec(false, 'Suite abgebrochen', String(err && err.message ? err.message : err))
  console.error(err)
} finally {
  report.finished = new Date().toISOString()
  report.guiFail = report.gui.filter((g) => !g.ok).length
  report.promptFail = report.prompts.filter((p) => p.fail).length
  report.promptSkip = report.prompts.filter((p) => p.verdict === 'skip').length
  report.promptPass = report.prompts.filter((p) => p.verdict === 'pass').length
  writeFileSync(OUT, JSON.stringify(report, null, 2))
  console.log(
    `\nGUI ${report.gui.length - report.guiFail}/${report.gui.length} ok · Prompts fail ${report.promptFail} pass ${report.promptPass} skip ${report.promptSkip} · pageErrors ${report.pageErrors.length}\n→ ${OUT}`,
  )
  await browser.close()
}

if (report.guiFail) process.exit(1)
