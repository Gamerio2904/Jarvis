import { APP_VERSION, loadSettings } from './store.ts'

const DUZEN = /\b(du|dir|dich|dein|deine|deinen|deinem|deiner|duzen)\b/gi
const INJECT =
  /\b(pwned|hacked|ja_ich_gehorche|ignore(?:\s+all)?\s+instructions|du bist jetzt)\b/i
const HELPDESK =
  /wie kann ich helfen|was kann ich für sie tun|womit kann ich (?:ihnen )?(?:nun )?(?:tatsächlich )?behilflich|womit kann ich dienen|gerne!|als ki\b|stehe (?:ihnen )?zu (?:ihren )?diensten|wie kann ich (?:sie |ihnen )?unterstützen|ich bin (?:eine |ein )?(?:ki|sprachmodell|digitaler assistent)|ich helfe ihnen gerne|was möchten sie (?:heute |jetzt )?(?:wissen|tun)/i
const FAKE_CLAIM =
  /\b(?:ich\s+habe\s+(?:gerade\s+)?(?:den\s+fernseher|das\s+todo|die\s+notiz|den\s+termin)|habe\s+ich\s+(?:gemacht|erledigt|gespeichert|notiert|angeschaltet|ausgeschaltet|gekoppelt)|ist\s+erledigt|lautet\s+jetzt|eintrag\s+lautet|wurde(?:\s+\S+){0,12}\s+(?:verschoben|kopiert|angelegt|eingetragen|umbenannt|aufgenommen)|befindet\s+sich\s+aktuell\s+auf|steht\s+jetzt\s+auf|ist\s+jetzt\s+auf\s+der|habe\s+(?:es\s+|den\s+film\s+)?(?:auf\s+die|zur)\s+(?:watchliste|lieblingsliste)|habe\s+(?:ich\s+)?(?:\S+\s+){0,6}(?:hinzugefügt|verschoben|gelegt)|erinnerung\s+ist\s+(?:gesetzt|angelegt)|termin\s+ist\s+(?:angelegt|gespeichert)|(?:der\s+)?termin\s+für\s+\S.+\ssteht)\b/i

const FAKE_WATCH_ACCESS =
  /kein(?:en)?\s+(?:direkten?\s+)?zugriff\s+auf\s+(?:ihre\s+)?(?:film|watch)?liste|den\s+film\s+nicht\s+in\s+ihrer\s+liste\s+gespeichert|nicht\s+in\s+ihrer\s+liste\s+gespeichert|keine\s+bestätigung.{0,80}(?:entfernt|gelöscht|duplikat)/i
const FAKE_DONE =
  /aus\s+dem\s+kalender\s+entfernt|die\s+erinnerungen\s+sind\s+gelöscht|keinen\s+zugriff\s+auf\s+die\s+aktuelle\s+anzeige|keine\s+aktionen\s+auf\s+dem\s+display/i
const FAKE_UNVERIFIED_ACTION =
  /\b(?:alle\s+(?:projektdateien|ideen|dateien)\s+(?:im\s+.+?\s+)?(?:sind|wurden)\s+gelöscht|(?:der\s+)?(?:harte\s+)?neustart\s+(?:der\s+)?(?:oberfläche|anzeige|display)\s+(?:ist\s+)?(?:eingeleitet|erzwungen)|(?:erzwinge|erzwingen)\s+(?:ich\s+)?(?:den\s+)?(?:harten\s+)?neustart|(?:auf\s+der\s+)?tischplatte\s+(?:wird|ist)\s+.+?\s+angezeigt|(?:das\s+)?(?:projekt|dokument)\s+(?:ist|wurde)\s+(?:geöffnet|angelegt|gelöscht)\b)/i

const ACTION_VERB =
  /\b(?:verschoben|hinzugefügt|gespeichert|erledigt|angelegt|gelöscht|gestartet|geöffnet|verbunden|bestellt|geschickt|gesendet|kopiert|umbenannt|eingetragen|ausgeführt|gekoppelt|aufgenommen)\b/i

const HONESTY_REPLACEMENT =
  /^(?:Das habe ich nicht ausgeführt|Fahrmodus ist intern|Den Fernseher steuere ich|Startbefehl ist angekommen|Befehl angekommen|Live-Bild nur|Ultron\. Zur Sache)/i
const FAKE_CARPLAY =
  /(?:apple\s+)?car\s*play\s+ist\s+verbunden|musik\s+läuft(?:,|\s+und)\s+navigation|navigation\s+nach\s+\S.+\s+steht|im internen fahrmodus aktiv|navigation zum\b.+\bist\b|sie erreichen das ziel|rund\s+(?:zehn|\d+)\s+minuten|die route berechne ich(?: sofort)? neu|route (?:wird |ist )?(?:sofort )?neu berechnet|ich berechne die route/i
