/**
 * Sichtprüfung am Dev-Server: Figurenfarben am Brett, Zoom im Körper.
 * `HAUS=<pfad-zur-hausstand.json>` spielt einen echten Hausstand ein; ohne
 * ihn läuft alles mit leeren Einstellungen. Werte werden nie geloggt.
 */
import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5173/'
const CHROME = process.env.CHROME || '/usr/local/bin/google-chrome'
const HAUS = process.env.HAUS || ''
const SHOTS = process.env.SHOTS || '/tmp/shots'
mkdirSync(SHOTS, { recursive: true })
const out = []
function rec(ok, name, detail = '') {
  out.push({ ok, name, detail })
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const haus = HAUS && existsSync(HAUS) ? JSON.parse(readFileSync(HAUS, 'utf8')) : {}
const settings = haus.settings || haus.data?.settings || haus
console.log('Hausstand Schlüssel:', Object.keys(settings).length)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 45_000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})
const page = await browser.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error') pageErrors.push(`console: ${m.text()}`)
})
page.on('dialog', (d) => d.dismiss())

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app')
  await page.evaluate((s) => {
    localStorage.setItem(
      'jarvis_settings_v13',
      JSON.stringify({ ...s, setup_dismissed: true, hud_force: false, hud_hidden: true }),
    )
  }, settings)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app')
  rec(!(await page.$('.setup-overlay')), 'Hausstand geladen, kein Setup-Overlay')

  async function closeChess() {
    if (!(await page.$('.chess-mode'))) return
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('.chess-mode button')].find((n) => n.textContent.trim() === 'Fertig')
      b?.click()
    })
    await new Promise((r) => setTimeout(r, 300))
  }

  async function send(text) {
    await closeChess()
    await page.waitForSelector('textarea[placeholder="Nachricht an Jarvis…"]')
    await page.focus('textarea[placeholder="Nachricht an Jarvis…"]')
    await page.type('textarea[placeholder="Nachricht an Jarvis…"]', text, { delay: 0 })
    await page.click('button[aria-label="Senden"]')
    await new Promise((r) => setTimeout(r, 500))
    await page.waitForFunction(() => !document.querySelector('.composer.is-busy'), { timeout: 30_000 }).catch(() => {})
    return page.evaluate(() => {
      const rows = [...document.querySelectorAll('.row.assistant .bubble-text')]
      return rows[rows.length - 1]?.textContent?.trim() || ''
    })
  }

  const neu = await send('Schach neu')
  rec(/Weiß/.test(neu) && /Schwarz/.test(neu), 'Schach neu', neu.slice(0, 90))
  rec(Boolean(await page.$('.chess-mode')), 'Schach neu öffnet den Modus')
  const zug = await send('Bauer e2 e4')
  rec(/Ich spiele/.test(zug), 'Jarvis antwortet mit Zug', zug.slice(0, 90))
  const fen = await page.evaluate(() => localStorage.getItem('jarvis_chess_fen') || '')
  rec(fen.split(' ')[1] === 'w', 'nach Jarvis-Zug ist Weiß dran', fen)
  await closeChess()

  // Farben am Mini-Brett: Weiß muss hell sein, Schwarz dunkel — auf jedem Feld.
  const colors = await page.evaluate(() => {
    const board = [...document.querySelectorAll('.chat-chess .chess-board')].pop()
    if (!board) return null
    const cells = [...board.querySelectorAll('.chess-sq')]
    const lum = (c) => {
      const [r, g, b] = (c.match(/\d+/g) || ['0', '0', '0']).map(Number)
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const rows = cells
      .filter((c) => (c.textContent || '').trim())
      .map((c) => ({
        sq: c.getAttribute('aria-label') || '',
        cls: c.className,
        glyph: (c.textContent || '').trim(),
        lum: Math.round(lum(getComputedStyle(c).color)),
        stroke: getComputedStyle(c).textShadow,
      }))
    return rows
  })
  const whites = (colors || []).filter((c) => / w( |$)/.test(` ${c.cls} `))
  const blacks = (colors || []).filter((c) => / b( |$)/.test(` ${c.cls} `))
  rec(whites.length === 16 && blacks.length === 16, 'Brett hat 16 weiße und 16 schwarze Figuren', `${whites.length}/${blacks.length}`)
  const darkWhites = whites.filter((c) => c.lum < 150)
  const lightBlacks = blacks.filter((c) => c.lum > 90)
  rec(darkWhites.length === 0, 'keine weiße Figur dunkel gefärbt', darkWhites.map((c) => `${c.sq}:${c.lum}`).join(' '))
  rec(lightBlacks.length === 0, 'keine schwarze Figur hell gefärbt', lightBlacks.map((c) => `${c.sq}:${c.lum}`).join(' '))
  rec(
    whites.every((c) => /rgb/.test(c.stroke)) && blacks.every((c) => /rgb/.test(c.stroke)),
    'jede Figur hat eine Kontur',
    (whites[0]?.stroke || '').slice(0, 40),
  )

  // Mini-Brett öffnet den Modus
  await page.evaluate(() => document.querySelector('.chat-chess')?.click())
  await new Promise((r) => setTimeout(r, 400))
  rec(Boolean(await page.$('.chess-mode')), 'Mini-Brett öffnet Schachmodus')
  await page.screenshot({ path: `${SHOTS}/schach-modus.png` })
  const modeColors = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.chess-mode .chess-sq')].filter((c) => (c.textContent || '').trim())
    const lum = (c) => {
      const [r, g, b] = (c.match(/\d+/g) || ['0', '0', '0']).map(Number)
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    return cells.map((c) => ({ cls: c.className, lum: Math.round(lum(getComputedStyle(c).color)) }))
  })
  const badMode = modeColors.filter((c) => (/ w( |$)/.test(` ${c.cls} `) ? c.lum < 150 : c.lum > 90))
  rec(badMode.length === 0, 'Overlay-Brett: Farben stimmen', String(badMode.length))

  // Ein Zug im Overlay: weißen Bauern antippen, Ziel antippen
  const moved = await page.evaluate(async () => {
    const pick = (sq) => document.querySelector(`.chess-mode .chess-sq[aria-label="${sq}"]`)
    pick('d2')?.click()
    await new Promise((r) => setTimeout(r, 120))
    const lit = [...document.querySelectorAll('.chess-mode .chess-sq.is-tgt')].map((n) => n.getAttribute('aria-label'))
    pick('d4')?.click()
    return lit
  })
  rec(moved.includes('d4'), 'erlaubte Felder leuchten', moved.join(','))
  await new Promise((r) => setTimeout(r, 1200))
  const turn = await page.$eval('.chess-mode-bar p', (n) => n.textContent.trim()).catch(() => '')
  rec(/Weiß am Zug/.test(turn), 'nach Jarvis-Zug wieder Weiß', turn)
  await page.screenshot({ path: `${SHOTS}/schach-nach-zug.png` })
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Fertig')?.click())
  await new Promise((r) => setTimeout(r, 300))

  // Körper: Zoom
  await page.click('button.menu-btn')
  await new Promise((r) => setTimeout(r, 300))
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.sidebar button')].find((n) => n.textContent.trim() === 'Lage')
    b?.click()
  })
  await new Promise((r) => setTimeout(r, 600))
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.lage-tab')].find((n) => n.textContent.trim() === 'Körper')
    b?.click()
  })
  await new Promise((r) => setTimeout(r, 600))
  rec(Boolean(await page.$('.agent-map-shell')), 'Körper hat Zoom-Rahmen')
  rec(Boolean(await page.$('.agent-map-zoom')), 'Zoom-Leiste sichtbar')
  await page.screenshot({ path: `${SHOTS}/koerper-1x.png` })

  const zoomVal = () => page.$eval('.agent-map-zoom-val', (n) => n.textContent.trim())
  rec((await zoomVal()) === '1.0×', 'Start bei 1.0×', await zoomVal())
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => document.querySelector('[aria-label="Heranzoomen"]')?.click())
    await new Promise((r) => setTimeout(r, 200))
  }
  const after = await zoomVal()
  rec(Number.parseFloat(after) > 1.5, 'Plus zoomt heran', after)
  await page.screenshot({ path: `${SHOTS}/koerper-zoom.png` })

  // Rad-Zoom
  const box = await page.$eval('.agent-map-canvas', (n) => {
    const r = n.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })
  await page.mouse.move(box.x, box.y)
  await page.mouse.wheel({ deltaY: -400 })
  await new Promise((r) => setTimeout(r, 250))
  const afterWheel = await zoomVal()
  rec(Number.parseFloat(afterWheel) > Number.parseFloat(after), 'Rad zoomt weiter', `${after} → ${afterWheel}`)

  await page.evaluate(() => document.querySelector('[aria-label="Zoom zurücksetzen"]')?.click())
  await new Promise((r) => setTimeout(r, 250))
  rec((await zoomVal()) === '1.0×', 'Ganz setzt zurück', await zoomVal())

  // Zwei Finger: synthetische Zeiger, wie das Touchpad sie schickt.
  await page.evaluate(() => {
    const c = document.querySelector('.agent-map-canvas')
    const r = c.getBoundingClientRect()
    const mid = { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    const ev = (type, id, x, y) =>
      c.dispatchEvent(
        new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }),
      )
    ev('pointerdown', 11, mid.x - 30, mid.y)
    ev('pointerdown', 12, mid.x + 30, mid.y)
    for (let i = 1; i <= 6; i++) {
      ev('pointermove', 11, mid.x - 30 - i * 12, mid.y)
      ev('pointermove', 12, mid.x + 30 + i * 12, mid.y)
    }
    ev('pointerup', 11, mid.x - 102, mid.y)
    ev('pointerup', 12, mid.x + 102, mid.y)
  })
  await new Promise((r) => setTimeout(r, 300))
  const pinch = await zoomVal()
  rec(Number.parseFloat(pinch) > 1.4, 'zwei Finger zoomen', pinch)
  await page.evaluate(() => document.querySelector('[aria-label="Zoom zurücksetzen"]')?.click())
  await new Promise((r) => setTimeout(r, 200))

  // Einen Agentenpunkt suchen: Raster über die Fläche, bis eine Aufgabe steht.
  const rect = await page.$eval('.agent-map-canvas', (n) => {
    const r = n.getBoundingClientRect()
    return { left: r.x, top: r.y, w: r.width, h: r.height }
  })
  let picked = ''
  let spot = null
  for (let gy = 1; gy < 12 && !picked; gy++) {
    for (let gx = 1; gx < 12 && !picked; gx++) {
      const x = rect.left + (rect.w * gx) / 12
      const y = rect.top + (rect.h * gy) / 12
      await page.mouse.click(x, y)
      await new Promise((r) => setTimeout(r, 60))
      const task = await page.$eval('.lage-agent-task', (n) => n.textContent.trim()).catch(() => '')
      if (task) {
        picked = task
        spot = { x, y }
      }
    }
  }
  rec(Boolean(picked), 'Agent antippen zeigt Aufgabe', picked.slice(0, 60))
  if (spot) {
    await page.mouse.click(spot.x, spot.y)
    await new Promise((r) => setTimeout(r, 120))
    await page.mouse.click(spot.x, spot.y)
    await new Promise((r) => setTimeout(r, 300))
  }
  const afterTap = await zoomVal()
  rec(Number.parseFloat(afterTap) >= 2.4, 'Doppeltipp holt Agenten heran', afterTap)
  await page.screenshot({ path: `${SHOTS}/koerper-agent-zoom.png` })

  const agentBtn = await page.evaluate(() => {
    const b = document.querySelector('[aria-label="Auf gewählten Agenten zoomen"]')
    return b ? !b.disabled : false
  })
  rec(agentBtn, 'Agent-Knopf aktiv bei Auswahl')

  // Kugel-Pin schließen (Regression aus 18.0.5)
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.lage-tab')].find((n) => n.textContent.trim() === 'Kugel')
    b?.click()
  })
  await new Promise((r) => setTimeout(r, 800))
  rec(Boolean(await page.$('.globe-wrap, canvas[aria-label*="Erde"]')), 'Kugel zeichnet')
  await page.screenshot({ path: `${SHOTS}/kugel.png` })
} catch (err) {
  rec(false, 'Suite abgebrochen', String(err?.message || err))
  console.error(err)
} finally {
  const fails = out.filter((o) => !o.ok)
  writeFileSync('/tmp/gui-schach-koerper.json', JSON.stringify({ out, pageErrors }, null, 2))
  console.log(`\n${out.length - fails.length}/${out.length} ok · pageErrors ${pageErrors.length}`)
  for (const e of pageErrors.slice(0, 10)) console.log('  [err]', e.slice(0, 160))
  await browser.close()
  if (fails.length) process.exitCode = 1
}
