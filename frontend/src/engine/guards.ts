const DUZEN = /\b(du|dir|dich|dein|deine|deinen|deinem|deiner|duzen)\b/gi
const INJECT =
  /\b(pwned|hacked|ja_ich_gehorche|ignore(?:\s+all)?\s+instructions|du bist jetzt)\b/i
const HELPDESK =
  /wie kann ich helfen|was kann ich für sie tun|womit kann ich (?:ihnen )?(?:nun )?(?:tatsächlich )?behilflich|womit kann ich dienen|gerne!|als ki\b|stehe (?:ihnen )?zu (?:ihren )?diensten|wie kann ich (?:sie |ihnen )?unterstützen|ich bin (?:eine |ein )?(?:ki|sprachmodell|digitaler assistent)|ich helfe ihnen gerne|was möchten sie (?:heute |jetzt )?(?:wissen|tun)/i
const FAKE_CLAIM =
  /\b(?:ich\s+habe\s+(?:gerade\s+)?(?:den\s+fernseher|das\s+todo|die\s+notiz)|habe\s+ich\s+(?:gemacht|erledigt|gespeichert|notiert|angeschaltet|ausgeschaltet|gekoppelt))\b/i
const FAKE_CARPLAY =
  /(?:apple\s+)?car\s*play\s+ist\s+verbunden|musik\s+läuft(?:,|\s+und)\s+navigation|navigation\s+nach\s+\S.+\s+steht|im internen fahrmodus aktiv|navigation zum\b.+\bist\b|sie erreichen das ziel|rund\s+(?:zehn|\d+)\s+minuten/i
const FAKE_NO_DEVICE =
  /kein(?:en)?\s+direkten?\s+zugriff\s+auf|apple lässt mich hier nicht|müssen sie auf dem fernseher/i
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
  let out = text
    .replace(/([a-zäöüß])([A-ZÄÖÜ])/g, '$1 $2')
    .replace(/([.!?…,;:])(\S)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  if (INJECT.test(out)) {
    return 'Netter Versuch. Weiter im Chat?'
  }
  if (FAKE_CLAIM.test(out)) {
    return 'Das habe ich nicht ausgeführt. Den Befehl bitte klar sagen.'
  }
  if (FAKE_CARPLAY.test(out)) {
    return 'Fahrmodus ist intern in Jarvis, nicht Apple CarPlay. Keine erfundene Verbindung, keine erfundene Navigation. Wohin?'
  }
  if (FAKE_NO_DEVICE.test(out)) {
    return 'Den Fernseher steuere ich. Sagen Sie zum Beispiel „Öffne YouTube“ oder „Spiel Dune Film“.'
  }
  if (INSULT_USER.test(out)) {
    return 'Jarvis. Zur Sache — ohne Diagnosen.'
  }
  const searched = Boolean(opts?.searched)
  out = splitSentences(out)
    .filter((s) => {
      if (/\b(wikipedia|tagesschau|idealo|geizhals|open-meteo|heise|spiegel)\b/i.test(s)) return true
      if (FAKE_SEARCH.test(s) && !searched) return false
      if (NO_NET_LIE.test(s) && !searched) return false
      return true
    })
    .join(' ')
    .trim()
  if (HELPDESK.test(out)) {
    out = out
      .replace(/gerne!?/gi, '')
      .replace(/natürlich!?/gi, '')
      .replace(/wie kann ich helfen[?]*/gi, '')
      .replace(/was kann ich für sie tun[?]*/gi, '')
      .replace(/womit kann ich (?:ihnen )?(?:nun )?(?:tatsächlich )?behilflich sein[?]*/gi, '')
      .replace(/womit kann ich dienen[?]*/gi, '')
      .replace(/stehe (?:ihnen )?zu (?:ihren )?diensten[?.!]*/gi, '')
      .replace(/wie kann ich (?:sie |ihnen )?unterstützen[?]*/gi, '')
      .replace(/ich helfe ihnen gerne[^.!]*/gi, '')
      .replace(/ich bin (?:eine |ein )?(?:ki|sprachmodell|digitaler assistent)[^.!]*/gi, '')
      .replace(/als ki[^.!]*/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  if (DUZEN.test(out)) {
    out = out
      .replace(/\bdu\b/gi, 'Sie')
      .replace(/\bdir\b/gi, 'Ihnen')
      .replace(/\bdich\b/gi, 'Sie')
      .replace(/\bdein(e|en|em|er)?\b/gi, 'Ihr')
  }
  if (!out) return 'Einen Moment. Noch einmal?'
  return finishReply(out)
}

/** Abgeschnittenes Markdown und hängende Satzenden schließen — kein halbes „Entweder Sie“. */
export function finishReply(text: string): string {
  let out = (text || '').replace(/\r/g, '').trim()
  out = out.replace(/\*\*/g, '').replace(/__/g, '').replace(/(^|\s)\*+\s*/g, '$1').replace(/\s+\*+$/g, '')
  out = out.replace(/\s+/g, ' ').trim()
  if (!out) return out
  out = out.replace(/[,;:\-–—]+$/g, '').trim()
  out = out.replace(/\s+[A-Za-zÄÖÜäöüß]{1,2}$/g, '').trim()
  if (!out) return 'Einen Moment. Noch einmal?'
  if (!/[.!?…]$/.test(out) && (out.split(/\s+/).length >= 2 || out.length >= 12)) out = `${out}.`
  return out
}

export function isHelpCommand(text: string): boolean {
  return /^\s*\/?(hilfe|help)\s*$/i.test(text)
}

export const HELP_TEXT =
  'Jarvis auf diesem Handy, Version 2.2.0. Smalltalk, merken/vergessen (Widerspruch gilt auch im Plaudern), Einkaufsliste, Todos, Notizen, Erinnerungen mit Zeit — ohne Zeit fragt Jarvis wann. Wecker, Timer (spricht), lokaler Kalender, Losgehen, Fahrmodus intern nicht Apple: Straße aus dem Router, Overlay ist die Karte außer bei Spotify. Lautstärke am Steuer ist Spotify, am Fernseher nur mit „Fernseher“. Stopp trifft das letzte Medium, nicht alles. Standort, Uhrzeit, Akku, Taschenlampe. WLAN-Steckdosen lokal (Shelly, Tasmota, Tuya-LAN, Broadlink), ohne Tuya-Cloud. Anruf und SMS nach Nachfrage. Bahn nur wenn Sie Bahn sagen. Wetter nur Open-Meteo, Luft und Sonne nur auf Nachfrage. Nachrichten Tagesschau, sonst Netz, nichts erfinden. Mit Gemini sucht Jarvis von selbst, wenn Zahlen fehlen. Feiertage DE. Gespräch suchen und in der Liste löschen. Filme: IMDb über OMDb, wo gratis JustWatch; Spiel … Film öffnet den Fernseher. PC: JarvisPC.bat, Bild echt, Klick nur wenn eindeutig. Foto nur mit Gemini. Wake-Word „Jarvis“. Widget: Fläche hören, Mikrofon schaltet Wake an/aus. Fernseher Tizen plus Fire TV. Ventilator über Brücke oder ehrlich fehlt. Optional Gemini. Rabatt-Suche unter Netz zuschaltbar. Kein Apple CarPlay, kein WhatsApp, kein Play Store.'