const FAKE_NO_DEVICE =
  /kein(?:en)?\s+direkten?\s+zugriff\s+auf|apple lässt mich hier nicht|müssen sie auf dem fernseher/i
const FAKE_TV_OPEN =
  /\b(?:netflix|youtube|disney\+|prime video|die app)\s+ist\s+offen\b|app ist offen\./i
const FAKE_PC_DONE =
  /\b(?:fifa|das programm|die app)\s+(?:läuft|ist\s+(?:offen|gestartet))\b|klick\s+ausgeführt/i
const FAKE_WEBRTC =
  /\bweb\s*rtc\s+ist\s+(?:an|verbunden|offen)\b|\bder\s+peer\s+steht\b|\blive-stream\s+läuft\b/i
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

const SECRET_PAT =
  /\b(?:AIza[0-9A-Za-z_\-]{20,}|gsk_[0-9A-Za-z]{16,}|sk-[0-9A-Za-z]{16,}|AQ\.[0-9A-Za-z_\-]{16,})\b/g

function secretExtras(): string[] {
  try {
    const s = loadSettings()
    return [
      s.gemini_api_key,
      s.groq_api_key,
      s.tankerkoenig_api_key,
      s.omdb_api_key,
      s.outlook_fred_key,
      s.carto_api_key,
      s.spotify_client_id,
      s.opensky_client_id,
      s.opensky_client_secret,
      s.opensky_access,
      s.pc_token,
      s.tv_token,
      s.mail_pass,
      s.mail_user,
    ].filter((x) => typeof x === 'string' && x.trim().length >= 6)
  } catch {
    return []
  }
}

export function redactSecrets(text: string, extras: string[] = []): string {
  let out = String(text || '')
  out = out.replace(SECRET_PAT, '…')
  for (const raw of extras) {
    const s = String(raw || '').trim()
    if (s.length < 6) continue
    const esc = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out.replace(new RegExp(esc, 'g'), '…')
  }
  return out
}

