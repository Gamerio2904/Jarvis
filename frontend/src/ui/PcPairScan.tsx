import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { applyPcPair } from '../engine/pc'

type Props = {
  open: boolean
  onClose: () => void
  onPaired: (ok: boolean, reply: string) => void
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

export function PcPairScan(p: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('Kamera auf den QR im PC-Fenster.')
  const [busy, setBusy] = useState(false)
  const [paste, setPaste] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const loopRef = useRef(0)
  const busyRef = useRef(false)
  const onPairedRef = useRef(p.onPaired)
  const onCloseRef = useRef(p.onClose)
  onPairedRef.current = p.onPaired
  onCloseRef.current = p.onClose

  const applyRaw = useCallback(async (raw: string) => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setMsg('Verbinde…')
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    const r = await applyPcPair(raw)
    busyRef.current = false
    setBusy(false)
    onPairedRef.current(r.ok, r.reply)
    if (r.ok) onCloseRef.current()
    else setMsg(r.reply)
  }, [])

  useEffect(() => {
    if (!p.open) return
    let dead = false
    setMsg('Kamera auf den QR im PC-Fenster.')
    void (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMsg('Keine Kamera — Foto aufnehmen oder Code einfügen.')
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
                await applyRaw(raw)
                return
              }
            } catch {
              /* next frame */
            }
          }
          loopRef.current = window.setTimeout(() => void tick(), 280)
        }
        void tick()
      } catch {
        if (!dead) setMsg('Kamera gesperrt — Foto aufnehmen oder Code einfügen.')
      }
    })()
    return () => {
      dead = true
      window.clearTimeout(loopRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [p.open, applyRaw])

  if (!p.open) return null

  return (
    <div
      className="pc-scan-overlay"
      role="dialog"
      aria-label="PC-QR scannen"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) p.onClose()
      }}
    >
      <div className="pc-scan-card">
        <h3>PC-QR scannen</h3>
        <p className="settings-hint">{msg}</p>
        <video ref={videoRef} className="pc-scan-video" playsInline muted autoPlay />
        <div className="settings-actions">
          <button type="button" className="retry-btn" disabled={busy} onClick={() => fileRef.current?.click()}>
            Foto aufnehmen
          </button>
          <button type="button" className="ghost-btn" disabled={busy} onClick={p.onClose}>
            Abbrechen
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            void createImageBitmap(file).then(async (bmp) => {
              const raw = await decodeBitmap(bmp)
              bmp.close()
              if (!raw) {
                setMsg('Kein QR auf dem Foto. Nochmal, näher an den Code.')
                return
              }
              await applyRaw(raw)
            })
          }}
        />
        <label className="settings-field">
          <span>Oder Code einfügen</span>
          <input
            value={paste}
            disabled={busy}
            placeholder="jarvis-pc:v1|192.168…|18790|…"
            autoComplete="off"
            onChange={(e) => setPaste(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="ghost-btn"
          disabled={busy || !paste.trim()}
          onClick={() => void applyRaw(paste)}
        >
          Verbinden
        </button>
      </div>
    </div>
  )
}
