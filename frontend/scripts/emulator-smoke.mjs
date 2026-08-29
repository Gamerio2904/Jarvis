const CDP = 'http://127.0.0.1:9222'

async function getPageWs() {
  const res = await fetch(`${CDP}/json`)
  const list = await res.json()
  const page = list.find((t) => t.type === 'page' && String(t.url).includes('localhost')) || list[0]
  if (!page?.webSocketDebuggerUrl) throw new Error(`no page target: ${JSON.stringify(list)}`)
  return page.webSocketDebuggerUrl
}

function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let next = 1
  const pending = new Map()
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(String(ev.data))
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  })
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve())
    ws.addEventListener('error', (err) => reject(err))
  })
  async function send(method, params = {}) {
    await ready
    const id = next++
    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`CDP timeout ${method}`)), 30_000)
      pending.set(id, (msg) => {
        clearTimeout(timer)
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)))
        else resolve(msg.result)
      })
      ws.send(JSON.stringify({ id, method, params }))
    })
    return result
  }
  async function evaluate(expression, timeoutMs = 20_000) {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      timeout: timeoutMs,
    })
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'evaluate failed')
    }
    return result.result?.value
  }
  return { send, evaluate, close: () => ws.close() }
}

const wsUrl = await getPageWs()
const cdp = connectCdp(wsUrl)

const title = await cdp.evaluate(`document.querySelector('#setup-title')?.textContent || ''`)
const btn = await cdp.evaluate(`document.querySelector('.setup-card button')?.textContent?.trim() || ''`)
if (!String(title).includes('Modell')) throw new Error(`bad overlay title: ${title}`)
console.log(`overlay: ${title} / ${btn}`)

const opfsOk = await cdp.evaluate(`(async () => {
  try {
    const root = await navigator.storage.getDirectory()
    const handle = await root.getFileHandle('jarvis-persist-probe.bin', { create: true })
    const writable = await handle.createWritable()
    await writable.write(new Blob([new Uint8Array(2048)]))
    await writable.close()
    const file = await (await root.getFileHandle('jarvis-persist-probe.bin')).getFile()
    await navigator.storage.persist?.()
    return file.size === 2048
  } catch (err) {
    return String(err)
  }
})()`)
console.log(`opfs persist probe: ${opfsOk}`)
if (opfsOk !== true) throw new Error(`OPFS not usable: ${opfsOk}`)

await cdp.evaluate(`{
  const overlay = document.querySelector('.setup-overlay')
  if (overlay) overlay.style.display = 'none'
  true
}`)

await cdp.evaluate(`{
  const ta = document.querySelector('textarea')
  if (!ta) throw new Error('no textarea')
  const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
  proto.set.call(ta, '/hilfe')
  ta.dispatchEvent(new Event('input', { bubbles: true }))
  const btn = document.querySelector('.composer button')
  btn.click()
  true
}`)

const help = await cdp.evaluate(`(async () => {
  const started = Date.now()
  while (Date.now() - started < 15000) {
    const texts = [...document.querySelectorAll('.row.assistant .bubble-text')].map((el) => el.textContent || '')
    if (texts.some((t) => t.includes('Handy'))) return texts.join('\\n')
    await new Promise((r) => setTimeout(r, 300))
  }
  return 'TIMEOUT ' + document.body.innerText.slice(0, 400)
})()`)
console.log(`help reply: ${String(help).slice(0, 200)}`)
if (!String(help).includes('Handy')) throw new Error(`help failed: ${help}`)

await cdp.evaluate(`{
  const ta = document.querySelector('textarea')
  const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
  proto.set.call(ta, 'Notiz: Emulator-Test')
  ta.dispatchEvent(new Event('input', { bubbles: true }))
  document.querySelector('.composer button').click()
  true
}`)

const note = await cdp.evaluate(`(async () => {
  const started = Date.now()
  while (Date.now() - started < 15000) {
    const texts = [...document.querySelectorAll('.row.assistant .bubble-text')].map((el) => el.textContent || '')
    const hit = texts.find((t) => t.includes('Emulator-Test') || t.includes('anlegen'))
    if (hit) return hit
    await new Promise((r) => setTimeout(r, 300))
  }
  return 'TIMEOUT ' + [...document.querySelectorAll('.row.assistant .bubble-text')].map((el) => el.textContent).join(' | ')
})()`)
console.log(`note reply: ${note}`)
if (!/Emulator-Test|anlegen/.test(String(note))) throw new Error(`note failed: ${note}`)

await cdp.evaluate(`{
  const ta = document.querySelector('textarea')
  const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
  proto.set.call(ta, 'Ja')
  ta.dispatchEvent(new Event('input', { bubbles: true }))
  true
}`)
await cdp.evaluate(`(async () => {
  const started = Date.now()
  while (Date.now() - started < 8000) {
    const send = document.querySelector('.composer button')
    if (send && !send.disabled) {
      send.click()
      return true
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  document.querySelector('.composer button')?.click()
  return true
})()`)
const confirm = await cdp.evaluate(`(async () => {
  const started = Date.now()
  while (Date.now() - started < 15000) {
    const texts = [...document.querySelectorAll('.row.assistant .bubble-text')].map((el) => el.textContent || '')
    const hit = texts.find((t) => t.includes('liegt') || t.includes('Notiert') || t.includes('angelegt'))
    if (hit) return hit
    await new Promise((r) => setTimeout(r, 300))
  }
  return 'TIMEOUT ' + [...document.querySelectorAll('.row.assistant .bubble-text')].map((el) => el.textContent).join(' | ')
})()`)
console.log(`confirm reply: ${confirm}`)
if (!/liegt|Notiert|angelegt/.test(String(confirm))) throw new Error(`confirm failed: ${confirm}`)

await cdp.evaluate(`{
  const overlay = document.querySelector('.setup-overlay')
  if (overlay) overlay.style.display = ''
  const btn = document.querySelector('.setup-card button')
  btn.click()
  true
}`)
const download = await cdp.evaluate(`(async () => {
  const started = Date.now()
  while (Date.now() - started < 45000) {
    const err = document.querySelector('.setup-error')?.textContent || ''
    const btn = document.querySelector('.setup-card button')?.textContent || ''
    const hint = [...document.querySelectorAll('.setup-card .settings-hint')].map((el) => el.textContent).join(' ')
    if (/file not found/i.test(err)) return 'ERR ' + err
    if (/\b([1-9]\d?)%/.test(btn + ' ' + hint) || /Download läuft/.test(hint) || /starten/.test(btn)) {
      return 'PROGRESS ' + btn + ' | ' + hint
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  const err = document.querySelector('.setup-error')?.textContent || ''
  const btn = document.querySelector('.setup-card button')?.textContent || ''
  return 'TIMEOUT ' + btn + ' ' + err
})()`)
console.log(`download: ${download}`)
if (String(download).startsWith('ERR')) throw new Error(`download error: ${download}`)
if (!String(download).startsWith('PROGRESS')) throw new Error(`download did not start: ${download}`)

console.log('emulator smoke ok')
cdp.close()
