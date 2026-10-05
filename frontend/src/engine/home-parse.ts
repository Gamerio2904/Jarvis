export type HomeIntent =
  | { kind: 'when_home'; task: string; address?: string; radiusM?: number }
  | { kind: 'im_home' }

function cleanTask(raw: string): string {
  return raw
    .replace(/[.!?]+$/g, '')
    .replace(/^(?:dann\s+)?(?:erinnere?\s+mich\s+an\s+|an\s+)/i, '')
    .trim()
}

export function parseHomeIntent(text: string): HomeIntent | null {
  const t = text.trim()
  if (!t || t.length > 220) return null
  if (/^ich\s+bin\s+(?:jetzt\s+)?(?:zuhause|zu\s*hause|heim)\s*[.!]?\s*$/i.test(t)) {
    return { kind: 'im_home' }
  }
  const geo =
    /^\s*wenn\s+(?:ich|du|sie)\s+.{0,60}?(?:umkreis|radius|meter).{0,40}?(?:haus|zuhause|wohnung)\s+(.+?)\s+(?:bin|bist|sind)\s*[,:]?\s*(.+)\s*$/i.exec(
      t,
    ) ||
    /^\s*wenn\s+(?:ich|du|sie)\s+(?:bei|an|in)\s+(?:meinem\s+|dem\s+)?(?:haus\s+)?(.+?)\s+(?:bin|bist|sind)\s*[,:]?\s*(.+)\s*$/i.exec(
      t,
    )
  if (geo) {
    const address = geo[1].replace(/^(?:in\s+|von\s+)/i, '').trim()
    const task = cleanTask(geo[2])
    if (address.length >= 3 && task.length >= 2) {
      const meters = /(\d{1,4})\s*meter/i.exec(t)
      const radiusM = meters ? Math.max(5, Math.min(2000, Number(meters[1]))) : undefined
      return { kind: 'when_home', task, address, radiusM }
    }
  }
  const m =
    /^\s*wenn\s+ich\s+(?:zuhause|zu\s*hause|heim)\s+bin\s*[,:]?\s*(.+?)\s*$/i.exec(t)
  if (!m) return null
  const task = cleanTask(m[1])
  if (!task || task.length < 2) return null
  return { kind: 'when_home', task }
}
