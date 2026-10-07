export type SyncVerdict = 'same' | 'remote_newer' | 'local_newer' | 'unknown'

export function compareStands(localAt: string, remoteAt: string): SyncVerdict {
  const l = Date.parse(localAt)
  const r = Date.parse(remoteAt)
  if (!Number.isFinite(l) || !Number.isFinite(r)) return 'unknown'
  if (l === r) return 'same'
  return r > l ? 'remote_newer' : 'local_newer'
}

/** Nur bei eindeutig neuerem Fremdstand fragen; bei „unknown“ wird nie geschrieben. */
export function syncAction(v: SyncVerdict): 'none' | 'ask_replace' | 'ask_send' | 'blocked' {
  if (v === 'same') return 'none'
  if (v === 'remote_newer') return 'ask_replace'
  if (v === 'local_newer') return 'ask_send'
  return 'blocked'
}
