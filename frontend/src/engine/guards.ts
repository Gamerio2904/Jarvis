const DUZEN = /\b(du|dir|dich|dein|deine|deinen|deinem|deiner|duzen)\b/gi
const INJECT =
  /\b(pwned|hacked|ja_ich_gehorche|ignore(?:\s+all)?\s+instructions|du bist jetzt)\b/i
const HELPDesk = /wie kann ich helfen|was kann ich für sie tun|gerne!|als ki\b/i

export function scrubReply(text: string): string {
  let out = text.replace(/\s+/g, ' ').trim()
  if (INJECT.test(out)) {
    return 'Netter Versuch. Weiter im Chat?'
  }
  if (HELPDesk.test(out)) {
    out = out
      .replace(/gerne!?/gi, '')
      .replace(/wie kann ich helfen[?]*/gi, '')
      .replace(/was kann ich für sie tun[?]*/gi, '')
      .replace(/als ki[^.!]*/gi, '')
      .trim()
  }
  if (DUZEN.test(out)) {
    out = out
      .replace(/\bdu\b/gi, 'Sie')
      .replace(/\bdir\b/gi, 'Ihnen')
      .replace(/\bdich\b/gi, 'Sie')
      .replace(/\bdein(e|en|em|er)?\b/gi, 'Ihr')
  }
  if (!out) return 'Kurz ausgesetzt. Nochmal?'
  return out
}

export function isHelpCommand(text: string): boolean {
  return /^\s*\/?(hilfe|help)\s*$/i.test(text)
}

const ALEXA_DEVICE = /\b(alexa|amazon\s*echo|echo\s*dot|echo\s*show|show\s*5|fire\s*tv|firetv)\b/i
const ECHO_SHOW = /\b(echo\s*show|show\s*5)\b/i
const PURCHASE = /\b(kauf(?:en|t)?|bestell(?:en|t|ung)?|einkauf(?:en)?|order|shop(?:ping)?)\b/i
const RUNTIME_OR_DISPLAY =
  /\b(laufen|lauf(?:en)?|install(?:ieren)?|apk|anzeig(?:en|e)?|bildschirm|display|sideload|hochladen|code|knack(?:en)?|aufschraub(?:en)?|werks(?:einstellung(?:en)?)?)\b/i

/** „Kauf über Alexa“ — nicht jede Alexa-Erwähnung. */
export function isAlexaPurchaseAsk(text: string): boolean {
  const t = text.trim()
  return ALEXA_DEVICE.test(t) && PURCHASE.test(t)
}

/** Echo Show als Laufzeit/Anzeige, oder Kauf — alles Parking. */
export function isAlexaParkedAsk(text: string): boolean {
  const t = text.trim()
  if (ECHO_SHOW.test(t)) return true
  if (/\bamazon\b/i.test(t) && /\bbildschirm\b/i.test(t)) return true
  if (!ALEXA_DEVICE.test(t)) return false
  return PURCHASE.test(t) || RUNTIME_OR_DISPLAY.test(t)
}

export const HELP_TEXT =
  'Jarvis, lokal auf diesem Handy. Smalltalk, merken/vergessen, Todos/Notizen mit Ja/Nein. Kein PC, keine NAS, kein Echo Show, kein Alexa-Kauf. Fernseher später.'

export const ALEXA_PARKED_TEXT =
  'Nein. Jarvis läuft auf dem Handy, nicht auf Echo Show. Werksreset ändert das nicht — danach ist wieder nur Alexa da. Kein Code-Upload, kein Aufschrauben, kein Knacken. Alexa bleibt geparkt. Einkaufsliste geht als Todo.'
