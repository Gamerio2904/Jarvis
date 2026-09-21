import { useLayoutEffect, useRef, type RefObject } from 'react'
import { prefersReducedMotion } from '../engine/motion.ts'

/** FLIP-Thumb: gleitet mit Spring-Kurve hinter das aktive Item — wie Navigation Tabs V2. */
export function useSlidingThumb(activeId: string | null): {
  hostRef: RefObject<HTMLDivElement | null>
  thumbRef: RefObject<HTMLSpanElement | null>
} {
  const hostRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)
  const ready = useRef(false)

  useLayoutEffect(() => {
    const host = hostRef.current
    const thumb = thumbRef.current
    if (!host || !thumb) return

    const layout = () => {
      const item = activeId
        ? ([...host.querySelectorAll('[data-nav]')].find((el) => el.getAttribute('data-nav') === activeId) as
            | HTMLElement
            | undefined) ?? null
        : null
      if (!item) {
        thumb.style.opacity = '0'
        return
      }
      let scroller: HTMLElement | null = item.parentElement
      while (scroller && scroller !== host) {
        const ox = getComputedStyle(scroller).overflowX
        if (ox === 'auto' || ox === 'scroll') {
          const pad = 8
          const left = item.offsetLeft
          const right = left + item.offsetWidth
          if (left < scroller.scrollLeft + pad) scroller.scrollLeft = Math.max(0, left - pad)
          else if (right > scroller.scrollLeft + scroller.clientWidth - pad) {
            scroller.scrollLeft = right - scroller.clientWidth + pad
          }
          break
        }
        scroller = scroller.parentElement
      }
      const hr = host.getBoundingClientRect()
      const ir = item.getBoundingClientRect()
      const x = ir.left - hr.left + host.scrollLeft
      const y = ir.top - hr.top + host.scrollTop
      thumb.style.opacity = '1'
      thumb.style.width = `${ir.width}px`
      thumb.style.height = `${ir.height}px`
      thumb.style.transform = `translate(${x}px, ${y}px)`
      if (!ready.current) {
        if (!prefersReducedMotion()) {
          requestAnimationFrame(() => thumb.classList.add('is-ready'))
        }
        ready.current = true
      }
    }

    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(host)
    host.addEventListener('scroll', layout, { passive: true, capture: true })
    window.addEventListener('resize', layout)
    return () => {
      ro.disconnect()
      host.removeEventListener('scroll', layout, { capture: true })
      window.removeEventListener('resize', layout)
    }
  }, [activeId])

  return { hostRef, thumbRef }
}
