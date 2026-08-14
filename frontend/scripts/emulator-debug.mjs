const res = await fetch('http://127.0.0.1:9222/json')
const list = await res.json()
console.log('targets', list.map((t) => ({ type: t.type, title: t.title, url: t.url })))
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
    const timer = setTimeout(() => reject(new Error('timeout ' + method)), 20_000)
    pending.set(n, (msg) => {
      clearTimeout(timer)
      resolve(msg)
    })
    ws.send(JSON.stringify({ id: n, method, params }))
  })
}
const html = await send('Runtime.evaluate', {
  expression:
    '({ html: document.documentElement.outerHTML.slice(0, 800), text: document.body.innerText.slice(0, 400), ready: document.readyState, url: location.href, ta: !!document.querySelector("textarea") })',
  returnByValue: true,
})
console.log(JSON.stringify(html.result?.result?.value || html.result?.exceptionDetails || html, null, 2))
ws.close()
