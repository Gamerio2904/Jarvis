export type SpeakerIntent =
  | { kind: 'who' }
  | { kind: 'iam'; name: string }
  | { kind: 'forget' }

const WHO =
  /^\s*(?:wer\s+spricht(?:\s+gerade)?|welche\s+stimme|erkennst\s+du\s+(?:meine\s+)?stimme|wer\s+redet)\s*[.?!]?\s*$/i
const IAM =
  /^\s*(?:ich\s+bin|hier\s+ist|hier\s+spricht|am\s+apparat(?:\s+ist)?)\s+([A-ZÄÖÜ][\wÄÖÜäöüß.-]{1,40})\s*[.!]?\s*$/i
const FORGET = /^\s*(?:stimme\s+vergessen|sprecher\s+vergessen|nicht\s+mehr\s+ich)\s*[.!]?\s*$/i

export function parseSpeakerIntent(text: string): SpeakerIntent | null {
  const t = text.trim()
  if (!t || t.length > 80) return null
  if (WHO.test(t)) return { kind: 'who' }
  if (FORGET.test(t)) return { kind: 'forget' }
  const iam = IAM.exec(t)
  if (iam?.[1]) return { kind: 'iam', name: iam[1].trim() }
  return null
}
