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
      resolve(msg)
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
  console.log('RAW', JSON.stringify(result).slice(0, 500))
  const payload = result.result || result
  if (payload.exceptionDetails) {
    throw new Error(JSON.stringify(payload.exceptionDetails))
  }
  return payload.result?.value ?? payload.value
}

console.log('hide', await evaluate(`(() => {
  const overlay = document.querySelector('.setup-overlay')
  if (overlay) overlay.style.display = 'none'
  return { ta: !!document.querySelector('textarea'), send: document.querySelector('.composer button')?.textContent, overlay: !!overlay }
})()`))

const afterSet = await evaluate(`(() => {
  const ta = document.querySelector('textarea')
  const btn = document.querySelector('.composer button')
  const desc = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
  desc.set.call(ta, '/hilfe')
  ta.dispatchEvent(new Event('input', { bubbles: true }))
  return {
    value: ta.value,
    btnDisabled: btn.disabled,
    btnText: btn.textContent,
    descSet: typeof desc.set,
  }
})()`)
console.log('afterSet', JSON.stringify(afterSet))

const click = await evaluate(`(() => {
  const btn = document.querySelector('.composer button')
  btn.click()
  return { disabled: btn.disabled, text: btn.textContent }
})()`)
console.log('click', JSON.stringify(click))

const reply = await evaluate(
  `(async () => {
    const started = Date.now()
    while (Date.now() - started < 8000) {
      const texts = [...document.querySelectorAll('.row.assistant:not(.streaming) .bubble-text')].map(e => e.textContent)
      const hit = texts.find(t => t && t.includes('Handy'))
      if (hit) return { ok: true, hit, n: texts.length }
      await new Promise(r => setTimeout(r, 200))
    }
    return {
      ok: false,
      texts: [...document.querySelectorAll('.row.assistant .bubble-text')].map(e => (e.textContent||'').slice(0,80)),
      err: document.querySelector('.error-banner')?.textContent || '',
      status: document.querySelector('.status-note')?.textContent || '',
    }
  })()`,
  15_000,
)
console.log('reply', JSON.stringify(reply))
ws.close()
