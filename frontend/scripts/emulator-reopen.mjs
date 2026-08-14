const res = await fetch('http://127.0.0.1:9222/json')
const list = await res.json()
const ws = new WebSocket(list[0].webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', () => resolve())
  ws.addEventListener('error', reject)
})
let id = 1
const pending = new Map()
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(String(ev.data))
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg)
})
function send(method, params) {
  const n = id++
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${method}`)), 30_000)
    pending.set(n, (msg) => {
      clearTimeout(timer)
      if (msg.error) reject(new Error(msg.error.message))
      else resolve(msg.result)
    })
    ws.send(JSON.stringify({ id: n, method, params }))
  })
}
async function evalExpr(expression, timeout = 20_000) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    timeout,
  })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'eval failed')
  return result.result?.value
}

const overlay = await evalExpr(`JSON.stringify({
  title: document.querySelector('#setup-title')?.textContent,
  btn: document.querySelector('.setup-card button')?.textContent?.trim(),
  hint: [...document.querySelectorAll('.setup-card .settings-hint')].map(e => e.textContent).join(' | ')
})`)
console.log('overlay', overlay)
const parsed = JSON.parse(overlay)
if (/starten/i.test(parsed.btn) && !/herunterladen/i.test(parsed.btn)) {
  throw new Error('incomplete file was treated as ready: ' + parsed.btn)
}

await evalExpr(`document.querySelector('.setup-card button').click(); true`)
const progress = await evalExpr(`(async () => {
  const started = Date.now()
  while (Date.now() - started < 40000) {
    const btn = document.querySelector('.setup-card button')?.textContent || ''
    const err = document.querySelector('.setup-error')?.textContent || ''
    const hint = [...document.querySelectorAll('.setup-card .settings-hint')].map(e => e.textContent).join(' ')
    if (/file not found/i.test(err)) return 'ERR ' + err
    const m = (btn + hint).match(/(\\d+)\\s*%/)
    if (m && Number(m[1]) >= 1) return 'PROGRESS ' + btn + ' | ' + hint
    if (/läuft/.test(hint)) {
      /* keep waiting for first percent */
    }
    await new Promise(r => setTimeout(r, 500))
  }
  const btn = document.querySelector('.setup-card button')?.textContent
  const err = document.querySelector('.setup-error')?.textContent || ''
  return 'TIMEOUT ' + btn + ' ' + err
})()`)
console.log('download', progress)
if (String(progress).startsWith('ERR')) throw new Error(progress)
if (!String(progress).startsWith('PROGRESS')) throw new Error(progress)
console.log('reopen+download smoke ok')
ws.close()
