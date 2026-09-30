import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { applyBackup, buildBackup, parseImportPayload } from '../engine/backup.ts'
import { parseHausQr } from '../engine/haus-link.ts'
import { hausEnsureCamera, hausPull, hausPush } from '../native/haus.ts'

type Dir = 'to-phone' | 'to-tablet'

type Props = {
  open: boolean
  onClose: () => void
  onDone: (line: string) => void
}

async function decodeBitmap(bitmap: ImageBitmap): Promise<string | null> {
  const BD = (
    window as unknown as {
      BarcodeDetector?: new (opts: { formats: string[] }) => {
        detect: (src: ImageBitmap) => Promise<Array<{ rawValue?: string }>>
      }
    }
  ).BarcodeDetector
  if (BD) {
    try {
      const det = new BD({ formats: ['qr_code'] })
      const hits = await det.detect(bitmap)
      const raw = hits.find((h) => h.rawValue)?.rawValue?.trim()
      if (raw) return raw
    } catch {
      /* jsQR */
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(bitmap, 0, 0)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const hit = jsQR(img.data, img.width, img.height)
  return hit?.data?.trim() || null
}

export function HausScan(p: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const loopRef = useRef(0)
  const busyRef = useRef(false)
  const [url, setUrl] = useState<string | null>(null)
  const [dir, setDir] = useState<Dir | null>(null)
  const [msg, setMsg] = useState('Kamera auf den Code am anderen Gerät.')
  const [busy, setBusy] = useState(false)

  const take = useCallback((raw: string) => {
    if (busyRef.current) return
    const next = parseHausQr(raw)
    if (!next) {
      setMsg('Das ist kein Hausstand-Code.')
      return
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setUrl(next)
    setMsg('Richtung wählen, dann Export.')
  }, [])

  useEffect(() => {
    if (!p.open) {
      setUrl(null)
      setDir(null)
      setMsg('Kamera auf den Code am anderen Gerät.')
      return
    }
    if (url) return
    let dead = false
    void (async () => {
      const cam = await hausEnsureCamera()
      if (!cam.ok) {
        if (!dead) setMsg(cam.message || 'Kamera ist zu.')
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!dead) setMsg('Keine Kamera auf diesem Gerät.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (dead) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => {})
        }
        const tick = async () => {
          if (dead || busyRef.current) return
          const videoEl = videoRef.current
          if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth) {
            try {
              const bmp = await createImageBitmap(videoEl)
              const raw = await decodeBitmap(bmp)
              bmp.close()
              if (raw && !dead) {
                take(raw)
                return
              }
            } catch {
              /* nächstes Bild */
            }
          }
          loopRef.current = window.setTimeout(() => void tick(), 280)
        }
        void tick()
      } catch {
        if (!dead) setMsg('Kamera gesperrt. In den App-Einstellungen erlauben.')
      }
    })()
    return () => {
      dead = true
      window.clearTimeout(loopRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [p.open, url, take])

  async function runExport() {
    if (!url || !dir || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setMsg('Übertrage…')
    try {
      if (dir === 'to-phone') {
        const got = await hausPull(url)
        const choice = got.ok && got.json ? parseImportPayload(got.json) : null
        if (!choice || choice.kind !== 'haus') {
          setMsg(got.message || 'Das andere Gerät hat keinen Hausstand geschickt.')
          return
        }
        const line = await applyBackup(choice.data)
        p.onDone(line)
        p.onClose()
        return
      }
      const data = await buildBackup(false)
      const sent = await hausPush(url, JSON.stringify(data))
      if (!sent.ok) {
        setMsg(sent.message || 'Das Tablet hat nicht angenommen.')
        return
      }
      p.onDone('Hausstand liegt auf dem anderen Gerät. Keys sind mitgegangen.')
      p.onClose()
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  if (!p.open) return null

  return (
    <div className="pc-scan-overlay" role="dialog" aria-label="Hausstand scannen">
      <div className="pc-scan-card">
        <h3>Hausstand</h3>
        <p className="settings-hint">{msg}</p>
        {url ? null : <video ref={videoRef} className="pc-scan-video" playsInline muted autoPlay />}
        {url ? (
          <div className="haus-dirs" role="group" aria-label="Richtung">
            <button
              type="button"
              className={dir === 'to-phone' ? 'is-on' : ''}
              aria-pressed={dir === 'to-phone'}
              disabled={busy}
              onClick={() => setDir('to-phone')}
            >
              Tablet zu Handy
            </button>
            <button
              type="button"
              className={dir === 'to-tablet' ? 'is-on' : ''}
              aria-pressed={dir === 'to-tablet'}
              disabled={busy}
              onClick={() => setDir('to-tablet')}
            >
              Handy zu Tablet
            </button>
          </div>
        ) : null}
        <div className="settings-actions">
          {url ? (
            <button type="button" className="retry-btn" disabled={busy || !dir} onClick={() => void runExport()}>
              Export
            </button>
          ) : null}
          <button type="button" className="ghost-btn" disabled={busy} onClick={p.onClose}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}
