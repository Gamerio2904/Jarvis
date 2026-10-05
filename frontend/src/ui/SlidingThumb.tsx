import { useLayoutEffect, useRef, type RefObject } from 'react'

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
        ? (host.querySelector(`[data-nav="${activeId}"]`) as HTMLElement | null)
        : null
      if (!item) {
        thumb.style.opacity = '0'
        return
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
        requestAnimationFrame(() => thumb.classList.add('is-ready'))
        ready.current = true
      }
    }

    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(host)
    host.addEventListener('scroll', layout, { passive: true })
    window.addEventListener('resize', layout)
    return () => {
      ro.disconnect()
      host.removeEventListener('scroll', layout)
      window.removeEventListener('resize', layout)
    }
  }, [activeId])

  return { hostRef, thumbRef }
}
