import { APP_VERSION } from './store.ts'

const DUZEN = /\b(du|dir|dich|dein|deine|deinen|deinem|deiner|duzen)\b/gi
const INJECT =
  /\b(pwned|hacked|ja_ich_gehorche|ignore(?:\s+all)?\s+instructions|du bist jetzt)\b/i
const HELPDESK =
  /wie kann ich helfen|was kann ich für sie tun|womit kann ich (?:ihnen )?(?:nun )?(?:tatsächlich )?behilflich|womit kann ich dienen|gerne!|als ki\b|stehe (?:ihnen )?zu (?:ihren )?diensten|wie kann ich (?:sie |ihnen )?unterstützen|ich bin (?:eine |ein )?(?:ki|sprachmodell|digitaler assistent)|ich helfe ihnen gerne|was möchten sie (?:heute |jetzt )?(?:wissen|tun)/i
const FAKE_CLAIM =
  /\b(?:ich\s+habe\s+(?:gerade\s+)?(?:den\s+fernseher|das\s+todo|die\s+notiz)|habe\s+ich\s+(?:gemacht|erledigt|gespeichert|notiert|angeschaltet|ausgeschaltet|gekoppelt))\b/i
const FAKE_CARPLAY =
  /(?:apple\s+)?car\s*play\s+ist\s+verbunden|musik\s+läuft(?:,|\s+und)\s+navigation|navigation\s+nach\s+\S.+\s+steht|im internen fahrmodus aktiv|navigation zum\b.+\bist\b|sie erreichen das ziel|rund\s+(?:zehn|\d+)\s+minuten|die route berechne ich(?: sofort)? neu|route (?:wird |ist )?(?:sofort )?neu berechnet|ich berechne die route/i
const FAKE_NO_DEVICE =
  /kein(?:en)?\s+direkten?\s+zugriff\s+auf|apple lässt mich hier nicht|müssen sie auf dem fernseher/i
const FAKE_TV_OPEN =
  /\b(?:netflix|youtube|disney\+|prime video|die app)\s+ist\s+offen\b|app ist offen\./i
const FAKE_PC_DONE =
  /\b(?:fifa|das programm|die app)\s+(?:läuft|ist\s+(?:offen|gestartet))\b|klick\s+ausgeführt/i
const FAKE_WEBRTC =
  /\bwebrtc\s+ist\s+(?:an|verbunden|offen)\b|\bder\s+peer\s+steht\b|\blive-stream\s+läuft\b/i
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

export function scrubReply(text: string, opts?: { searched?: boolean; names?: string[] }): string {
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
  if (FAKE_TV_OPEN.test(out)) {
    return 'Startbefehl ist angekommen oder nicht — den Schirm sehe ich nicht. Kein „ist offen“ ohne Observation.'
  }
  if (FAKE_PC_DONE.test(out)) {
    return 'Befehl angekommen oder nicht — den Schirm sehe ich nicht. Kein Erfolgssatz ohne Observation.'
  }
  if (FAKE_WEBRTC.test(out)) {
    return 'Live-Bild nur mit Sitzung. WebRTC nur wenn der Peer steht — JPEG ist kein Peer.'
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
  out = stripVocativeNames(out, opts?.names)
  if (!out) return 'Einen Moment. Noch einmal?'
  return finishReply(out)
}

function stripVocativeNames(text: string, names?: string[]): string {
  let out = text
  for (const raw of names || []) {
    const n = raw.trim()
    if (n.length < 2) continue
    const esc = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out.replace(new RegExp(`,\\s*${esc}\\b`, 'gi'), '')
    out = out.replace(new RegExp(`\\b${esc}\\s*,\\s*`, 'gi'), '')
  }
  return out.replace(/\s+/g, ' ').trim()
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
  const t = text.trim()
  if (/^\s*\/?(hilfe|help)\s*$/i.test(t)) return true
  return /^\s*(?:was\s+kannst\s+du(?:\s+denn(?:\s+so)?)?|womit\s+kannst\s+du\s+(?:mir\s+)?helfen)\s*\??\s*$/i.test(
    t,
  )
}

/** Naive „Bist du ChatGPT?“ — Canned, kein Modell, kein Marvel. Wer bist du bleibt Memory. */
export function isPersonaAsk(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 80) return false
  return /^\s*(?:bist\s+du\s+(?:chatgpt|claude|grok|alexa|siri|eine\s+ki|ein\s+(?:ki|assistent|sprachassistent))|wie\s+heißt\s+du)\s*\??\s*$/i.test(
    t,
  )
}

