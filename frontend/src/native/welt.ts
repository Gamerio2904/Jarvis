import { Capacitor, registerPlugin } from '@capacitor/core'

export type WeltPlaneSample = {
  id: string
  px: number
  py: number
  pz: number
  nx: number
  ny: number
  nz: number
  hx: number
  hz: number
  qx?: number
  qy?: number
  qz?: number
  qw?: number
}

export type WeltSample = {
  available: boolean
  tracking?: 'hält' | 'weg'
  reason?: string
  camera?: {
    px: number
    py: number
    pz: number
    qx: number
    qy: number
    qz: number
    qw: number
    fx: number
    fy: number
    cx: number
    cy: number
    viewWidth?: number
    viewHeight?: number
  }
  planes?: WeltPlaneSample[]
  jpeg?: string
}

type NativeWelt = {
  start(): Promise<{ available: boolean; reason?: string }>
  sample(): Promise<WeltSample>
  stop(): Promise<{ ok: boolean }>
  landscape(opts: { on: boolean }): Promise<{ ok: boolean }>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeWelt>('JarvisWelt') : null

const MISSING: WeltSample = { available: false, tracking: 'weg', reason: 'ARCore fehlt' }

export async function weltStart(): Promise<{ available: boolean; reason?: string }> {
  if (!native) return { available: false, reason: 'ARCore fehlt' }
  try {
    const res = await native.start()
    return { available: Boolean(res.available), reason: res.reason || '' }
  } catch {
    return { available: false, reason: 'ARCore fehlt' }
  }
}

export async function weltSample(): Promise<WeltSample> {
  if (!native) return MISSING
  try {
    const res = await native.sample()
    return res?.available ? res : MISSING
  } catch {
    return MISSING
  }
}

export async function weltQuer(an: boolean): Promise<void> {
  if (native) {
    try {
      await native.landscape({ on: an })
    } catch {
      /* Die Fläche dreht sich über die Bildschirmsperre. */
    }
  }
  const orient = screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> }
  try {
    if (an) await orient.lock?.('landscape')
    else orient.unlock()
  } catch {
    /* Der Browser lässt die Sperre nur im Vollbild zu. */
  }
}

export async function weltStop(): Promise<void> {
  if (!native) return
  try {
    await native.stop()
  } catch {
    /* Sitzung ist schon zu. */
  }
}
