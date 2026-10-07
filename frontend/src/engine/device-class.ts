export type DeviceClass = 'phone' | 'tablet' | 'desktop'

export function deviceClassFor(width: number, height: number, touch: boolean): DeviceClass {
  const short = Math.min(width, height)
  if (short < 600) return 'phone'
  if (width >= 1200 && !touch) return 'desktop'
  if (width >= 1400) return 'desktop'
  return 'tablet'
}

export function applyDeviceClass(root: HTMLElement, win: Window): DeviceClass {
  const w = win.innerWidth || 0
  const h = win.innerHeight || 0
  const touch = typeof win.matchMedia === 'function' && win.matchMedia('(pointer: coarse)').matches
  const cls = deviceClassFor(w, h, touch)
  root.dataset.device = cls
  root.dataset.orient = w >= h ? 'landscape' : 'portrait'
  return cls
}

export function watchDeviceClass(win: Window): () => void {
  const root = win.document.documentElement
  const run = () => applyDeviceClass(root, win)
  run()
  win.addEventListener('resize', run)
  win.addEventListener('orientationchange', run)
  return () => {
    win.removeEventListener('resize', run)
    win.removeEventListener('orientationchange', run)
  }
}
