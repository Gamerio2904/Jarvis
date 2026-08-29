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
function send(method, params, timeoutMs = 20_000) {
  const n = id++
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout ' + method)), timeoutMs)
    pending.set(n, (msg) => {
      clearTimeout(timer)
      if (msg.error) reject(new Error(msg.error.message))
      else resolve(msg.result)
    })
    ws.send(JSON.stringify({ id: n, method, params }))
  })
}
async function evaluate(expression, timeoutMs = 20_000) {
  const result = await send(
    'Runtime.evaluate',
    { expression, awaitPromise: true, returnByValue: true },
    timeoutMs,
  )
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'eval failed')
  return result.result?.value
}

const before = await evaluate(`({
  btn: document.querySelector('.setup-card button')?.textContent?.trim() || '',
  hint: [...document.querySelectorAll('.setup-card .settings-hint')].map(e => e.textContent).join(' | '),
  err: document.querySelector('.setup-error')?.textContent || '',
})`)
console.log('before', JSON.stringify(before))
await evaluate(`{
  const btn = document.querySelector('.setup-card button')
  if (!btn) throw new Error('no setup button')
  btn.click()
  true
}`)
const started = Date.now()
while (Date.now() - started < 200_000) {
  const info = await evaluate(`({
    overlay: Boolean(document.querySelector('.setup-overlay')),
    display: document.querySelector('.setup-overlay') ? getComputedStyle(document.querySelector('.setup-overlay')).display : 'none',
    btn: document.querySelector('.setup-card button')?.textContent?.trim() || '',
    hint: [...document.querySelectorAll('.setup-card .settings-hint')].map(e => e.textContent).join(' | '),
    err: document.querySelector('.setup-error')?.textContent || document.querySelector('.error-banner')?.textContent || '',
    ta: Boolean(document.querySelector('textarea')),
  })`)
  console.log(`${Math.round((Date.now() - started) / 1000)}s`, JSON.stringify(info))
  if (!info.overlay || info.display === 'none') {
    console.log('MODEL_READY')
    break
  }
  if (info.err && /fehlgeschlagen|timeout|lange|nicht/i.test(info.err) && !/starten/i.test(info.btn)) {
    console.log('MODEL_FAIL', info.err)
    break
  }
  await new Promise((r) => setTimeout(r, 5000))
}
ws.close()
