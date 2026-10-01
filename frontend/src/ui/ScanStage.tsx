import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import {
  emptyPose,
  loadScan,
  noteDepth,
  orbit,
  panPose,
  pointsFromDepthMap,
  projectPoint,
  zoomPose,
  type ScanState,
  type ViewPose,
} from '../engine/room-scan.ts'
import { loadSettings } from '../engine/store.ts'

type DepthInfo = {
  width: number
  height: number
  getDepthInMeters: (x: number, y: number) => number
}

type XrSessionLike = {
  requestAnimationFrame: (cb: (t: number, frame: XrFrameLike) => void) => number
  cancelAnimationFrame: (id: number) => void
  requestReferenceSpace: (kind: string) => Promise<unknown>
  end: () => Promise<void>
}

type XrFrameLike = {
  getViewerPose: (space: unknown) => { views: unknown[] } | null
  getDepthInformation?: (view: unknown) => DepthInfo | null
}

function drawMesh(
  ctx: CanvasRenderingContext2D,
  positions: number[],
  indices: number[],
  pose: ViewPose,
  shift: { x: number; y: number; z: number },
  w: number,
  h: number,
) {
  ctx.beginPath()
  for (let i = 0; i < indices.length; i += 3) {
    const pts = [indices[i], indices[i + 1], indices[i + 2]].map((k) => {
      const o = k * 3
      return projectPoint(positions[o] + shift.x, positions[o + 1] + shift.y, positions[o + 2] + shift.z, pose, w, h)
    })
    if (pts.some((p) => !p)) continue
    const [a, b, c] = pts as Array<{ x: number; y: number }>
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.lineTo(c.x, c.y)
    ctx.closePath()
  }
  ctx.strokeStyle = 'rgba(255, 42, 54, 0.85)'
  ctx.lineWidth = 1
  ctx.stroke()
}

export function ScanStage({ phase }: { phase: ScanState['phase'] }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseRef = useRef<ViewPose>(emptyPose())
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef(0)
  const paintRef = useRef<() => void>(() => {})
  const [cam, setCam] = useState('')
  const [scan, setScan] = useState<ScanState>(() => loadScan())

  useEffect(() => {
    const on = () => setScan(loadScan())
    window.addEventListener('jarvis-settings', on)
    return () => window.removeEventListener('jarvis-settings', on)
  }, [])

  useEffect(() => {
    if (phase !== 'live') return
    let dead = false
    let stream: MediaStream | null = null
    void (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!dead) setCam('Keine Kamera auf diesem Gerät.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        })
        if (dead) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => {})
        }
        setCam('')
      } catch {
        if (!dead) setCam('Kamera ist zu.')
      }
    })()
    return () => {
      dead = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'live') return
    const nav = navigator as Navigator & {
      xr?: {
        isSessionSupported: (mode: string) => Promise<boolean>
        requestSession: (mode: string, opts: object) => Promise<XrSessionLike>
      }
    }
    if (!nav.xr) return
    let dead = false
    let session: XrSessionLike | null = null
    let raf = 0
    const arm = async () => {
      if (dead || session) return
      const ok = await nav.xr?.isSessionSupported('immersive-ar').catch(() => false)
      if (!ok || dead) return
      session = await nav.xr!
        .requestSession('immersive-ar', {
          requiredFeatures: ['depth-sensing'],
          optionalFeatures: ['dom-overlay'],
          domOverlay: { root: document.body },
          depthSensing: {
            usagePreference: ['cpu-optimized'],
            dataFormatPreference: ['luminance-alpha', 'float32'],
          },
        })
        .catch(() => null)
      if (!session || dead) {
        if (session) void session.end().catch(() => {})
        session = null
        return
      }
      const space = await session.requestReferenceSpace('viewer').catch(() => null)
      if (!space || dead) return
      const tick = (_t: number, frame: XrFrameLike) => {
        if (dead || !session) return
        const pose = frame.getViewerPose(space)
        const view = pose?.views?.[0]
        const info = view && frame.getDepthInformation ? frame.getDepthInformation(view) : null
        if (info && info.width > 1 && info.height > 1) {
          const map = new Float32Array(info.width * info.height)
          const step = 4
          for (let y = 0; y < info.height; y += step) {
            for (let x = 0; x < info.width; x += step) {
              map[y * info.width + x] = info.getDepthInMeters(x / info.width, y / info.height)
            }
          }
          noteDepth(pointsFromDepthMap(map, info.width, info.height, step))
        }
        raf = session.requestAnimationFrame(tick)
      }
      raf = session.requestAnimationFrame(tick)
    }
    const onPointer = () => void arm()
    window.addEventListener('pointerdown', onPointer)
    return () => {
      dead = true
      window.removeEventListener('pointerdown', onPointer)
      if (session) {
        session.cancelAnimationFrame(raf)
        void session.end().catch(() => {})
      }
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'model') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const paint = () => {
      const rect = canvas.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width))
      const h = Math.max(1, Math.floor(rect.height))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      ctx.clearRect(0, 0, w, h)
      const state = loadScan()
      const pose = poseRef.current
      if (state.positions.length && state.indices.length) {
        drawMesh(ctx, state.positions, state.indices, pose, { x: 0, y: 0, z: 0 }, w, h)
      }
      for (const obj of state.objects) {
        if (obj.removed || obj.positions.length < 9 || obj.indices.length < 3) continue
        drawMesh(ctx, obj.positions, obj.indices, pose, obj.pose, w, h)
      }
    }
    paintRef.current = paint
    paint()
    const onResize = () => paint()
    window.addEventListener('resize', onResize)
    const id = window.setInterval(paint, 200)
    return () => {
      window.removeEventListener('resize', onResize)
      window.clearInterval(id)
    }
  }, [phase, scan])

  if (phase === 'off') return null

  if (phase === 'live') {
    return (
      <div className="scan-live" aria-label="Scan">
        <video ref={videoRef} playsInline muted autoPlay />
        <p className="scan-live-line">{cam || `${scan.name || 'Scan'}. Sag Beende den Scan.`}</p>
      </div>
    )
  }

  function onPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const next = { x: e.clientX, y: e.clientY }
    pointers.current.set(e.pointerId, next)
    const pts = [...pointers.current.values()]
    if (pts.length >= 2) {
      const [a, b] = pts
      const gap = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinch.current > 8 && gap > 8) poseRef.current = zoomPose(poseRef.current, gap / pinch.current)
      pinch.current = gap
      poseRef.current = panPose(poseRef.current, next.x - prev.x, next.y - prev.y)
    } else {
      poseRef.current = orbit(poseRef.current, next.x - prev.x, next.y - prev.y)
    }
    paintRef.current()
  }

  function onPointerUp(e: ReactPointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(e.pointerId)
    pinch.current = 0
  }

  function onWheel(e: ReactWheelEvent<HTMLCanvasElement>) {
    poseRef.current = zoomPose(poseRef.current, e.deltaY > 0 ? 0.92 : 1.08)
    paintRef.current()
  }

  const line = scan.note || scan.name
  return (
    <div className="scan-model" aria-label={scan.name || 'Modell'}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />
      {line ? <p className="scan-model-line">{line}</p> : null}
    </div>
  )
}

export function scanPhase(): ScanState['phase'] {
  const raw = loadSettings().scan_json || ''
  if (!raw) return 'off'
  return loadScan().phase
}
