import { useCallback, useEffect, useState } from 'react'
import {
  connectServerDevice,
  listServerDevices,
  listServerLog,
  serverHealth,
  serverQr,
  startDeskServer,
  stopDeskServer,
  type ServerDevice,
  type ServerHealth,
  type ServerLogEntry,
} from '../engine/server-desk.ts'

function clock(iso: string): string {
  const at = Date.parse(iso)
  if (!Number.isFinite(at)) return ''
  return new Date(at).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

export function ServerOverlay({ onClose, leaving = false }: { onClose: () => void; leaving?: boolean }) {
  const [health, setHealth] = useState<ServerHealth | null>(null)
  const [devices, setDevices] = useState<ServerDevice[]>([])
  const [log, setLog] = useState<ServerLogEntry[]>([])
  const [qr, setQr] = useState('')
  const [busy, setBusy] = useState('')
  const [line, setLine] = useState('')

  const refresh = useCallback(async () => {
    setHealth(await serverHealth())
    setDevices(listServerDevices())
    setLog(listServerLog())
    setQr(serverQr())
  }, [])

  useEffect(() => {
    void refresh()
    const onDesk = () => void refresh()
    window.addEventListener('jarvis-server-desk', onDesk)
    const timer = window.setInterval(() => void refresh(), 4000)
    return () => {
      window.removeEventListener('jarvis-server-desk', onDesk)
      window.clearInterval(timer)
    }
  }, [refresh])

  async function start() {
    setBusy('start')
    setLine('')
    try {
      const next = await startDeskServer()
      setHealth(next)
      setQr(serverQr())
      setLog(listServerLog())
      setLine(next.running ? 'Server läuft über HTTPS.' : next.message)
    } finally {
      setBusy('')
    }
  }

  async function stop() {
    setBusy('stop')
    setLine('')
    try {
      const next = await stopDeskServer()
      setHealth(next)
      setQr('')
      setLog(listServerLog())
      setLine(next.message)
    } finally {
      setBusy('')
    }
  }

  async function connect(id: string) {
    setBusy(id)
    setLine('')
    try {
      setLine(await connectServerDevice(id))
      setDevices(listServerDevices())
      setLog(listServerLog())
    } finally {
      setBusy('')
    }
  }

  async function addDevice() {
    setBusy('qr')
    setLine('')
    try {
      if (!health?.running) {
        const next = await startDeskServer()
        setHealth(next)
      }
      const src = serverQr()
      setQr(src)
      setLog(listServerLog())
      setLine(src
        ? 'Code bereithalten. Auf dem anderen Gerät: Scanne QR Code.'
        : 'Der Code kommt, sobald der HTTPS-Server in der App läuft.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className={`watch-overlay server-overlay fx-in${leaving ? ' is-leaving' : ''}`}>
      <header className="watch-head">
        <div>
          <h2>Server</h2>
          <p>HTTPS im eigenen WLAN. Der Abgleich ergänzt, was fehlt.</p>
        </div>
        <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>Fertig</button>
      </header>
      <section className="server-health" aria-label="Zustand">
        <strong>{health?.running ? 'Online' : 'Aus'}</strong>
        <span>{health?.https ? 'Verschlüsselung HTTPS' : 'Kein HTTPS'}</span>
        <span>{health?.url || health?.message || 'Status wird gelesen.'}</span>
        {health?.fingerprint ? <span>Zertifikat {health.fingerprint.slice(0, 12)}</span> : null}
      </section>
      <div className="server-actions">
        <button type="button" className="ghost-btn" disabled={busy === 'start' || Boolean(health?.running)} onClick={() => void start()}>
          {busy === 'start' ? 'Startet…' : 'Server starten'}
        </button>
        <button type="button" className="ghost-btn" disabled={busy === 'stop' || !health?.running} onClick={() => void stop()}>
          {busy === 'stop' ? 'Beendet…' : 'Server beenden'}
        </button>
        <button type="button" className="ghost-btn" disabled={busy === 'qr'} onClick={() => void addDevice()}>
          Neues Gerät
        </button>
      </div>
      {line ? <p className="settings-hint">{line}</p> : null}
      {qr ? (
        <figure className="server-qr">
          <img src={qr} alt="Koppel-Code für ein neues Gerät" />
          <figcaption>Auf dem anderen Ultron: Scanne QR Code.</figcaption>
        </figure>
      ) : null}
      <h3 className="server-title">Geräte</h3>
      <div className="server-list">
        {devices.length === 0 ? <p className="settings-hint">Noch kein Gerät. Neues Gerät zeigt den Code.</p> : null}
        {devices.map((device) => (
          <article key={device.id} className="server-device">
            <div>
              <strong>{device.name}</strong>
              <span>{device.lastSyncAt ? `Zuletzt ${clock(device.lastSyncAt)}` : 'Noch nicht verbunden'}</span>
            </div>
            <button type="button" className="ghost-btn" disabled={Boolean(busy)} onClick={() => void connect(device.id)}>
              {busy === device.id ? 'Verbindet…' : 'Verbinden'}
            </button>
          </article>
        ))}
      </div>
      <h3 className="server-title">Protokoll</h3>
      <ol className="server-log">
        {log.length === 0 ? <li>Noch keine Aktion.</li> : null}
        {log.map((entry) => (
          <li key={entry.id} className={entry.ok ? 'is-ok' : 'is-bad'}>
            <span>{clock(entry.at)} · {entry.action}</span>
            <span>{entry.ok ? 'erfolgreich' : 'fehlgeschlagen'}</span>
            <span>{entry.detail}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
