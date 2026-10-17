import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { CUBE_HALF, add, blick, fuegeWuerfel, gier, legeAuge, leereWelt, loslassen, mitTisch, norm, ohneTracker, orientierung, rot, schiebe, setzeFlaechen, setzeHand, setzen, sub, tischAnBlick, versuchGriff, type V3, type WeltCube, type WeltSession } from '../engine/welt.ts'
import { schritt } from '../engine/welt-physik.ts'
import { handInWelt, type HandBild } from '../engine/welt-hand.ts'
import { weltQuer, weltSample, weltStart, weltStop, type WeltSample } from '../native/welt.ts'
import { listenOnce, stopListen } from '../native/voice.ts'
import { leseHand, type HandLeser } from './welt-hand-live.ts'

const EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

const FACES: Array<{ i: [number, number, number, number]; n: V3; color: [number, number, number] }> = [
  { i: [3, 2, 6, 7], n: { x: 0, y: 1, z: 0 }, color: [186, 248, 255] },
  { i: [0, 1, 5, 4], n: { x: 0, y: -1, z: 0 }, color: [12, 22, 58] },
  { i: [1, 2, 6, 5], n: { x: 1, y: 0, z: 0 }, color: [48, 126, 255] },
  { i: [0, 4, 7, 3], n: { x: -1, y: 0, z: 0 }, color: [122, 52, 255] },
  { i: [4, 5, 6, 7], n: { x: 0, y: 0, z: 1 }, color: [32, 214, 255] },
  { i: [0, 3, 2, 1], n: { x: 0, y: 0, z: -1 }, color: [20, 64, 210] },
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
  if (x < -160 || y < -160 || x > w + 160 || y > h + 160) return null
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

function deckeKamera(
  fx: number,
  fy: number,
  cx: number,
  cy: number,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
) {
  if (srcW < 2 || srcH < 2 || dstW < 2 || dstH < 2) return { fx, fy, cx, cy }
  const scale = Math.max(dstW / srcW, dstH / srcH)
  const dw = srcW * scale
  const dh = srcH * scale
  return {
    fx: fx * scale,
    fy: fy * scale,
    cx: (dstW - dw) / 2 + cx * scale,
    cy: (dstH - dh) / 2 + cy * scale,
  }
}

function ton(color: [number, number, number], light: number): string {
  const k = 0.42 + 0.85 * light
  const r = Math.min(255, Math.round(color[0] * k))
  const g = Math.min(255, Math.round(color[1] * k))
  const b = Math.min(255, Math.round(color[2] * k))
  return `rgb(${r},${g},${b})`
}

function zeichneWuerfel(ctx: CanvasRenderingContext2D, s: WeltSession, cube: WeltCube, w: number, h: number) {
  const welt = corners(cube)
  const pts = welt.map((p) => project(p, s, w, h))
  const cam = s.camera
  const boden = project({ x: cube.position.x, y: cube.position.y - CUBE_HALF, z: cube.position.z }, s, w, h)
  const rand = project({ x: cube.position.x + 0.055, y: cube.position.y - CUBE_HALF, z: cube.position.z }, s, w, h)
  if (boden && rand) {
    const rad = Math.max(10, Math.hypot(rand.x - boden.x, rand.y - boden.y))
    ctx.save()
    ctx.translate(boden.x, boden.y + rad * 0.25)
    ctx.scale(1.15, 0.42)
    const glow = ctx.createRadialGradient(0, 0, rad * 0.2, 0, 0, rad)
    glow.addColorStop(0, 'rgba(90, 220, 255, 0.45)')
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(0, 0, rad, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  const order = FACES.map((face, n) => {
    let depth = 0
    let seen = 0
    for (const i of face.i) {
      const d = depthOf(welt[i], s)
      if (d === null || !pts[i]) return { n, depth: -1, face }
      depth += d
      seen += 1
    }
    return { n, depth: seen ? depth / seen : -1, face }
  })
    .filter((row) => row.depth > 0)
    .sort((a, b) => b.depth - a.depth)
  for (const row of order) {
    const face = row.face
    const poly = face.i.map((i) => pts[i]).filter((p): p is { x: number; y: number } => Boolean(p))
    if (poly.length < 4) continue
    const mid = face.i.reduce(
      (acc, i) => ({ x: acc.x + welt[i].x / 4, y: acc.y + welt[i].y / 4, z: acc.z + welt[i].z / 4 }),
      { x: 0, y: 0, z: 0 },
    )
    const normal = rot(cube.rotation, face.n)
    const light = cam ? Math.max(0, Math.min(1, (norm(sub(cam.position, mid)).x * normal.x + norm(sub(cam.position, mid)).y * normal.y + norm(sub(cam.position, mid)).z * normal.z))) : 0.75
    ctx.beginPath()
    ctx.moveTo(poly[0].x, poly[0].y)
    for (const p of poly.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.closePath()
    ctx.fillStyle = ton(face.color, light)
    ctx.fill()
    if (face.n.y > 0.5) {
      ctx.save()
      ctx.clip()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
      ctx.lineWidth = 1.5
      const a = poly[0]
      const b = poly[1]
      const d = poly[3]
      ctx.beginPath()
      ctx.moveTo(a.x * 0.65 + b.x * 0.35, a.y * 0.65 + b.y * 0.35)
      ctx.lineTo(d.x * 0.65 + poly[2].x * 0.35, d.y * 0.65 + poly[2].y * 0.35)
      ctx.moveTo(a.x * 0.35 + d.x * 0.65, a.y * 0.35 + d.y * 0.65)
      ctx.lineTo(b.x * 0.35 + poly[2].x * 0.65, b.y * 0.35 + poly[2].y * 0.65)
      ctx.stroke()
      ctx.restore()
    }
  }
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = 'rgba(150, 240, 255, 0.95)'
  ctx.shadowBlur = 18
  ctx.strokeStyle = '#f3fdff'
  ctx.lineWidth = 3.5
  ctx.beginPath()
  for (const [a, b] of EDGES) {
    const pa = pts[a]
    const pb = pts[b]
    if (!pa || !pb) continue
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
  }
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.6
  ctx.stroke()
  ctx.restore()
}

function zeichneHand(ctx: CanvasRenderingContext2D, hand: HandBild, srcW: number, srcH: number) {
  if (hand.bild.length < 21) return
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  const pts = hand.bild.map((p) => cover(p.x, p.y, srcW, srcH, w, h))
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = 'rgba(130, 255, 214, 0.95)'
  ctx.shadowBlur = 14
  ctx.strokeStyle = '#f4fff9'
  ctx.lineWidth = 5
  ctx.beginPath()
  for (const [a, b] of KNOCHEN) {
    const pa = pts[a]
    const pb = pts[b]
    if (!pa || !pb) continue
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
  }
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(190, 255, 236, 0.95)'
  ctx.lineWidth = 2
  for (const p of pts) {
    ctx.beginPath()
    ctx.moveTo(p.x - 8, p.y)
    ctx.lineTo(p.x + 8, p.y)
    ctx.moveTo(p.x, p.y - 8)
    ctx.lineTo(p.x, p.y + 8)
    ctx.stroke()
    ctx.fillStyle = '#7dffe2'
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function draw(ctx: CanvasRenderingContext2D, s: WeltSession, hand: HandBild | null, srcW: number, srcH: number) {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  ctx.clearRect(0, 0, w, h)
  for (const cube of s.objects) zeichneWuerfel(ctx, s, cube, w, h)
  if (hand) zeichneHand(ctx, hand, srcW, srcH)
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
  const handAt = useRef(0)
  const drag = useRef<{ id: string; depth: number } | null>(null)
  const voiceRef = useRef(onVoice)
  voiceRef.current = onVoice
  const [session, setSession] = useState<WeltSession>(() => leereWelt())
  const [cameraNote, setCameraNote] = useState('')
  const [still, setStill] = useState('')
  const [menu, setMenu] = useState(false)
  const [voiceOn, setVoiceOn] = useState(false)
  const arPose = useRef(false)
  const lage0 = useRef<number | null>(null)

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
    const onOri = (ev: DeviceOrientationEvent) => {
      if (arPose.current || ev.alpha == null || !Number.isFinite(ev.alpha)) return
      if (lage0.current == null) lage0.current = ev.alpha
      let delta = ev.alpha - lage0.current
      while (delta > 180) delta -= 360
      while (delta < -180) delta += 360
      const yaw = (-delta * Math.PI) / 180
      setSession((prev) => {
        if (!prev.camera || arPose.current) return prev
        return blick(prev, { ...prev.camera, rotation: gier(yaw) })
      })
    }
    window.addEventListener('deviceorientation', onOri)
    return () => window.removeEventListener('deviceorientation', onOri)
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
            halfX: Math.max(p.hx || 0, 0.32),
            halfZ: Math.max(p.hz || 0, 0.32),
            rotation:
              typeof p.qw === 'number'
                ? { x: p.qx || 0, y: p.qy || 0, z: p.qz || 0, w: p.qw || 1 }
                : undefined,
          })),
        )
        if (sample.camera) {
          arPose.current = true
          const canvas = canvasRef.current
          const iw = sample.camera.viewWidth || canvas?.width || 1
          const ih = sample.camera.viewHeight || canvas?.height || 1
          const cw = canvas?.width || iw
          const ch = canvas?.height || ih
          const eye = deckeKamera(sample.camera.fx, sample.camera.fy, sample.camera.cx, sample.camera.cy, iw, ih, cw, ch)
          next = blick(next, {
            position: { x: sample.camera.px, y: sample.camera.py, z: sample.camera.pz },
            rotation: { x: sample.camera.qx, y: sample.camera.qy, z: sample.camera.qz, w: sample.camera.qw },
            fx: eye.fx,
            fy: eye.fy,
            cx: eye.cx,
            cy: eye.cy,
          })
        }
        next = orientierung(next, sample.tracking !== 'weg')
        return mitTisch(next)
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
      setSession((prev) => schritt(mitTisch(prev), 1 / 60))
      paint()
    }
    const handTimer = window.setInterval(() => {
      const video = videoRef.current
      const stillEl = stillRef.current
      const source = video && video.readyState >= 2 && video.videoWidth > 2 ? video : stillEl
      const canvas = canvasRef.current
      if (!source || !canvas) return
      if (source instanceof HTMLImageElement && (!source.complete || source.naturalWidth < 2)) return
      void (async () => {
        if (!handRef.current) handRef.current = await leseHand()
        const reader = handRef.current
        if (!reader) return
        const now = performance.now()
        const bild = await reader.lese(source, canvas.width, canvas.height, now)
        if (!bild) {
          if (now - handAt.current > 500) {
            handBild.current = null
            setSession((prev) => setzeHand(prev, null, null))
          }
          return
        }
        handAt.current = now
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
    const plane = tischAnBlick(mitTisch(sessionRef.current), nx, ny)
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
