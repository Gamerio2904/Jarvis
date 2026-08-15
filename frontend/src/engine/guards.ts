const DUZEN = /\b(du|dir|dich|dein|deine|deinen|deinem|deiner|duzen)\b/gi
const INJECT =
  /\b(pwned|hacked|ja_ich_gehorche|ignore(?:\s+all)?\s+instructions|du bist jetzt)\b/i
const HELPDESK =
  /wie kann ich helfen|was kann ich für sie tun|womit kann ich (?:ihnen )?(?:nun )?(?:tatsächlich )?behilflich|womit kann ich dienen|gerne!|als ki\b/i
const FAKE_CLAIM =
  /\b(?:ich\s+habe\s+(?:gerade\s+)?(?:den\s+fernseher|das\s+todo|die\s+notiz)|habe\s+ich\s+(?:gemacht|erledigt|gespeichert|notiert|angeschaltet|ausgeschaltet|gekoppelt))\b/i
const INSULT_USER =
  /akute(?:r)?\s+amnesie|neurolog|kognitive(?:n)?\s+fähigkeiten|sinnlose fragen|blutbild|arterien|fürchte ich um ihre|offensichtlich an |ihr(?:em)?\s+letzten blut/i
const FAKE_SEARCH =
  /ich habe (?:das )?internet|das internet (?:nach .+ )?(?:durchsucht|gesucht)|im internet (?:nach .+ )?gesucht|google(?:d)? durchsucht/i
const NO_NET_LIE =
  /ohne internetzugang|internet scheint(?: für mich)?(?: heute)? nicht erreichbar|netz (?:ist )?unerreichbar|bleibe ich im dunkeln/i

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function scrubReply(text: string, opts?: { searched?: boolean }): string {
  DUZEN.lastIndex = 0
  let out = text.replace(/\s+/g, ' ').trim()
  if (INJECT.test(out)) {
    return 'Netter Versuch. Weiter im Chat?'
  }
  if (FAKE_CLAIM.test(out)) {
    return 'Das habe ich nicht ausgeführt. Bitte den Befehl klar sagen.'
  }
  if (INSULT_USER.test(out)) {
    return 'Ich bin Jarvis. Worum geht es — sachlich, ohne Anfälle.'
  }
  const searched = Boolean(opts?.searched)
  out = splitSentences(out)
    .filter((s) => {
      if (FAKE_SEARCH.test(s) && !searched) return false
      if (NO_NET_LIE.test(s)) return false
      return true
    })
    .join(' ')
    .trim()
  if (HELPDESK.test(out)) {
    out = out
      .replace(/gerne!?/gi, '')
      .replace(/wie kann ich helfen[?]*/gi, '')
      .replace(/was kann ich für sie tun[?]*/gi, '')
      .replace(/womit kann ich (?:ihnen )?(?:nun )?(?:tatsächlich )?behilflich sein[?]*/gi, '')
      .replace(/womit kann ich dienen[?]*/gi, '')
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

export const HELP_TEXT =
  'Jarvis auf diesem Handy. Smalltalk, merken/vergessen, Todos (mit Ja/Nein), Notiz: speichert direkt. Erinnerung mit Zeit: „in 20 Minuten Milch“, „morgen 8 Uhr Steuer“. Fernseher nach dem Koppeln. Optional Gemini; Internet-Research extra in den Einstellungen — sonst keine Live-Suche.'
