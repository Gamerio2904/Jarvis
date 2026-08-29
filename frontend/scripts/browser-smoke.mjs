import puppeteer from 'puppeteer-core'

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const url = process.env.SMOKE_URL || 'http://localhost:5173/smoke.html'

const browser = await puppeteer.launch({
  executablePath: edge,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-webgpu'],
})
const page = await browser.newPage()
page.on('console', (msg) => console.log('[page]', msg.text()))
page.on('pageerror', (err) => console.log('[error]', err.message))

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
await page.waitForFunction(
  () => {
    const t = document.getElementById('out')?.textContent || ''
    return t.includes('\nPASS') || t.includes('\nFAIL') || t.startsWith('FAIL') || t.includes('FAIL ')
  },
  { timeout: 180_000 },
)
const text = await page.$eval('#out', (el) => el.textContent || '')
console.log(text)
await browser.close()
if (!text.includes('PASS')) process.exit(1)
