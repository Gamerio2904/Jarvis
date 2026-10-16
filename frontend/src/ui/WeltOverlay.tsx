import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { CUBE_HALF, add, blick, fuegeWuerfel, legeAuge, leereWelt, loslassen, ohneTracker, orientierung, rot, schiebe, setzeFlaechen, setzeHand, setzen, versuchGriff, type V3, type WeltCube, type WeltSession } from '../engine/welt.ts'
import { schritt } from '../engine/welt-physik.ts'
import { strahlTreffer } from '../engine/welt-tracker.ts'
import { handInWelt, type HandBild } from '../engine/welt-hand.ts'
import { weltQuer, weltSample, weltStart, weltStop, type WeltSample } from '../native/welt.ts'
import { listenOnce, stopListen } from '../native/voice.ts'
import { leseHand, type HandLeser } from './welt-hand-live.ts'

const EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

const KNOCHEN: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
]

function corners(cube: WeltCube): V3[] {
  const h = CUBE_HALF
  const local: V3[] = [
    { x: -h, y: -h, z: -h }, { x: h, y: -h, z: -h }, { x: h, y: h, z: -h }, { x: -h, y: h, z: -h },
    { x: -h, y: -h, z: h }, { x: h, y: -h, z: h }, { x: h, y: h, z: h }, { x: -h, y: h, z: h },
  ]
  return local.map((p) => add(cube.position, rot(cube.rotation, p)))
}

function cover(nx: number, ny: number, srcW: number, srcH: number, dstW: number, dstH: number): { x: number; y: number } {
  if (srcW < 2 || srcH < 2) return { x: nx * dstW, y: ny * dstH }
  const scale = Math.max(dstW / srcW, dstH / srcH)
  const dw = srcW * scale
  const dh = srcH * scale
  return { x: (dstW - dw) / 2 + nx * dw, y: (dstH - dh) / 2 + ny * dh }
}

function project(p: V3, s: WeltSession, w: number, h: number): { x: number; y: number } | null {
  const cam = s.camera
  if (!cam) return null
  const rel = { x: p.x - cam.position.x, y: p.y - cam.position.y, z: p.z - cam.position.z }
  const q = cam.rotation
  const inv = { x: -q.x, y: -q.y, z: -q.z, w: q.w }
  const c = rot(inv, rel)
  if (c.z >= -0.02) return null
  const depth = -c.z
  const x = cam.cx + (c.x * cam.fx) / depth
  const y = cam.cy - (c.y * cam.fy) / depth
  if (x < -80 || y < -80 || x > w + 80 || y > h + 80) return null
  return { x, y }
}

function depthOf(p: V3, s: WeltSession): number | null {
  const cam = s.camera
  if (!cam) return null
  const rel = { x: p.x - cam.position.x, y: p.y - cam.position.y, z: p.z - cam.position.z }
  const q = cam.rotation
  const c = rot({ x: -q.x, y: -q.y, z: -q.z, w: q.w }, rel)
  if (c.z >= -0.02) return null
  return -c.z
}

function aufTiefe(s: WeltSession, sx: number, sy: number, depth: number): V3 | null {
  const cam = s.camera
  if (!cam || depth < 0.05) return null
  const camSpace = {
    x: ((sx - cam.cx) * depth) / (cam.fx || cam.fy),
    y: ((cam.cy - sy) * depth) / cam.fy,
    z: -depth,
  }
  return add(cam.position, rot(cam.rotation, camSpace))
}

