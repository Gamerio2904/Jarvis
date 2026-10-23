import { gazetteerHit } from './globe-geo.ts'

const TOOLISH =
  /\b(wecker|weck|timer|termin|kalender|erinner|todo|aufgabe|wetterstatistik|wetter|tv|fernseh|lautstärke|sender|note|notiz|suche|schau(en)?\s+nach|was\s+steht|fahr|fahrmodus|spiel|spotify|navigier|route|wohnt|einkauf|liste|los|zuhause|geburtstag|foto|auge|ruf|tel|ventilator|lüfter|tanke|tanken|tankstelle|standort|nachrichten?|steckdose|unwetter|ferien|dollar|euro|kurs|bundesliga|iss|mond|schach|dwd|lage|traceroute|tracert|statistik|sprachnotiz|zusammenfassen|bar|kneipe|pub|taxi|uber|freenow|sprachnachricht|whatsapp|nachricht|sms|schreib|bestell(?:e)?|kauf(?:e)?|besorg(?:e)?|hol(?:e)?|e-?mail|email|kontakte|telefonbuch|adressbuch|antworte|körper|koerper|kugel|erde|weltkugel|grillen|gesetz|park|zeig|flieg|zoom|globus|london|paris|berlin|merk|merke|erstell|erstelle|bluetooth|wlan|taschenlampe)\b/i

const MEMORY_WRITE = /^(ich\s+heiße|merk\s+dir|ich\s+bin|ich\s+wohne|ich\s+mag|ich\s+trinke)/i

function partIsToolish(part: string): boolean {
  return TOOLISH.test(part) || /(?:^|\s)(?:merk(?:e)?\s*dir|erstell(?:e)?)\b/i.test(part)
}

const SPLIT = /\s+und\s+|\s+dann\s+|\s+danach\s+|\s*,\s+|(?<=[a-zäöüß])\.\s+(?=[A-ZÄÖÜ])/i

/** Tool-Sätze an und/dann/Komma. Memory-Sätze bleiben ganz. */
/** „…, achso und wir brauchen noch Milch“ ist ein zweiter Auftrag, auch in einer Frage. */
function peelSideJob(raw: string): string[] | null {
  const hit = /^([\s\S]+?)\s*,?\s*(?:achso|übrigens|ausserdem|außerdem)\s+und\s+(.+)$/i.exec(raw)
  if (!hit) return null
  const head = hit[1].trim().replace(/[,.\s]+$/g, '')
  const tail = hit[2].trim()
  if (head.length < 8 || tail.length < 8) return null
  return [head, tail]
}

export function splitIntents(text: string): string[] {
  const raw = text.trim()
  const peeled = peelSideJob(raw)
  if (peeled) return peeled
  if (!raw || MEMORY_WRITE.test(raw)) return [raw]
  if (/[?？]\s*$/.test(raw) || /^(?:was|wie|wer|wo|wann|warum|wieso|weshalb|welche[rsnm]?)\b/i.test(raw)) {
    return [raw]
  }
  if (/^\s*plan(?:e)?\s+das\s*:/i.test(raw)) return [raw]
  if (/^\s*entwirf(?:e)?\b/i.test(raw)) return [raw]
  if (/^\s*(?:zeig(?:e)?(?:\s+mir)?\s+)?(?:hast\s+du\s+)?(?:inspiration|animationen)\b/i.test(raw)) return [raw]
  if (/\sund\s/i.test(raw) && /(?:entfernen|entfern(?:e)?|lösch(?:en|e)?|streich(?:e)?)\s*[.!?]?$/i.test(raw)) {
    return [raw]
  }
  if (!SPLIT.test(raw)) return [raw]
  const splitParts = raw.split(SPLIT).map((p) => p.trim()).filter(Boolean)
  if (splitParts.length < 2 || splitParts.length > 5) return [raw]
  // Zeit- und Ortsangaben nach dem Komma sind Fortsetzung, kein zweiter Befehl:
  // „Termin für den 5.9., 15:00 Uhr Zahnarzt“ bleibt EIN Satz.
  const CONTINUATION = /^\d{1,2}[:.]\d{2}(?:\s*uhr)?|^um\s+\d{1,2}(?::\d{2})?\s*(?:uhr)?/i
  const parts: string[] = []
  for (const p of splitParts) {
    if (parts.length && CONTINUATION.test(p)) parts[parts.length - 1] = `${parts[parts.length - 1]}, ${p}`
    else parts.push(p)
  }
  if (parts.length < 2) return [raw]
  // I4/P2: Ein erkannter Werkzeug-Teil genügt — „kauf Milch und ruf Mama an“
  // wird geteilt und beide Hälften laufen ihren eigenen Weg. Vorher musste
  // JEDE Hälfte werkzeugverdächtig sein, sonst fiel der ganze Satz ans Modell
  // und nichts passierte.
  if (parts.some(partIsToolish)) return parts
  return [raw]
}

/** Nach Split: nacktes „London“ wird Zeig London, allein bleibt Smalltalk. */
export function promoteSplitPart(part: string): string {
  const t = part.trim()
  if (!t) return t
  if (/^(?:zeig|flieg|zoom|wo\s+liegt|wo\s+ist)\b/i.test(t)) return t
  const hit = gazetteerHit(t)
  return hit ? `Zeig ${hit.name}` : t
}
