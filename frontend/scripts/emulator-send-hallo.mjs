const res = await fetch('http://127.0.0.1:9222/json')
const list = await res.json()
const ws = new WebSocket(list[0].webSocketDebuggerUrl)
await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j) })
let id = 1
const pending = new Map()
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(String(ev.data))
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg)
})
function send(method, params, timeoutMs = 20_000) {
  const n = id++
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs)
    pending.set(n, (msg) => { clearTimeout(timer); resolve(msg) })
    ws.send(JSON.stringify({ id: n, method, params }))
  })
}
async function evaluate(expression, timeoutMs = 20_000) {
  const msg = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, timeoutMs)
  const payload = msg.result || msg
  if (payload.exceptionDetails) throw new Error(payload.exceptionDetails.text)
  return payload.result?.value
}
await evaluate(`(() => {
  const overlay = document.querySelector('.setup-overlay')
  if (overlay) overlay.style.display = 'none'
  const ta = document.querySelector('textarea')
  const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
  proto.set.call(ta, 'Hallo')
  ta.dispatchEvent(new Event('input', { bubbles: true }))
  document.querySelector('.composer button').click()
  return true
})()`)
const out = await evaluate(`(async () => {
  const t0 = Date.now()
  while (Date.now() - t0 < 8000) {
    const err = document.querySelector('.error-banner')?.textContent || ''
    const last = [...document.querySelectorAll('.row.assistant:not(.streaming) .bubble-text')].at(-1)?.textContent || ''
    const status = document.querySelector('.status-note')?.textContent || ''
    if (err) return { kind: 'error', err, last, status, ms: Date.now()-t0 }
    await new Promise(r => setTimeout(r, 200))
  }
  return {
    kind: 'timeout',
    err: document.querySelector('.error-banner')?.textContent || '',
    last: [...document.querySelectorAll('.row.assistant:not(.streaming) .bubble-text')].at(-1)?.textContent || '',
    status: document.querySelector('.status-note')?.textContent || '',
  }
})()`, 12_000)
console.log(JSON.stringify(out))
ws.close()
