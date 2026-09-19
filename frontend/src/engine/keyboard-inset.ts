/** IME below this is treated as closed (browser chrome jitter). */
export const KB_OPEN_PX = 48

/**
 * Keyboard height from layout viewport vs visual viewport.
 * `visualOffsetTop` covers iOS rubber-band / focused-input scroll.
 */
export function keyboardInsetPx(
  layoutHeight: number,
  visualHeight: number,
  visualOffsetTop = 0,
): number {
  const raw = layoutHeight - visualHeight - visualOffsetTop
  if (!Number.isFinite(raw) || raw < KB_OPEN_PX) return 0
  return Math.round(raw)
}

/** Dock stays on the layout bottom. IME paints over it. */
export function dockLiftPx(_kb: number): number {
  return 0
}

/** Main bottom pad: keyboard when open, else dock reserve. */
export function mainBottomPadPx(kb: number, dockReserve: number): number {
  if (kb > 0) return kb
  return Math.max(0, dockReserve)
}

export function applyKeyboardMetrics(root: HTMLElement, kb: number): void {
  root.style.setProperty('--kb', `${kb}px`)
  root.style.setProperty('--kb-lift', `${kb}px`)
  root.style.setProperty('--kb-dock', `${dockLiftPx(kb)}px`)
  root.classList.toggle('is-kb', kb > 0)
}

export function bindKeyboardInset(root: HTMLElement): () => void {
  const apply = () => {
    const vv = window.visualViewport
    const layout = document.documentElement.clientHeight || window.innerHeight
    const kb = vv ? keyboardInsetPx(layout, vv.height, vv.offsetTop) : 0
    applyKeyboardMetrics(root, kb)
  }
  apply()
  const vv = window.visualViewport
  vv?.addEventListener('resize', apply)
  vv?.addEventListener('scroll', apply)
  window.addEventListener('resize', apply)
  return () => {
    vv?.removeEventListener('resize', apply)
    vv?.removeEventListener('scroll', apply)
    window.removeEventListener('resize', apply)
    root.classList.remove('is-kb')
    root.style.removeProperty('--kb')
    root.style.removeProperty('--kb-lift')
    root.style.removeProperty('--kb-dock')
  }
}
