import type { ReactNode } from 'react'
import { useSlidingThumb } from './SlidingThumb'

export type NavIslandItem = {
  id: string
  label: string
  icon: ReactNode
}

type Props = {
  items: NavIslandItem[]
  value: string
  onChange: (id: string) => void
  ariaLabel: string
  className?: string
}

export function NavIsland(p: Props) {
  const { hostRef, thumbRef } = useSlidingThumb(p.value)
  return (
    <nav
      ref={hostRef}
      className={`nav-island${p.className ? ` ${p.className}` : ''}`}
      aria-label={p.ariaLabel}
    >
      <span ref={thumbRef} className="nav-island-thumb" aria-hidden />
      {p.items.map((it) => {
        const on = it.id === p.value
        return (
          <button
            key={it.id}
            type="button"
            data-nav={it.id}
            className={`nav-island-item${on ? ' is-on' : ''}`}
            aria-current={on ? 'page' : undefined}
            aria-label={it.label}
            onClick={() => p.onChange(it.id)}
          >
            <span className="nav-island-ico">{it.icon}</span>
            <span className="nav-island-label">{it.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function IconHome() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        d="M4 11.2 12 4.5l8 6.7V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-8.8Z"
      />
    </svg>
  )
}

export function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        d="M3.8 12h16.4M12 3.8c2.4 2.6 3.6 5.4 3.6 8.2S14.4 17.6 12 20.2C9.6 17.6 8.4 14.8 8.4 12S9.6 6.4 12 3.8Z"
      />
    </svg>
  )
}

export function IconMic() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <rect x="9" y="3.5" width="6" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M6.8 11.5a5.2 5.2 0 0 0 10.4 0M12 16.7V20.5"
      />
    </svg>
  )
}

export function IconCal() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M8 3.5v4M16 3.5v4M3.5 10h17" />
    </svg>
  )
}

export function IconGearMini() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        d="M12 3.4 13.4 6l2.8-.4 1.4 2.5 2.4 1.5L18.6 12l1.4 2.4-2.4 1.5-1.4 2.5-2.8-.4L12 20.6 10.6 18l-2.8.4-1.4-2.5-2.4-1.5L5.4 12 4 9.6l2.4-1.5L7.8 5.6l2.8.4L12 3.4Z"
      />
    </svg>
  )
}
