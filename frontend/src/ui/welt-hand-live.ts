/** Lokaler Hand-Landmarker. Fehlt das Modell, bleibt die Hand leer. */

import type { HandBild, HandPunkt } from '../engine/welt-hand.ts'

type Landmarker = {
  detect: (source: CanvasImageSource) => {
    landmarks?: Array<Array<{ x: number; y: number; z: number }>>
    worldLandmarks?: Array<Array<{ x: number; y: number; z: number }>>
  }
}

export type HandLeser = {
  lese: (source: CanvasImageSource, width: number, height: number, now: number) => Promise<HandBild | null>
}

let pending: Promise<HandLeser | null> | null = null
let failedAt = 0

function punkte(raw: Array<{ x: number; y: number; z: number }> | undefined): HandPunkt[] {
  if (!raw || raw.length < 21) return []
  return raw.slice(0, 21).map((p) => ({ x: p.x, y: p.y, z: p.z }))
}

function mass(source: CanvasImageSource): { w: number; h: number } | null {
  if (source instanceof HTMLVideoElement) {
    if (source.readyState < 2 || source.videoWidth < 2) return null
    return { w: source.videoWidth, h: source.videoHeight }
  }
  if (source instanceof HTMLImageElement) {
    if (!source.complete || source.naturalWidth < 2) return null
    return { w: source.naturalWidth, h: source.naturalHeight }
  }
  if (source instanceof HTMLCanvasElement) {
    if (source.width < 2 || source.height < 2) return null
    return { w: source.width, h: source.height }
  }
  return null
}

export function leseHand(): Promise<HandLeser | null> {
  if (pending) return pending
  if (failedAt && Date.now() - failedAt < 2500) return Promise.resolve(null)
  pending = (async () => {
    try {
      const vision = await import('@mediapipe/tasks-vision')
      const files = await vision.FilesetResolver.forVisionTasks('/welt/wasm')
      const marker = (await vision.HandLandmarker.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: '/welt/hand_landmarker.task',
          delegate: 'CPU',
        },
        runningMode: 'IMAGE',
        numHands: 1,
        minHandDetectionConfidence: 0.3,
        minHandPresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
      })) as Landmarker
      const scratch = document.createElement('canvas')
      return {
        async lese(source) {
          const size = mass(source)
          if (!size) return null
          const scale = Math.min(1, 640 / Math.max(size.w, size.h))
          const dw = Math.max(2, Math.round(size.w * scale))
          const dh = Math.max(2, Math.round(size.h * scale))
          if (scratch.width !== dw || scratch.height !== dh) {
            scratch.width = dw
            scratch.height = dh
          }
          const g = scratch.getContext('2d', { willReadFrequently: true })
          if (!g) return null
          g.drawImage(source, 0, 0, dw, dh)
          try {
            const hit = marker.detect(scratch)
            const bild = punkte(hit.landmarks?.[0])
            const welt = punkte(hit.worldLandmarks?.[0])
            if (bild.length < 21) return null
            return { bild, welt, width: size.w, height: size.h, camera: null }
          } catch {
            return null
          }
        },
      }
    } catch {
      failedAt = Date.now()
      pending = null
      return null
    }
  })()
  return pending
}