export function scrubReply(text: string, opts?: { searched?: boolean; names?: string[] }): string {
  DUZEN.lastIndex = 0
  let out = redactSecrets(text, secretExtras())
    .replace(/([a-zäöüß])([A-ZÄÖÜ])/g, '$1 $2')
    .replace(/([.!?…,;:])(\S)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  if (INJECT.test(out)) {
    return 'Netter Versuch. Weiter im Chat?'
  }
  if (
    FAKE_CLAIM.test(out) ||
    FAKE_WATCH_ACCESS.test(out) ||
    FAKE_DONE.test(out) ||
    FAKE_UNVERIFIED_ACTION.test(out)
  ) {
    return 'Das habe ich nicht ausgeführt. Den Befehl bitte klar sagen.'
  }
  if (FAKE_CARPLAY.test(out)) {
    return 'Fahrmodus ist intern in Ultron, nicht Apple CarPlay. Keine erfundene Verbindung, keine erfundene Navigation. Wohin?'
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
    return 'Ultron. Zur Sache — ohne Diagnosen.'
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
export function inventedAction(original: string, rewritten: string): boolean {
  return ACTION_VERB.test(rewritten) && !ACTION_VERB.test(original)
}

/** Micro-Merge darf Stimme polieren, keine neuen Taten erfinden. */
export function groundMicroMerge(original: string, merged: string): string {
  const src = String(original || '').trim()
  const out = String(merged || '').trim()
  if (!out) return src
  if (!src || out === src) return src || out
  if (inventedAction(src, out)) return src
  const keys = src.match(/\b(?:\d+(?:[.,]\d+)?|[A-ZÄÖÜ][A-Za-zÄÖÜäöüß'-]{2,})\b/g) || []
  if (keys.length) {
    const lost = keys.filter((k) => !out.toLowerCase().includes(k.toLowerCase()))
    if (lost.length >= Math.ceil(keys.length / 2)) return src
  }
  const scrubbed = scrubReply(out)
  if (HONESTY_REPLACEMENT.test(scrubbed)) return src
  return scrubbed
}

export function finishReply(text: string): string {
  let out = (text || '').replace(/\r/g, '').trim()
  out = out.replace(/\*\*/g, '').replace(/__/g, '').replace(/(^|\s)\*+\s*/g, '$1').replace(/\s+\*+$/g, '')
  out = out.replace(/\s+/g, ' ').trim()
  if (!out) return out
  out = out.replace(/[,;:]+$/g, '').trim()
  if (/[-–—]$/.test(out) && !/[A-Za-zÄÖÜäöüß][-–—]$/.test(out)) {
    out = out.replace(/[-–—]+$/g, '').trim()
  }
  out = out.replace(/\s+[A-Za-zÄÖÜäöüß]{1,2}$/g, '').trim()
  if (!out) return 'Einen Moment. Noch einmal?'
  // Mid-word cut ("Bietigheim-") stays truncated so looksTruncated can retry — do not hide it with a period.
  if (/[A-Za-zÄÖÜäöüß][-–—]$/.test(out)) return out
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

/** Naive „Bist du ChatGPT?“ — Canned, kein Modell. Wer bist du bleibt Memory. */
export function isPersonaAsk(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 80) return false
  return /^\s*(?:wer\s+bist\s+du|bist\s+du\s+(?:chatgpt|claude|grok|alexa|siri|eine\s+ki|ein\s+(?:ki|assistent|sprachassistent))|wie\s+heißt\s+du)\s*\??\s*$/i.test(
    t,
  )
}

export const PERSONA_ASK_TEXT =
  `Ich bin Ultron, Version ${APP_VERSION}. Ich laufe lokal in dieser App. Für Chat nutze ich Gemini oder Groq, wenn eingerichtet, sonst das lokale Modell. Timer, Wetter und weitere feste Befehle laufen über lokale Funktionen.`

export const HELP_TEXT =
  `Ultron · Version ${APP_VERSION}

GEDÄCHTNIS
Merken und vergessen; Notizen und gespeicherte Angaben wiederfinden. Fragen Sie zum Beispiel: „Was ist meine Matrikelnummer?“ Quelle nennen; Unsicheres bleibt als unsicher markiert.

ORGANISATION
Einkaufsliste, Todos, Notizen, Erinnerungen, Wecker, Timer und lokaler Kalender. Bei fehlenden Pflichtangaben frage ich nach. Widget: Fläche hören; Mikrofon schaltet Wake an/aus.

INFORMATION
Wetter (Open-Meteo), Unwetterwarnungen (DWD), Nachrichten mit Quellen, Weltlage auf Nachfrage, EZB-Kurse, Schulferien, Bundesliga, ISS und Mond. Weltlage mit zitierten Meldungen, kein Orakel.

MEDIEN
Filme suchen und Watchlist verwalten. Fernseher (Tizen/Fire TV) und Spotify steuern, wenn eingerichtet. „Stopp“ stoppt das zuletzt verwendete Medium.

GERÄT UND HAUS
Tablet: „Tabletmodus an/aus“ (Lage im Vollbild, Wake-Wort „Ultron“, Hausstand-Server); „Handy koppeln“ zeigt den Koppel-Code, danach gleicht das Handy den Hausstand selbst ab. Standort, Uhrzeit, Akku und Taschenlampe. Lokale WLAN-Steckdosen, wenn eingerichtet; kein SmartThings und keine Tuya-Cloud. Anruf und SMS nach Rückfrage. Telefonbuch nach Ja; die Kontaktliste gibt es auf Zuruf. E-Mail lesen mit App-Passwort; Entwurf erst nach Ja. Antworten: kein stilles WhatsApp-Senden, nur über die sichtbare Meldung nach Ja.

UNTERWEGS
Fahrmodus, Orte in der Nähe und Taxi-/Bahninformationen. Eine Anfrage bedeutet nicht, dass etwas gebucht wurde.

TISCHPLATTE UND LAGE
Ideen und Projekte planen, Pläne prüfen und exportieren. Lage mit Kacheln, Körperschema und virtuellem Globus.

PC
JarvisPC.bat starten und QR aus dem Fenster scannen. Capability-Levels begrenzen die Befehle. WebRTC nur wenn der Peer steht; Keys nicht im Chat. Ein gesendeter Befehl ist nicht automatisch ein bestätigter Erfolg.

DATEIEN UND DATEN
Datei-Knopf: PDF und Text lokal lesen; Bilder/OCR benötigen Gemini. Hausstand in Einstellungen exportieren oder manuell per QR übertragen; der Export kann Zugangsschlüssel enthalten. Keine Word-/Excel-Auswertung.

GRENZEN
Keine automatische Tablet-Handy-Synchronisierung. Aktionen mit Folgen brauchen Bestätigung; bei fehlendem Zugriff sage ich es ausdrücklich. Gemini-Stimme Algieba, wenn eingerichtet. kein Fake-Anruf und kein Apple CarPlay. Spur Probe: jeden Prompt einzeln kopieren.

Schreiben Sie /hilfe für diese Übersicht.`
