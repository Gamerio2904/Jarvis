/** Lokaler Hand-Landmarker. Fehlt das Modell, bleibt die Hand leer. */

import type { HandBild, HandPunkt } from '../engine/welt-hand.ts'

type Landmarker = {
  detectForVideo: (source: CanvasImageSource, now: number) => {
    landmarks?: Array<Array<{ x: number; y: number; z: number }>>
    worldLandmarks?: Array<Array<{ x: number; y: number; z: number }>>
  }
}

export type HandLeser = {
  lese: (source: CanvasImageSource, width: number, height: number, now: number) => Promise<HandBild | null>
}

let pending: Promise<HandLeser | null> | null = null

function punkte(raw: Array<{ x: number; y: number; z: number }> | undefined): HandPunkt[] {
  if (!raw || raw.length < 21) return []
  return raw.slice(0, 21).map((p) => ({ x: p.x, y: p.y, z: p.z }))
}

export function leseHand(): Promise<HandLeser | null> {
  if (pending) return pending
  pending = (async () => {
    try {
      const probe = await fetch('/welt/hand_landmarker.task', { method: 'HEAD' })
      if (!probe.ok) return null
      const vision = await import('@mediapipe/tasks-vision')
      const files = await vision.FilesetResolver.forVisionTasks('/welt/wasm')
      const marker = (await vision.HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: '/welt/hand_landmarker.task' },
        runningMode: 'VIDEO',
        numHands: 1,
      })) as Landmarker
      return {
        async lese(source, width, height) {
          const hit = marker.detectForVideo(source, performance.now())
          const bild = punkte(hit.landmarks?.[0])
          const welt = punkte(hit.worldLandmarks?.[0])
          if (!bild.length || !welt.length) return null
          return { bild, welt, width, height, camera: null }
        },
      }
    } catch {
      return null
    }
  })()
  return pending
}
