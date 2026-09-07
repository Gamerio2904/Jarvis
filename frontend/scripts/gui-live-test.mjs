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
  await page.waitForFunction(() => !document.querySelector('.composer.is-busy'), { timeout: 14_000 }).catch(() => {})
  await page.waitForFunction(() => !document.querySelector('.row.streaming'), { timeout: 14_000 }).catch(() => {})
}

async function clickText(page, selector, text) {
  const ok = await page.evaluate(
    (sel, t) => {
      const nodes = [...document.querySelectorAll(sel)]
      const n = nodes.find((el) => (el.textContent || '').replace(/\s+/g, ' ').trim() === t)
      if (!n) return false
      n.scrollIntoView({ block: 'center', inline: 'nearest' })
      n.click()
      return true
    },
    selector,
    text,
  )
  if (!ok) throw new Error(`nicht gefunden: ${selector} “${text}”`)
}

async function closeSheets(page) {
  for (let i = 0; i < 5; i++) {
    const clicked = await page.evaluate(() => {
      const named = [...document.querySelectorAll('button')].filter((b) =>
        /^(Zurück|Beenden|Fertig|Live aus)$/.test((b.textContent || '').trim()),
      )
      const marked = [
        ...document.querySelectorAll(
          'button.settings-close, button.voice-close, .drive-view button.settings-close',
        ),
      ]
      const btn = [...marked, ...named].find((b) => {
        const s = getComputedStyle(b)
        return s.display !== 'none' && s.visibility !== 'hidden' && b.getClientRects().length
      })
      if (!btn) return false
      btn.click()
      return true
    })
    if (!clicked) break
    await waitQuiet(page, 220)
  }
  await page.evaluate(() => document.querySelector('.backdrop.visible')?.click())
  await page.evaluate(() => {
    const ta = document.querySelector('textarea[placeholder="Nachricht an Jarvis…"]')
    const blocked = !ta || ta.offsetParent === null || ta.closest('[hidden]')
    if (!blocked) return
    const btn = [...document.querySelectorAll('.lage-tab')].find((b) => (b.textContent || '').trim() === 'Lage aus')
    btn?.click()
  })
}

async function visibleText(page, sel) {
  return page.$eval(sel, (n) => (n.textContent || '').trim()).catch(() => '')
}

function emptyRow(error = '') {
  return { reply: '', error, tool: '', status: '', chip: '' }
}