function draw(ctx: CanvasRenderingContext2D, s: WeltSession, hand: HandBild | null, srcW: number, srcH: number) {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  ctx.clearRect(0, 0, w, h)
  ctx.lineWidth = 2
  ctx.strokeStyle = '#7eb6ff'
  for (const cube of s.objects) {
    const pts = corners(cube).map((p) => project(p, s, w, h))
    ctx.beginPath()
    for (const [a, b] of EDGES) {
      const pa = pts[a]
      const pb = pts[b]
      if (!pa || !pb) continue
      ctx.moveTo(pa.x, pa.y)
      ctx.lineTo(pb.x, pb.y)
    }
    ctx.stroke()
  }
  if (!hand || hand.bild.length < 21) return
  const pts = hand.bild.map((p) => cover(p.x, p.y, srcW, srcH, w, h))
  ctx.strokeStyle = '#f2d48a'
  ctx.lineWidth = 3
  ctx.beginPath()
  for (const [a, b] of KNOCHEN) {
    const pa = pts[a]
    const pb = pts[b]
    if (!pa || !pb) continue
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
  }
  ctx.stroke()
  ctx.fillStyle = '#f2d48a'
  for (const p of pts) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function WeltOverlay({
  onClose,
  onVoice,
  leaving = false,
}: {
  onClose: () => void
  onVoice?: (text: string) => void
  leaving?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const stillRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionRef = useRef<WeltSession>(leereWelt())
  const handRef = useRef<HandLeser | null>(null)
  const handBild = useRef<HandBild | null>(null)
  const frameSize = useRef({ w: 0, h: 0 })
  const lastPinch = useRef<{ at: number; p: V3 } | null>(null)
  const drag = useRef<{ id: string; depth: number } | null>(null)
  const voiceRef = useRef(onVoice)
  voiceRef.current = onVoice
  const [session, setSession] = useState<WeltSession>(() => leereWelt())
  const [cameraNote, setCameraNote] = useState('')
  const [still, setStill] = useState('')
  const [menu, setMenu] = useState(false)
  const [voiceOn, setVoiceOn] = useState(false)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    void weltQuer(true)
    return () => {
      void weltQuer(false)
    }
  }, [])

  useEffect(() => {
    if (!voiceOn) return
    let dead = false
    void (async () => {
      while (!dead) {
        const heard = await listenOnce()
        if (dead) return
        const text = heard.text.trim()
        if (heard.ok && text) voiceRef.current?.(text)
      }
    })()
    return () => {
      dead = true
      void stopListen()
    }
  }, [voiceOn])

  useEffect(() => {
    let dead = false
    let stream: MediaStream | null = null
    let timer = 0
    let frame = 0
    const stopStream = () => {
      stream?.getTracks().forEach((track) => track.stop())
      stream = null
    }
    const applySample = (sample: WeltSample) => {
      if (!sample.available) return
      setSession((prev) => {
        let next = setzeFlaechen(
          prev,
          (sample.planes || []).map((p) => ({
            id: p.id,
            point: { x: p.px, y: p.py, z: p.pz },
            normal: { x: p.nx, y: p.ny, z: p.nz },
            halfX: p.hx,
            halfZ: p.hz,
          })),
        )
        if (sample.camera) {
          const canvas = canvasRef.current
          const iw = sample.camera.viewWidth || canvas?.width || 1
          const ih = sample.camera.viewHeight || canvas?.height || 1
          const cw = canvas?.width || iw
          const ch = canvas?.height || ih
          const sx = cw / iw
          const sy = ch / ih
          next = blick(next, {
            position: { x: sample.camera.px, y: sample.camera.py, z: sample.camera.pz },
            rotation: { x: sample.camera.qx, y: sample.camera.qy, z: sample.camera.qz, w: sample.camera.qw },
            fx: sample.camera.fx * sx,
            fy: sample.camera.fy * sy,
            cx: sample.camera.cx * sx,
            cy: sample.camera.cy * sy,
          })
        }
        next = orientierung(next, sample.tracking !== 'weg')
        return next
      })
      if (sample.jpeg) setStill(`data:image/jpeg;base64,${sample.jpeg}`)
    }
    const openEye = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraNote('Keine Kamera auf diesem Gerät.')
        return
      }
      try {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' } } })
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
        }
        if (dead) {
          stopStream()
          return
        }
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => {})
          frameSize.current = { w: video.videoWidth || video.clientWidth, h: video.videoHeight || video.clientHeight }
        }
        setCameraNote('')
        setSession((prev) => legeAuge(ohneTracker(prev), window.innerWidth, window.innerHeight))
      } catch {
        if (!dead) setCameraNote('Kamera ist zu.')
      }
    }
    void (async () => {
      const started = await weltStart()
      if (dead) {
        void weltStop()
        return
      }
      if (!started.available) {
        await openEye()
        return
      }
      timer = window.setInterval(() => {
        void weltSample().then((sample) => {
          if (!dead) applySample(sample)
        })
      }, 120)
    })()
    const paint = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      const host = canvas.parentElement
      const w = host?.clientWidth || 1
      const h = host?.clientHeight || 1
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      const video = videoRef.current
      const stillEl = stillRef.current
      if (video && video.videoWidth > 2) frameSize.current = { w: video.videoWidth, h: video.videoHeight }
      else if (stillEl && stillEl.naturalWidth > 2) frameSize.current = { w: stillEl.naturalWidth, h: stillEl.naturalHeight }
      draw(ctx, sessionRef.current, handBild.current, frameSize.current.w, frameSize.current.h)
    }
    const loop = () => {
      if (dead) return
      frame = window.requestAnimationFrame(loop)
      setSession((prev) => schritt(prev, 1 / 60))
      paint()
    }
    const handTimer = window.setInterval(() => {
      const source = videoRef.current && videoRef.current.readyState >= 2 ? videoRef.current : stillRef.current
      const canvas = canvasRef.current
      if (!source || !canvas) return
      void (async () => {
        if (!handRef.current) handRef.current = await leseHand()
        const reader = handRef.current
        if (!reader) return
        const now = performance.now()
        const bild = await reader.lese(source, canvas.width, canvas.height, now)
        if (!bild) {
          handBild.current = null
          setSession((prev) => setzeHand(prev, null, null))
          return
        }
        handBild.current = bild
        const current = sessionRef.current
        const pose = current.camera
          ? handInWelt({ ...bild, camera: current.camera, width: canvas.width, height: canvas.height })
          : null
        if (!drag.current) {
          setSession((prev) => {
            let next = setzeHand(prev, pose?.pinch ?? null, pose?.rotation ?? null)
            if (pose?.closed && !next.heldId) next = versuchGriff(next)
            if (pose && !pose.closed && next.heldId && !next.dragId && pose.pinch) {
              const last = lastPinch.current
              const dt = last ? now - last.at : 0
              const velocity = last && dt > 0 && dt < 250
                ? {
                    x: ((pose.pinch.x - last.p.x) / dt) * 1000,
                    y: ((pose.pinch.y - last.p.y) / dt) * 1000,
                    z: ((pose.pinch.z - last.p.z) / dt) * 1000,
                  }
                : { x: 0, y: 0, z: 0 }
              next = loslassen(next, velocity)
            }
            if (pose?.pinch) lastPinch.current = { at: now, p: pose.pinch }
            return next
          })
        }
        const ctx = canvas.getContext('2d')
        if (ctx) draw(ctx, sessionRef.current, handBild.current, frameSize.current.w, frameSize.current.h)
      })()
    }, 90)
    frame = window.requestAnimationFrame(loop)
    return () => {
      dead = true
      window.cancelAnimationFrame(frame)
      window.clearInterval(timer)
      window.clearInterval(handTimer)
      stopStream()
      void weltStop()
      setSession(leereWelt())
    }
  }, [])

  function localPoint(ev: PointerEvent<HTMLCanvasElement>): { x: number; y: number } | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((ev.clientX - rect.left) / rect.width) * canvas.width,
      y: ((ev.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function wuerfelBei(x: number, y: number): { id: string; depth: number } | null {
    const s = sessionRef.current
    const canvas = canvasRef.current
    if (!canvas) return null
    let best: { id: string; depth: number } | null = null
    let bestD = 64
    for (const cube of s.objects) {
      const p = project(cube.position, s, canvas.width, canvas.height)
      const depth = depthOf(cube.position, s)
      if (!p || depth === null) continue
      const d = Math.hypot(p.x - x, p.y - y)
      if (d < bestD) {
        best = { id: cube.id, depth }
        bestD = d
      }
    }
    return best
  }

  function onPointerDown(ev: PointerEvent<HTMLCanvasElement>) {
    if (menu) {
      setMenu(false)
      return
    }
    const at = localPoint(ev)
    if (!at) return
    const hit = wuerfelBei(at.x, at.y)
    if (hit) {
      drag.current = hit
      ev.currentTarget.setPointerCapture(ev.pointerId)
      const cube = sessionRef.current.objects.find((c) => c.id === hit.id)
      if (cube) setSession((prev) => schiebe(prev, hit.id, cube.position))
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const nx = ((ev.clientX - rect.left) / rect.width) * 2 - 1
    const ny = 1 - ((ev.clientY - rect.top) / rect.height) * 2
    const plane = strahlTreffer(sessionRef.current, nx, ny)
    if (!plane) return
    setSession((prev) => setzen(prev, plane))
  }

  function onPointerMove(ev: PointerEvent<HTMLCanvasElement>) {
    const hold = drag.current
    if (!hold) return
    const at = localPoint(ev)
    if (!at) return
    const point = aufTiefe(sessionRef.current, at.x, at.y, hold.depth)
    if (!point) return
    setSession((prev) => schiebe(prev, hold.id, point))
  }

  function onPointerUp() {
    const hold = drag.current
    if (!hold) return
    drag.current = null
    setSession((prev) => (prev.heldId === hold.id ? loslassen(prev, { x: 0, y: 0, z: 0 }) : prev))
  }

  return (
    <div className={`watch-overlay welt-overlay fx-in${leaving ? ' is-leaving' : ''}`}>
      <video ref={videoRef} className="welt-video" playsInline muted autoPlay />
      <img ref={stillRef} className="welt-video" alt="" src={still || undefined} />
      <canvas
        ref={canvasRef}
        className="welt-draw"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {cameraNote ? <p className="welt-note">{cameraNote}</p> : null}
      <button
        type="button"
        className={`welt-menu-btn${menu ? ' is-open' : ''}`}
        aria-label="Menü"
        aria-expanded={menu}
        onClick={() => setMenu((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      {menu ? (
        <div className="welt-menu" role="menu">
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={voiceOn}
            onClick={() => setVoiceOn((v) => !v)}
          >
            {voiceOn ? 'Sprache aus' : 'Sprache an'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              setSession((prev) => fuegeWuerfel(prev.camera ? prev : legeAuge(prev, window.innerWidth, window.innerHeight)))
            }
          >
            Würfel
          </button>
          <button type="button" role="menuitem" onClick={onClose}>
            Schließen
          </button>
        </div>
      ) : null}
      {voiceOn ? <span className="welt-mic" aria-label="Sprache an" /> : null}
    </div>
  )
}
