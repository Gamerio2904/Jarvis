// @ts-nocheck
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5173/'
const CHROME = process.env.CHROME || '/usr/local/bin/google-chrome'
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts/screenshots'
mkdirSync(SHOTS, { recursive: true })

function sleep(ms) {
  return new Promise((r) => resolveSleep(r, ms))
}
function resolveSleep(r, ms) {
  setTimeout(r, ms)
}

const fails = []
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
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

async function tapNav(id) {
  await page.evaluate((nav) => {
    document.querySelector(`[data-nav="${nav}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }, id)
  await sleep(400)
}

async function send(text) {
  if (!(await page.$('textarea[placeholder="Nachricht an Jarvis…"]'))) {
    await tapNav('chat')
    await sleep(300)
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
  await box.type(text, { delay: 0 })
  await page.click('button[aria-label="Senden"]')
  await sleep(400)
  await page.waitForFunction(() => !document.querySelector('.composer.is-busy'), { timeout: 20_000 }).catch(() => {})
  await sleep(400)
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
        body_with_chat: true,
        themealdb_api_key: '',
      }),
    )
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app')
  await tapNav('chat')

  await send('Was kann ich aus dem Foto kochen')
  const cook = await lastReply()
  rec(/Foto-Knopf|Gemini|Kein Bild/i.test(cook), 'Koch ohne Foto ehrlich', cook.slice(0, 80))
  rec(!/Zubereitung|Carbonara|leckeres Gericht/i.test(cook), 'Kein Rezept ohne Ja/Bild')

  await send('Merke dir meine Gewürze: Salz, Pfeffer, black pepper')
  const pin = await lastReply()
  rec(/Liegt:/.test(pin) && /Pfeffer/.test(pin) && /Salz/.test(pin), 'Gewürz-Pin merkt', pin.slice(0, 80))
  rec(!/black pepper/i.test(pin), 'Alias nicht doppelt')

  await send('Welche Gewürze habe ich?')
  const recall = await lastReply()
  rec(/Pfeffer/.test(recall) && /Salz/.test(recall), 'Recall dieselbe Liste', recall.slice(0, 80))

  await page.evaluate(async () => {
    const cid = await new Promise((resolve, reject) => {
      const req = indexedDB.open('jarvis-ondevice', 9)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('conversations', 'readonly')
        const r = tx.objectStore('conversations').getAll()
        r.onsuccess = () => {
          const rows = (r.result || []).sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
          resolve(rows[0]?.id || '')
        }
        r.onerror = () => reject(r.error)
      }
      req.onerror = () => reject(req.error)
    })
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('jarvis-ondevice', 9)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('messages', 'readwrite')
        tx.objectStore('messages').put({
          id: 'gui-src-18-11',
          conversation_id: cid,
          role: 'assistant',
          content: 'Carbonara-Suche. Ich rate keine Rezepte.',
          created_at: new Date().toISOString(),
          meta: {
            research: {
              query: 'Carbonara',
              status: 'ok',
              sources: [
                {
                  title: 'Wikibooks Carbonara',
                  url: 'https://de.wikibooks.org/wiki/Kochbuch/_Spaghetti_alla_carbonara',
                  snippet: 'Zutaten und Schritte',
                  provider: 'wiki',
                },
                {
                  title: 'Beispiel JSON-LD',
                  url: 'https://example.test/recipe',
                  snippet: 'PT15M',
                  provider: 'web',
                },
              ],
            },
          },
        })
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  })

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.app')
  await tapNav('chat')
  await sleep(500)
  const chatOpen = await page.evaluate(() => {
    const item = document.querySelector('.chat-item')
    if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    return Boolean(item)
  })
  rec(chatOpen || Boolean(await page.$('.sources-block')), 'Chat mit Quellen offen')
  await sleep(600)

  const closed = await page.evaluate(() => {
    const d = document.querySelector('details.sources-block')
    if (!d) return { ok: false, reason: 'kein details' }
    const badge = d.querySelector('.sources-badge')?.textContent?.trim() || ''
    const list = d.querySelector('.sources-list')
    const listVisible = Boolean(list && (list.offsetParent !== null || getComputedStyle(list).display !== 'none') && d.open)
    return {
      ok: !d.open && /2 Quellen/.test(badge),
      open: d.open,
      badge,
      listVisible,
    }
  })
  rec(closed.ok, 'Quellen zu, Badge zählt', JSON.stringify(closed))

  await page.evaluate(() => {
    const sum = document.querySelector('details.sources-block summary')
    sum?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(300)
  const opened = await page.evaluate(() => {
    const d = document.querySelector('details.sources-block')
    const links = [...d?.querySelectorAll('.sources-list a') || []].map((a) => a.textContent?.trim())
    return { open: Boolean(d?.open), links }
  })
  rec(opened.open && opened.links.length === 2, 'Aufklappen zeigt Links', JSON.stringify(opened))

  await page.screenshot({ path: `${SHOTS}/18-11-quellen-offen.png` })
  await page.evaluate(() => {
    const sum = document.querySelector('details.sources-block summary')
    sum?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(250)
  await page.screenshot({ path: `${SHOTS}/18-11-quellen-zu.png` })

  await tapNav('settings')
  await sleep(500)
  await page.evaluate(() => {
    document.querySelector('[data-nav="keys"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(400)
  const meal = await page.evaluate(() => /TheMealDB/.test(document.body.innerText))
  rec(meal, 'Einstellungen nennen TheMealDB')

  rec(pageErrors.length === 0, 'keine Page-Errors', pageErrors.slice(0, 2).join(' | '))
} catch (err) {
  rec(false, 'gui-cook crash', err instanceof Error ? err.message : String(err))
} finally {
  await browser.close()
}

if (fails.length) {
  console.error(`gui-cook FAIL ${fails.length}: ${fails.join(', ')}`)
  process.exit(1)
}
console.log('gui-cook ok')