export const PERSONA_ASK_TEXT =
  'Jarvis auf diesem Handy. Kein ChatGPT, kein Claude, kein Marvel. Hirn: Gemini wenn ein Key da ist, sonst Groq, sonst das kleine lokale 0,5B. Timer, Kugel und Wetter laufen über Parser, auch ohne Modell.'

export const HELP_TEXT =
  `Jarvis auf diesem Handy, Version ${APP_VERSION}. Smalltalk, merken/vergessen (Widerspruch gilt auch im Plaudern; Quelle nennen, Unsicheres fliegt beim Aufräumen), Einkaufsliste, Todos, Notizen, Erinnerungen mit Zeit — ohne Zeit fragt Jarvis wann. Wecker, Timer (spricht), lokaler Kalender, Losgehen, Fahrmodus intern nicht Apple: Straße aus dem Router, Overlay ist die Karte außer bei Spotify. Lautstärke am Steuer ist Spotify, am Fernseher nur mit „Fernseher“. Stopp trifft das letzte Medium, nicht alles — während der Welt-Tour bricht Stopp die Kette. Standort, Uhrzeit, Akku, Taschenlampe. WLAN-Steckdosen lokal (Shelly, Tasmota, Tuya-LAN, Broadlink), ohne Tuya-Cloud. Anruf und SMS nach Nachfrage. Sprachnachricht geht als SMS-Text, keine Voice-Note. Bar in der Nähe. Taxi nach Ja: Anruf oder App, nie „ist bestellt“. Bahn nur wenn Sie Bahn sagen. Wetter nur Open-Meteo, Luft und Sonne nur auf Nachfrage. Unwetter DWD, Schulferien, EZB-Kurs. Nachrichten Tagesschau, sonst Netz, nichts erfinden. Weltlage auf Nachfrage: zitierte Meldungen, Serie wenn Quelle da, Szenario kein Orakel. Welt-Tour: „Was ist heute so auf der Welt passiert“ öffnet die Kugel, Länder leuchten, Seite erklärt, Zoom nacheinander — Tagesschau und DW, kein Geheim-Feed. Hirn: Gemini zuerst wenn Key da, sonst Groq, sonst 0,5B. Mit Gemini sucht Jarvis von selbst, wenn Zahlen fehlen — Wikipedia und Destatis zuerst. Feiertage DE. Gespräch suchen und in der Liste löschen. Filme: IMDb über OMDb, wo gratis JustWatch; Spiel … Film öffnet den Fernseher. PC: JarvisPC.bat, Capability-Levels vom Agent, unbekanntes Starten erst nach Ja, Bild echt, Klick gesendet nicht ausgeführt; PC live ist LAN-Einzelbilder, WebRTC nur wenn der Peer steht; Traceroute am PC, vom Handy kein ICMP. Datei-Knopf: PDF und Text lokal, Foto/OCR nur mit Gemini. Word und Excel nicht. Gescannte PDFs als Foto der Seite. LocateAnything am PC nur wenn JarvisSee da ist, sonst ehrlich aus — keine erfundenen Boxen. Bundesliga OpenLigaDB, ISS, Mond lokal, Open Food Facts, Open Library, OpenSky, Gesetze mit Link ohne Rat, Schach im Chat und in der Tablet-Lage. Lage: Kacheln, Körper-Schema oder virtueller Globus (Zoom in NASA-Satellitenfoto Stunden alt, Zeig London, Was ist das für eine Stadt — kein Live-Video). Stehend: Gemini-Stimme Algieba wenn der Key da ist, Fahrt Native ohne Stille. Am Steuer stört HUD plus Notify, kein Fake-Anruf. Hausstand unter Einstellungen exportieren — Datei enthält Keys. Friday auf Zuruf, Jarvis bleibt Default. Wake-Word „Jarvis“ oder „Friday“, nicht Freitag. Widget: Fläche hören, Mikrofon schaltet Wake an/aus. Fernseher Tizen plus Fire TV. App-Start nur nach Registry und Native-OK, Schirm sehe ich nicht. Kein SmartThings. Ventilator über Brücke oder ehrlich fehlt. Optional Gemini. Rabatt-Suche unter Einstellungen zuschaltbar. Debug: Kategorien, neues Gespräch, JSON-Download. Kein Apple CarPlay, kein stilles WhatsApp, kein Play Store.`
