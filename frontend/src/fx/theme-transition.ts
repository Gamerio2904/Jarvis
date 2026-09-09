/** Radial wipe from nav dock — Reel Dc_qazGKcQ8 approximation. */

export function runThemeTransition(next: 'dark' | 'light', root: HTMLElement | null): void {
  if (!root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  root.classList.remove('theme-wipe-dark', 'theme-wipe-light')
  void root.offsetWidth
  root.classList.add(next === 'light' ? 'theme-wipe-light' : 'theme-wipe-dark')
  window.setTimeout(() => {
    root.classList.remove('theme-wipe-dark', 'theme-wipe-light')
  }, 320)
}

export function resolveUiTheme(
  setting: 'dark' | 'light' | 'system' | undefined,
): 'dark' | 'light' {
  if (setting === 'light') return 'light'
  if (setting === 'dark') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}