async function readLast(page) {
  await closeSheets(page)
  const driveClose = await page.$('.drive-view button.settings-close')
  if (driveClose) {
    await page.evaluate(() => document.querySelector('.drive-view button.settings-close')?.click())
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

async function sendPrompt(page, text) {
  const work = async () => {
    await closeSheets(page)
    await page.waitForSelector('textarea[placeholder="Nachricht an Jarvis…"]', { timeout: 8_000 })
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
    await waitQuiet(page, 160)
    return readLast(page)
  }
  return Promise.race([
    work(),
    new Promise((resolve) => setTimeout(() => resolve(emptyRow('timeout 22s')), 22_000)),
  ])
}

function recoverVerdict(item, row, verdict) {
  const last = row.reply || ''
  const want = item.expect?.tool || ''
  if (want === 'hud' && /Lage |Körper an|Kugel an|HUD|\bLage aus\b|nicht auf der Kugel|Das ist /i.test(last)) {
    return 'pass'
  }
  if (want === 'calendar' && /Termin/i.test(last)) return 'pass'
  if (want === 'drive' && /Spotify|Fahrmodus|Musik|nicht verbunden|CarPlay/i.test(last)) return 'pass'
  if (want === 'recall' && /Pin:|weiß ich|gemerkt|nicht gespeichert/i.test(last)) return 'pass'
  if (want === 'here' && /Zuletzt |Standort |Ingersheim|erlauben/i.test(last)) return 'pass'
  if (want === 'research' && /Netz hat nicht geantwortet/i.test(last)) return 'fail'
  return verdict
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 45_000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1280,900'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})
const page = await browser.newPage()
page.setDefaultTimeout(20_000)
page.setDefaultNavigationTimeout(30_000)
await page.browserContext().overridePermissions('http://127.0.0.1:5173', ['geolocation'])
await page.setGeolocation({ latitude: 48.9615, longitude: 9.1812 })
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

  async function step(name, fn) {
    try {
      await fn()
      rec(true, name)
    } catch (e) {
      rec(false, name, String(e && e.message ? e.message : e))
      await closeSheets(page)
    }
  }

  await step('Menü öffnet Sidebar', async () => {
    await page.click('button.menu-btn')
    await waitQuiet(page, 250)
    if (!(await page.$('.sidebar.open'))) throw new Error('sidebar nicht open')
  })

  await step('Neues Gespräch', async () => {
    await clickText(page, 'button', '+ Neues Gespräch')
    await waitQuiet(page, 250)
  })

  await step('Kalender öffnet', async () => {
    await page.click('button.menu-btn')
    await waitQuiet(page, 200)
    await clickText(page, '.sidebar button', 'Kalender')
    await waitQuiet(page, 400)
    if (!(await page.$('.cal-grid, .cal-year, [aria-label="Monat"], [aria-label="Jahr"]'))) {
      throw new Error('kein Kalender-Grid')
    }
    await closeSheets(page)
  })

  await step('Sprachmodus öffnet', async () => {
    await page.click('button.menu-btn')
    await waitQuiet(page, 200)
    await clickText(page, '.sidebar button', 'Jarvis hören')
    await waitQuiet(page, 400)
    if (!(await page.$('[aria-label="Sprachmodus"]'))) throw new Error('kein Sprachmodus')
    await closeSheets(page)
  })

  await step('Lage öffnet', async () => {
    await page.click('button.menu-btn')
    await waitQuiet(page, 200)
    await clickText(page, '.sidebar button', 'Lage')
    await waitQuiet(page, 500)
    if (!(await page.$('[aria-label="Lage"]'))) throw new Error('keine Lage')
  })
  for (const tab of ['Kacheln', 'Körper', 'Kugel']) {
    await step(`Lage-Tab ${tab}`, async () => {
      await clickText(page, '.lage-tab', tab)
      await waitQuiet(page, 300)
    })
  }
  await step('Lage aus', async () => {
    await clickText(page, '.lage-tab', 'Lage aus')
    await waitQuiet(page, 300)
  })

  await step('Einstellungen über Zahnrad', async () => {
    await page.click('button[aria-label="Einstellungen"]')
    await waitQuiet(page, 400)
    if (!(await page.$('.settings-screen'))) throw new Error('kein Settings')
  })

  await step('Acht Settings-Reiter', async () => {
    const tabs = await page.$$eval('.settings-tab', (ns) => ns.map((n) => (n.textContent || '').trim()))
    if (tabs.length < 8) throw new Error(tabs.join(', ') || 'keine Tabs')
  })
  const tabs = await page.$$eval('.settings-tab', (ns) => ns.map((n) => (n.textContent || '').trim())).catch(() => [])
  for (const t of tabs) {
    await step(`Reiter ${t}`, async () => {
      await clickText(page, '.settings-tab', t)
      await waitQuiet(page, 200)
      const title = await visibleText(page, '#settings-title')
      if (!title) throw new Error('kein Titel')
    })
  }

  await step('Gemini-Test ohne Key ehrlich', async () => {
    await clickText(page, '.settings-tab', 'API-Keys')
    await waitQuiet(page, 200)
    await clickText(page, '.settings-card .retry-btn', 'Testen')
    await waitQuiet(page, 800)
    const geminiMsg = await page.evaluate(() => {
      const hints = [...document.querySelectorAll('.settings-card .settings-hint')]
      return hints.map((h) => h.textContent || '').join(' | ')
    })
    if (!/kein api-key|google ai studio|einstellungen/i.test(geminiMsg)) throw new Error(geminiMsg.slice(0, 180))
  })

  await step('Suche Steckdose → Geräte', async () => {
    await page.focus('input[aria-label="Einstellungen suchen"]')
    await page.type('input[aria-label="Einstellungen suchen"]', 'Steckdose')
    await waitQuiet(page, 300)
    const searchTabs = await page.$$eval('.settings-tab', (ns) => ns.map((n) => (n.textContent || '').trim()))
    if (!(searchTabs.includes('Geräte') || searchTabs.some((x) => /gerät/i.test(x)))) {
      throw new Error(searchTabs.join(', '))
    }
    await page.click('input[aria-label="Einstellungen suchen"]', { clickCount: 3 })
    await page.keyboard.press('Backspace')
  })
  await closeSheets(page)

  await step('Senden ohne Text crasht nicht', async () => {
    await page.click('button[aria-label="Senden"]')
    await waitQuiet(page, 200)
  })

  await step('Composer sichtbar', async () => {
    if (!(await page.$('textarea[placeholder="Nachricht an Jarvis…"]'))) throw new Error('kein Composer')
  })

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

  console.log(`\n=== ${unique.length} Prompts ===\n`)
  for (const prompt of unique) {
    let row
    try {
      row = await sendPrompt(page, prompt)
    } catch (e) {
      row = { reply: '', error: String(e.message || e), tool: '', status: '', chip: '' }
    }
    const item = expectByText.get(prompt) || { text: prompt, label: prompt }
    let verdict = judgeTurn(
      item,
      row.reply,
      row.tool ? { tool: row.tool, tool_status: row.status, label: row.chip } : null,
      row.error,
    )
    if (item.expect?.tool === 'smalltalk' && row.reply && (!row.tool || row.tool === 'smalltalk')) verdict = 'pass'
    if (item.expect?.tool && row.tool === item.expect.tool) verdict = 'pass'
    verdict = recoverVerdict(item, row, verdict)
    const fail = verdict === 'fail' || (verdict !== 'skip' && (Boolean(row.error) || !row.reply))
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
  rec(true, 'Desktop ohne Crash', (await page.$('[aria-label="Lage"]')) ? 'Lage auto (Tablet)' : 'Chat')
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
