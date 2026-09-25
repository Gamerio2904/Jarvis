import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:5173/'
const CHROME = process.env.CHROME || '/usr/local/bin/google-chrome'
const SHOTS = process.env.SHOTS || '/opt/cursor/artifacts/screenshots'
mkdirSync(SHOTS, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  protocolTimeout: 45_000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=430,900'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})
const page = await browser.newPage()
page.setDefaultTimeout(20_000)

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.app')
await page.evaluate(() => {
  localStorage.setItem(
    'jarvis_settings_v13',
    JSON.stringify({ setup_dismissed: true, hud_force: false, hud_hidden: true, hud_view: 'tiles', body_with_chat: true }),
  )
})
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.composer')
await sleep(500)

const cam = await page.$('button[aria-label="Foto oder Datei"]')
if (!cam) throw new Error('Kamera-Knopf fehlt')
await cam.click()
await page.waitForSelector('.eye-pick')
await sleep(400)
await page.screenshot({ path: `${SHOTS}/eye_pick_kamera_oder_datei.png` })

const labels = await page.evaluate(() =>
  [...document.querySelectorAll('.eye-pick-btn')].map((n) => (n.textContent || '').replace(/\s+/g, ' ').trim()),
)
if (!labels.includes('Kamera') || !labels.includes('Datei')) {
  throw new Error(`Wahl fehlt: ${labels.join('|')}`)
}

const capture = await page.evaluate(() => {
  const camIn = document.querySelector('input[capture="environment"]')
  const fileIn = [...document.querySelectorAll('input[type="file"]')].find((el) => !el.getAttribute('capture'))
  return {
    camAccept: camIn?.getAttribute('accept') || '',
    fileAccept: fileIn?.getAttribute('accept') || '',
  }
})
if (capture.camAccept !== 'image/*') throw new Error(`Kamera-accept: ${capture.camAccept}`)
if (!capture.fileAccept.includes('pdf')) throw new Error(`Datei-accept: ${capture.fileAccept}`)

await page.click('.eye-pick-backdrop')
await sleep(300)
if (await page.$('.eye-pick')) throw new Error('Wahl blieb offen')
await page.screenshot({ path: `${SHOTS}/eye_pick_zu.png` })

await cam.click()
await page.waitForSelector('.eye-pick')
await sleep(200)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.eye-pick-btn')].find((n) => /Datei/.test(n.textContent || ''))
  btn?.click()
})
await sleep(400)
if (await page.$('.eye-pick')) throw new Error('Wahl blieb nach Datei offen')

console.log('gui-eye-pick ok', labels.join(' · '))
await browser.close()
