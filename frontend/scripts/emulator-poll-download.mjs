const started = Date.now()
while (Date.now() - started < 15 * 60 * 1000) {
  const res = await fetch('http://127.0.0.1:9222/json')
  const list = await res.json()
  const ws = new WebSocket(list[0].webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve())
    ws.addEventListener('error', reject)
  })
  const result = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('cdp timeout')), 20_000)
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data))
      if (msg.id === 1) {
        clearTimeout(timer)
        if (msg.error) reject(new Error(msg.error.message))
        else resolve(msg.result)
      }
    })
    ws.send(
      JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(async () => {
            const overlay = document.querySelector('.setup-overlay')
            const visible = overlay && getComputedStyle(overlay).display !== 'none'
            const btn = document.querySelector('.setup-card button')?.textContent || ''
            const err = document.querySelector('.setup-error')?.textContent || ''
            const hint = [...document.querySelectorAll('.setup-card .settings-hint')].map((e) => e.textContent).join(' / ')
            return JSON.stringify({ visible, btn, err, hint })
          })()`,
          awaitPromise: true,
          returnByValue: true,
        },
      }),
    )
  })
  ws.close()
  const info = JSON.parse(result.result.value)
  console.log(info)
  if (info.err && /file not found|fehlgeschlagen|HTTP/i.test(info.err)) {
    throw new Error(info.err)
  }
  if (!info.visible) {
    console.log('overlay closed — model ready')
    break
  }
  if (/starten|geladen/i.test(info.btn + info.hint) && /100%/.test(info.btn + info.hint)) {
    console.log('download complete, loading wasm')
  }
  await new Promise((r) => setTimeout(r, 12_000))
}
