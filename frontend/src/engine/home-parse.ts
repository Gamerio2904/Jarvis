export type HomeIntent =
  | { kind: 'when_home'; task: string }
  | { kind: 'im_home' }

export function parseHomeIntent(text: string): HomeIntent | null {
  const t = text.trim()
  if (!t || t.length > 160) return null
  if (/^ich\s+bin\s+(?:jetzt\s+)?(?:zuhause|zu\s*hause|heim)\s*[.!]?\s*$/i.test(t)) {
    return { kind: 'im_home' }
  }
  const m =
    /^\s*wenn\s+ich\s+(?:zuhause|zu\s*hause|heim)\s+bin\s*[,:]?\s*(.+?)\s*$/i.exec(t)
  if (!m) return null
  const task = m[1].replace(/[.!?]+$/g, '').trim()
  if (!task || task.length < 2) return null
  return { kind: 'when_home', task }
}
