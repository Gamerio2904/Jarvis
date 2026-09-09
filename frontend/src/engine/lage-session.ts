const KEY = 'jarvis_lage_session'

/** Phone Lage is session-only so cold start always returns to Chat. */
export function lageSessionActive(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setLageSession(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(KEY, '1')
    else sessionStorage.removeItem(KEY)
  } catch {
    /* node tests */
  }
}
