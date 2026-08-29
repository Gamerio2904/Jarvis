import puppeteer from 'puppeteer-core'

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const url = process.env.APP_URL || 'http://localhost:5173/'

const browser = await puppeteer.launch({
  executablePath: edge,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, isMobile: true })
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 })
const title = await page.$eval('#setup-title', (el) => el.textContent || '')
const btn = await page.$eval('.setup-card button', (el) => el.textContent || '')
if (!title.includes('Modell')) {
  await browser.close()
  throw new Error(`overlay title missing: ${title}`)
}
if (!btn.toLowerCase().includes('modell')) {
  await browser.close()
  throw new Error(`overlay button missing: ${btn}`)
}
console.log(`ui smoke ok: ${title} / ${btn.trim()}`)
await browser.close()
