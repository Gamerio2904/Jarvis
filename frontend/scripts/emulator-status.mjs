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
    const timer = setTimeout(() => reject(new Error(`timeout ${method}`)), 20_000)
    pending.set(n, (msg) => {
      clearTimeout(timer)
      if (msg.error) reject(new Error(msg.error.message))
      else resolve(msg.result)
    })
    ws.send(JSON.stringify({ id: n, method, params }))
  })
}
const out = await send('Runtime.evaluate', {
  expression: `(async () => {
    const btn = document.querySelector('.setup-card button')?.textContent
    const err = document.querySelector('.setup-error')?.textContent || '-'
    const hint = [...document.querySelectorAll('.setup-card .settings-hint')].map(e => e.textContent).join(' / ')
    let head = ''
    try {
      const r = await fetch('https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf', { method: 'HEAD' })
      head = 'HEAD ' + r.status + ' len=' + r.headers.get('content-length')
    } catch (e) {
      head = 'HEAD fail ' + e
    }
    const res = performance.getEntriesByType('resource').slice(-8).map(e => e.name.split('/').pop() + ':' + Math.round(e.transferSize||0)).join(', ')
    return btn + ' || ' + err + ' || ' + hint + ' || ' + head + ' || ' + res
  })()`,
  awaitPromise: true,
  returnByValue: true,
})
console.log(out.result.value)
ws.close()
