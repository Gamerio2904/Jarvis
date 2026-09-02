import { normalizeUtterance } from './utterance.ts'
import type { SettingsTopic } from './settings-ia.ts'

export type AppIntent =
  | { kind: 'settings'; topic: SettingsTopic }
  | { kind: 'voice' }
  | { kind: 'theme'; accent: 'amber' | 'green' }

const TOPIC_WORD: Array<{ re: RegExp; topic: SettingsTopic }> = [
  { re: /\b(debug|tests?)\b/i, topic: 'debug' },
  { re: /\bprobe\b/i, topic: 'probe' },
  { re: /\bged[aä]chtnis\b/i, topic: 'gedaechtnis' },
  { re: /\b(gemini|groq|cloud|key)\b/i, topic: 'cloud' },
  { re: /\b(fernseh|\btv\b)\b/i, topic: 'tv' },
  { re: /\b(haus|steckdose|ventilator)\b/i, topic: 'haus' },
  { re: /\b(musik|spotify)\b/i, topic: 'musik' },
  { re: /\b(forschung|research|suche)\b/i, topic: 'forschung' },
  { re: /\b(pc|windows)\b/i, topic: 'pc' },
  { re: /\b(wecker|timer)\b/i, topic: 'wecker' },
  { re: /\b(ort|gps|wetter)\b/i, topic: 'ort' },
  { re: /\b(weltlage|ausblick)\b/i, topic: 'weltlage' },
  { re: /\b(hausstand|export|import)\b/i, topic: 'hausstand' },
  { re: /\b(sprache|wake|mikro)\b/i, topic: 'sprache' },
  { re: /\b(ton|sound)\b/i, topic: 'ton' },
  { re: /\b(modell|0,?5b)\b/i, topic: 'modell' },
]

function topicFrom(t: string): SettingsTopic {
  for (const row of TOPIC_WORD) {
    if (row.re.test(t)) return row.topic
  }
  return 'allgemein'
}

/** Interne App-Flächen. Kein Fake-Klick, kein WLAN/TV-Gerät. */
export function parseAppIntent(text: string): AppIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 80) return null
  if (/\b(wlan|wifi|bluetooth|nicht\s+st[oö]ren)\b/i.test(t)) return null
  if (/^\s*(?:was\s+weißt\s+du|was\s+hast\s+du\s+dir|erinnerst\s+du\s+dich)\b/i.test(t)) return null
  if (/\bdann\b/i.test(t)) return null

  if (
    /^\s*(?:sprachmodus|jarvis\s+h[oö]ren)\s*[.!?]*$/i.test(t) ||
    /^\s*(?:[oö]ffne|zeig(?:e)?|start(?:e)?)\s+(?:den\s+)?sprachmodus\s*[.!?]*$/i.test(t) ||
    /^\s*(?:[oö]ffne|start(?:e)?)\s+(?:die\s+)?stimme\s*[.!?]*$/i.test(t)
  ) {
    return { kind: 'voice' }
  }

  if (
    /^\s*(?:orange|amber)[- ]?(?:akzent|theme|thema|lage)\s*(?:an)?\s*[.!?]*$/i.test(t) ||
    /^\s*(?:theme|thema)\s+(?:orange|amber)\s*[.!?]*$/i.test(t)
  ) {
    return { kind: 'theme', accent: 'amber' }
  }
  if (
    /^\s*(?:gr[uü]n(?:er)?[- ]?(?:akzent|theme|thema|lage)|theme\s+gr[uü]n)\s*(?:an|aus)?\s*[.!?]*$/i.test(t) ||
    /^\s*(?:orange|amber)[- ]?(?:akzent|theme)\s+aus\s*[.!?]*$/i.test(t)
  ) {
    return { kind: 'theme', accent: 'green' }
  }

  if (
    /^\s*(?:[oö]ffne|zeig(?:e)?)\s+(?:das\s+)?(?:debug|tests?)\s*[.!?]*$/i.test(t) ||
    /^\s*debug(?:[- ]panel)?\s*[.!?]*$/i.test(t)
  ) {
    return { kind: 'settings', topic: 'debug' }
  }

  if (
    /^\s*(?:[oö]ffne|zeig(?:e)?)\s+(?:die\s+)?probe(?:\s+v[1-9])?\s*[.!?]*$/i.test(t) ||
    /^\s*probe(?:\s+v[1-9])?\s*[.!?]*$/i.test(t)
  ) {
    return { kind: 'settings', topic: 'probe' }
  }

  if (
    /^\s*(?:[oö]ffne|zeig(?:e)?)\s+(?:das\s+)?ged[aä]chtnis\s*[.!?]*$/i.test(t) ||
    /^\s*ged[aä]chtnis\s+(?:anzeigen|zeigen|[oö]ffnen)\s*[.!?]*$/i.test(t)
  ) {
    return { kind: 'settings', topic: 'gedaechtnis' }
  }

  if (
    /^\s*(?:[oö]ffne|zeig(?:e)?)\s+(?:die\s+)?einstellungen(?:\s+(.+))?\s*[.!?]*$/i.test(t) ||
    /^\s*einstellungen(?:\s+(.+))?\s*[.!?]*$/i.test(t) ||
    /^\s*settings(?:\s+(.+))?\s*[.!?]*$/i.test(t)
  ) {
    return { kind: 'settings', topic: topicFrom(t) }
  }

  return null
}
