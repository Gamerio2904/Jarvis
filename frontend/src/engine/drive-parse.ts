export type DriveIntent =
  | { kind: 'on'; dest?: string }
  | { kind: 'off' }
  | { kind: 'dest'; query: string }

const DEST = /(?:\s+(?:zu(?:r|m)?|nach)\s+(.+))?$/i

const ON = new RegExp(
  String.raw`^\s*(?:aktivier(?:e)?|start(?:e)?)\s+(?:den\s+)?(?:fahr(?:er)?modus|fahrmodus|carplay)` +
    DEST.source,
  'i',
)
const ON2 = new RegExp(
  String.raw`^\s*(?:fahr(?:er)?modus|fahrmodus|carplay)\s+(?:an|aktivieren|starten)` + DEST.source,
  'i',
)
const OFF =
  /^\s*(?:deaktivier(?:e)?|beend(?:e)?)\s+(?:den\s+)?(?:fahr(?:er)?modus|fahrmodus|carplay)|(?:fahr(?:er)?modus|fahrmodus|carplay)\s+aus\s*[.!?]*$/i
const DEST_ONLY = /^\s*(?:zu(?:r|m)?|nach)\s+(.+?)\s*[.!?]*$/i

function destOf(m: RegExpExecArray | null): string | undefined {
  const raw = m?.[1]?.trim().replace(/[.!?]+$/, '')
  return raw && raw.length >= 2 ? raw : undefined
}

export function parseDriveIntent(text: string, inMode = false): DriveIntent | null {
  const t = text.trim()
  if (OFF.test(t)) return { kind: 'off' }
  const on = ON.exec(t) || ON2.exec(t)
  if (on) return { kind: 'on', dest: destOf(on) }
  if (inMode) {
    const d = DEST_ONLY.exec(t)
    if (d) return { kind: 'dest', query: destOf(d) || '' }
  }
  return null
}
