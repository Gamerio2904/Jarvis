import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { CUBE_HALF, add, blick, leereWelt, loslassen, ohneTracker, orientierung, rot, setzeFlaechen, setzeHand, setzen, versuchGriff, weltZeile, type V3, type WeltCube, type WeltSession } from '../engine/welt.ts'
import { schritt } from '../engine/welt-physik.ts'
import { strahlTreffer } from '../engine/welt-tracker.ts'
import { handInWelt, type HandBild } from '../engine/welt-hand.ts'
import { weltSample, weltStart, weltStop, type WeltSample } from '../native/welt.ts'
import { leseHand, type HandLeser } from './welt-hand-live.ts'

const EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

function corners(cube: WeltCube): V3[] {
  const h = CUBE_HALF
  const local: V3[] = [
    { x: -h, y: -h, z: -h }, { x: h, y: -h, z: -h }, { x: h, y: h, z: -h }, { x: -h, y: h, z: -h },
    { x: -h, y: -h, z: h }, { x: h, y: -h, z: h }, { x: h, y: h, z: h }, { x: -h, y: h, z: h },
  ]
  return local.map((p) => add(cube.position, rot(cube.rotation, p)))
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

function draw(ctx: CanvasRenderingContext2D, s: WeltSession, hand: HandBild | null) {
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
  ctx.strokeStyle = '#f2d48a'
  ctx.beginPath()
  for (const p of hand.bild) {
    ctx.moveTo(p.x * w, p.y * h)
    ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2)
  }
  ctx.stroke()
}

export function WeltOverlay({ onClose, leaving = false }: { onClose: () => void; leaving?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const stillRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionRef = useRef<WeltSession>(leereWelt())
  const handRef = useRef<HandLeser | null>(null)
  const handBild = useRef<HandBild | null>(null)
  const lastPinch = useRef<{ at: number; p: V3 } | null>(null)
  const [session, setSession] = useState<WeltSession>(() => leereWelt())
  const [cameraNote, setCameraNote] = useState('')
  const [still, setStill] = useState('')

  useEffect(() => {
    sessionRef.current = session
  }, [session])

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
      setSession((prev) => {
        if (!sample.available) return ohneTracker(prev)
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
          next = blick(next, {
            position: { x: sample.camera.px, y: sample.camera.py, z: sample.camera.pz },
            rotation: { x: sample.camera.qx, y: sample.camera.qy, z: sample.camera.qz, w: sample.camera.qw },
            fx: sample.camera.fx,
            fy: sample.camera.fy,
            cx: sample.camera.cx,
            cy: sample.camera.cy,
          })
        }
        next = orientierung(next, sample.tracking !== 'weg')
        return next
      })
      if (sample.jpeg) setStill(`data:image/jpeg;base64,${sample.jpeg}`)
    }
    void (async () => {
      const started = await weltStart()
      if (dead) {
        void weltStop()
        return
      }
      if (!started.available) {
        setSession((prev) => ohneTracker(prev))
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
          }
          setCameraNote('')
        } catch {
          if (!dead) setCameraNote('Kamera ist zu.')
        }
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
      draw(ctx, sessionRef.current, handBild.current)
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
        const current = sessionRef.current
        if (!reader || !current.camera) return
        const now = performance.now()
        const bild = await reader.lese(source, canvas.width, canvas.height, now)
        if (!bild) {
          handBild.current = null
          setSession((prev) => setzeHand(prev, null, null))
          return
        }
        handBild.current = bild
        const pose = handInWelt({ ...bild, camera: current.camera, width: canvas.width, height: canvas.height })
        setSession((prev) => {
          let next = setzeHand(prev, pose?.pinch ?? null, pose?.rotation ?? null)
          if (pose?.closed && !next.heldId) next = versuchGriff(next)
          if (pose && !pose.closed && next.heldId && pose.pinch) {
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
        const ctx = canvas.getContext('2d')
        if (ctx) draw(ctx, sessionRef.current, handBild.current)
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

  function onTap(ev: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const nx = ((ev.clientX - rect.left) / rect.width) * 2 - 1
    const ny = 1 - ((ev.clientY - rect.top) / rect.height) * 2
    const hit = strahlTreffer(sessionRef.current, nx, ny)
    if (!hit) return
    setSession((prev) => setzen(prev, hit))
  }

  const line = cameraNote || weltZeile(session)

  return (
    <div className={`watch-overlay welt-overlay fx-in${leaving ? ' is-leaving' : ''}`}>
      <video ref={videoRef} className="welt-video" playsInline muted autoPlay />
      <img ref={stillRef} className="welt-video" alt="" src={still || undefined} />
      <canvas ref={canvasRef} className="welt-draw" onPointerDown={onTap} />
      <header className="welt-bar">
        <p>{line}</p>
        <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>Schließen</button>
      </header>
    </div>
  )
}
