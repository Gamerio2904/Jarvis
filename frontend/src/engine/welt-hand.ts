/** 21 Handpunkte. Der Zangenpunkt liegt in Weltmetern oder bleibt leer. */

import { add, len, rot, sub, type Q, type V3, type WeltCamera } from './welt.ts'

export type HandPunkt = { x: number; y: number; z: number }

const DAUMEN = 4
const ZEIGE = 8
const HANDGELENK = 0
const MITTE = 9

export function zangenpunkt(daumen: V3, zeigefinger: V3): V3 {
  return {
    x: (daumen.x + zeigefinger.x) / 2,
    y: (daumen.y + zeigefinger.y) / 2,
    z: (daumen.z + zeigefinger.z) / 2,
  }
}

/** Abstand Daumen–Zeigefinger ist klein gegen die eigene Hand. */
export function zangeZu(punkte: V3[]): boolean {
  if (punkte.length < 10) return false
  const hand = len(sub(punkte[MITTE], punkte[HANDGELENK]))
  if (hand < 1e-5) return false
  return len(sub(punkte[DAUMEN], punkte[ZEIGE])) / hand < 0.45
}

export type HandBild = {
  bild: HandPunkt[]
  welt: HandPunkt[]
  width: number
  height: number
  camera: WeltCamera | null
}

/**
 * Bildpunkte sind 0..1. Weltpunkte der Hand sind Meter um die Hand.
 * Ohne Kamera oder ohne Meterlage bleibt der Zangenpunkt leer.
 */
const HAND_SPAN_M = 0.08

export function handInWelt(hand: HandBild): { pinch: V3; rotation: Q; closed: boolean } | null {
  if (!hand.camera || hand.bild.length < 10) return null
  const cam = hand.camera
  if (!(cam.fy > 1)) return null
  const wrist = hand.bild[HANDGELENK]
  const mid = hand.bild[MITTE]
  const pixel = Math.hypot((mid.x - wrist.x) * hand.width, (mid.y - wrist.y) * hand.height)
  const measured = hand.welt.length >= 10 ? len(sub(hand.welt[MITTE], hand.welt[HANDGELENK])) : 0
  const meters = measured > 1e-4 ? measured : HAND_SPAN_M
  if (pixel < 2) return null
  const depth = (meters * cam.fy) / pixel
  if (!Number.isFinite(depth) || depth < 0.05 || depth > 3) return null
  const tipA = hand.bild[DAUMEN]
  const tipB = hand.bild[ZEIGE]
  const px = ((tipA.x + tipB.x) / 2) * hand.width
  const py = ((tipA.y + tipB.y) / 2) * hand.height
  const camSpace: V3 = {
    x: ((px - cam.cx) * depth) / (cam.fx || cam.fy),
    y: ((cam.cy - py) * depth) / cam.fy,
    z: -depth,
  }
  const pinch = add(cam.position, rot(cam.rotation, camSpace))
  const closed = zangeZu((hand.welt.length >= 10 ? hand.welt : hand.bild).map((p) => ({ x: p.x, y: p.y, z: p.z })))
  return { pinch, rotation: { ...cam.rotation }, closed }
}
