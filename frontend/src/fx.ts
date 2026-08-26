/** Pointer luxury, magnetic hover, and click ripples. Respects reduced motion. */

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const MAGNET_SEL =
  'button, .chat-item, .prompt-chip, .cal-cell, .memory-item, .voice-orb, .confirm-btn, .memory-toggle, .settings-rail-item, .lage-tile, .lage-btn'

export function bindChromeFx(root: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {}

  let hot: HTMLElement | null = null

  const onPointerMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect()
    const x = ((e.clientX - r.left) / Math.max(r.width, 1)) * 100
    const y = ((e.clientY - r.top) / Math.max(r.height, 1)) * 100
    root.style.setProperty('--lux-x', `${x.toFixed(2)}%`)
    root.style.setProperty('--lux-y', `${y.toFixed(2)}%`)

    const t = (e.target as HTMLElement | null)?.closest<HTMLElement>(MAGNET_SEL)
    if (hot && hot !== t) {
      cool(hot)
      hot = null
    }
    if (!t || isDisabled(t) || t.closest('textarea, input, select')) return
    hot = t
    t.classList.add('is-hot')
    const b = t.getBoundingClientRect()
    const mx = e.clientX - b.left - b.width / 2
    const my = e.clientY - b.top - b.height / 2
    t.style.setProperty('--mx', `${(mx * 0.18).toFixed(1)}px`)
    t.style.setProperty('--my', `${(my * 0.18).toFixed(1)}px`)
    t.style.setProperty('--hx', `${(((e.clientX - b.left) / b.width) * 100).toFixed(1)}%`)
    t.style.setProperty('--hy', `${(((e.clientY - b.top) / b.height) * 100).toFixed(1)}%`)
  }

  const onLeave = () => {
    if (hot) cool(hot)
    hot = null
  }

  const onDown = (e: PointerEvent) => {
    const t = (e.target as HTMLElement | null)?.closest<HTMLElement>(MAGNET_SEL)
    if (!t || isDisabled(t)) return
    spawnRipple(t, e.clientX, e.clientY)
    t.classList.add('is-press')
  }

  const onUp = () => {
    root.querySelectorAll('.is-press').forEach((el) => el.classList.remove('is-press'))
  }

  root.addEventListener('pointermove', onPointerMove, { passive: true })
  root.addEventListener('pointerleave', onLeave)
  root.addEventListener('pointerdown', onDown)
  root.addEventListener('pointerup', onUp)
  root.addEventListener('pointercancel', onUp)

  return () => {
    root.removeEventListener('pointermove', onPointerMove)
    root.removeEventListener('pointerleave', onLeave)
    root.removeEventListener('pointerdown', onDown)
    root.removeEventListener('pointerup', onUp)
    root.removeEventListener('pointercancel', onUp)
    if (hot) cool(hot)
  }
}

function isDisabled(el: HTMLElement): boolean {
  return el instanceof HTMLButtonElement && el.disabled
}

function cool(el: HTMLElement) {
  el.classList.remove('is-hot')
  el.style.removeProperty('--mx')
  el.style.removeProperty('--my')
  el.style.removeProperty('--hx')
  el.style.removeProperty('--hy')
}

function spawnRipple(el: HTMLElement, cx: number, cy: number) {
  const r = el.getBoundingClientRect()
  const span = document.createElement('span')
  span.className = 'ripple'
  span.style.left = `${cx - r.left}px`
  span.style.top = `${cy - r.top}px`
  el.appendChild(span)
  window.setTimeout(() => span.remove(), 720)
}
