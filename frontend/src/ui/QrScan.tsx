import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { parseHausQr } from '../engine/haus-link.ts'
import { parsePairCode, reconcilePairedStand, savePairing } from '../engine/tablet-sync.ts'
import { rememberServerDevice } from '../engine/server-desk.ts'
import { hausEnsureCamera } from '../native/haus.ts'

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

/**
 * Allgemeiner QR-Scanner. Er liest jeden Code: Kopplungscodes verbinden das
 * Gerät sofort mit dem Hausstand-Server und gleichen den Stand ab, alles
 * andere (Link, Text, WLAN) wird angezeigt und kann geöffnet oder kopiert
 * werden.
 */
export function QrScan(p: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const loopRef = useRef(0)
  const busyRef = useRef(false)
  const propsRef = useRef(p)
  propsRef.current = p
  const [result, setResult] = useState<string | null>(null)
  const [msg, setMsg] = useState('Kamera auf einen QR-Code halten.')
  const [busy, setBusy] = useState(false)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const take = useCallback((raw: string) => {
    if (busyRef.current) return
    const pair = parsePairCode(raw)
    if (pair) {
      busyRef.current = true
      setBusy(true)
      setMsg('Koppel…')
      void (async () => {
        try {
          await savePairing(pair.url, pair.token, pair.fingerprint)
          rememberServerDevice(raw)
          stopCamera()
          const out = await reconcilePairedStand().catch(() => ({ ok: false, line: 'Abgleich ging schief.', added: 0 }))
          setResult(raw)
          setMsg(out.ok ? `Gekoppelt und abgeglichen: ${out.line}` : `Gekoppelt. ${out.line}`)
          propsRef.current.onDone(out.ok ? `Gekoppelt und abgeglichen: ${out.line}` : `Gekoppelt. ${out.line}`)
        } catch (error) {
          setMsg(error instanceof Error ? error.message : 'Kopplung konnte nicht geschützt gespeichert werden.')
        } finally {
          busyRef.current = false
          setBusy(false)
          window.dispatchEvent(new Event('jarvis-server-desk'))
        }
      })()
      return
    }
    stopCamera()
    setResult(raw)
    setMsg('Code gelesen.')
  }, [stopCamera])

  useEffect(() => {
    if (!p.open || result) {
      return
    }
    let dead = false
    setMsg('Kamera auf einen QR-Code halten.')
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
      stopCamera()
    }
  }, [p.open, result, take, stopCamera])

  const isUrl = (raw: string) => /^https?:\/\/\S+$/i.test(raw.trim())
  const hausLike = (raw: string) => Boolean(parseHausQr(raw))

  async function copyResult() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setMsg('Kopiert.')
    } catch {
      setMsg('Kopieren geht nicht — Text markieren.')
    }
  }

  function rescan() {
    setResult(null)
    setMsg('Kamera auf einen QR-Code halten.')
  }

  if (!p.open) return null

  return (
    <div className="pc-scan-overlay" role="dialog" aria-label="QR-Scanner">
      <div className="pc-scan-card">
        <h3>QR-Scanner</h3>
        <p className="settings-hint">{msg}</p>
        {result ? null : <video ref={videoRef} className="pc-scan-video" playsInline muted autoPlay />}
        {result ? (
          <div className="qr-result">
            <p className="qr-result-text">{result.slice(0, 600)}</p>
            {isUrl(result) ? (
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy}
                  onClick={() => {
                    window.open(result.trim(), '_blank', 'noopener')
                  }}
                >
                  Link öffnen
                </button>
              </div>
            ) : null}
            {hausLike(result) ? (
              <p className="settings-hint">Das sieht nach einem alten Hausstand-Export aus. Kopplung läuft über den Code am Server.</p>
            ) : null}
            <div className="settings-actions">
              <button type="button" className="ghost-btn" onClick={() => void copyResult()}>
                Kopieren
              </button>
              <button type="button" className="retry-btn" onClick={rescan}>
                Weiter scannen
              </button>
            </div>
          </div>
        ) : null}
        <div className="settings-actions">
          <button type="button" className="ghost-btn" disabled={busy} onClick={p.onClose}>
            {result ? 'Fertig' : 'Abbrechen'}
          </button>
        </div>
      </div>
    </div>
  )
}
