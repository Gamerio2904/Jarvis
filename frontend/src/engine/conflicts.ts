import type { Candidate, RouteCtx } from './route-types.ts'
import { gazetteerHit } from './globe-geo.ts'
import { parseWontIntent } from './wont-parse.ts'
import { parseDocIntent } from './doc-parse.ts'

function drop(cands: Candidate[], id: string): Candidate[] {
  return cands.filter((c) => c.id !== id)
}

function boost(cands: Candidate[], id: string, n: number): Candidate[] {
  return cands.map((c) => (c.id === id ? { ...c, score: Math.min(0.99, c.score + n) } : c))
}

function has(cands: Candidate[], id: string): boolean {
  return cands.some((c) => c.id === id)
}

/** Bekannte Überschneidungen — Daten, kein Cosine. */
export function applyConflicts(cands: Candidate[], text: string, ctx: RouteCtx): Candidate[] {
  const t = text.toLowerCase()
  let out = cands

  if (/\b(lauter|leiser|lautstärke)\b/.test(t) && !/\bfernseh|\btv\b/.test(t)) {
    if (ctx.lastMedium === 'spotify' || ctx.lastTool === 'drive' || ctx.inDrive) {
      out = drop(out, 'tv')
      out = boost(out, 'drive', 0.2)
    }
    if (ctx.lastMedium === 'tv' || ctx.lastTool === 'tv') {
      out = drop(out, 'drive')
      out = boost(out, 'tv', 0.2)
    }
  }

  if (/\b(was\s+steht|was\s+liegt|was\s+kommt\s+heute|guten\s+morgen)\b/.test(t) && !/\b(wetter|regen|schirm|temperatur)\b/.test(t)) {
    out = drop(out, 'weather')
    if (has(out, 'brief')) out = drop(out, 'calendar')
  }

  if (
    /\b(in\s+\d+\s+(?:minuten?|stunden?)|termin\b|wecker\b|timer\b)\b/.test(t) &&
    !/\b(wetter|regen|schirm|temperatur|anziehen)\b/.test(t)
  ) {
    out = drop(out, 'weather')
  }

  if (/\berinner/.test(t) && !/\b(termin|kalender)\b/.test(t)) {
    out = drop(out, 'calendar')
    out = drop(out, 'todo')
  }

  if (/\bfahr(?:e|en)?\s+mich\b/.test(t) && !/\b(tanke|tankstelle)\b/.test(t)) {
    out = drop(out, 'maps')
    out = drop(out, 'poi')
    out = boost(out, 'drive', 0.2)
  }

  if (/\b(tanke|tanken|tankstelle|e10)\b/.test(t)) {
    out = drop(out, 'poi')
    out = drop(out, 'drive')
    out = boost(out, 'fuel', 0.2)
  }

  if (/\b(wo\s+läuft|wo\s+laeuft|imdb|rotten\s*tomato)/.test(t)) {
    out = drop(out, 'tv')
    out = boost(out, 'film', 0.15)
  }

  if (/\b(fernseh|fire\s*tv|\bhdmi\b|tizen)\b/.test(t)) {
    out = drop(out, 'film')
    out = boost(out, 'tv', 0.12)
  }

  if (/^\s*kein(?:en?|e)?\s+.+\s+mehr\s*[.!]?\s*$/i.test(text)) {
    out = drop(out, 'shopping')
    out = drop(out, 'calendar')
    out = boost(out, 'memory', 0.25)
  }

  if (/\b(unwetter|dwd|unwetterwarnung)\b/.test(t)) {
    out = drop(out, 'weather')
    out = boost(out, 'warn', 0.2)
  }

  if (/\b(blitzer|baustelle|radarfalle)\b/.test(t)) {
    out = drop(out, 'warn')
    out = drop(out, 'drive')
    out = boost(out, 'blitzer', 0.22)
  }

  const amazonMusic =
    /\bamazon\s*(music|musik)\b/.test(t) ||
    (/\bamazon\b/.test(t) && /\b(spiel|musik)\b/.test(t) && !/\bprime\b/.test(t))
  if (amazonMusic) {
    out = drop(out, 'tv')
    out = drop(out, 'drive')
    out = boost(out, 'amazon', 0.2)
  }

  if (/\b(preiswache|instanudeln)\b/.test(t)) {
    out = drop(out, 'shopping')
    out = boost(out, 'watch-price', 0.2)
  }

  if (/\b(chat[- ]?ordner|leg(?:e)?\s+den\s+chat)\b/.test(t)) {
    out = drop(out, 'search')
    out = boost(out, 'chat-folder', 0.2)
  }

  if (
    /^\s*was\s+weißt\s+du\s+über\s+(?!mich\b)/.test(t) ||
    /^\s*wo\s+stand\s+das\s+mit\b/.test(t) ||
    (/^\s*erinnerst\s+du\s+dich\s+an\b/.test(t) && !/\ban\s+mich\b/.test(t))
  ) {
    out = drop(out, 'memory')
    out = drop(out, 'search')
    out = drop(out, 'maps')
    out = boost(out, 'recall', 0.22)
  }

  if (/\b(schulferien|ferien\s+in)\b/.test(t)) {
    out = drop(out, 'holiday')
    out = boost(out, 'ferien', 0.2)
  }

  if (/\b(dollar|euro|wechselkurs|frankfurter)\b/.test(t) && !/\b(wetter|tanke)\b/.test(t)) {
    out = drop(out, 'news')
    out = boost(out, 'fx', 0.2)
  }

  if (/\b(bundesliga|spielstand|wie\s+hat\s+(?:der|bayern|vfb))\b/.test(t)) {
    out = drop(out, 'news')
    out = boost(out, 'sport', 0.2)
  }

  if (ctx.lastTool === 'chess' && /^\s*(?:schach\s+)?[a-h][1-8][a-h][1-8]\s*$/i.test(text.trim())) {
    out = boost(out, 'chess', 0.3)
  }

  if (/\b(wetterstatistik|lage[- ]?kachel|\bkacheln?\b|tablet[- ]?lage)\b/.test(t) || /^\s*lage\s+(an|aus)\s*$/i.test(t)) {
    out = drop(out, 'weather')
    out = drop(out, 'brief')
    out = boost(out, 'hud', 0.25)
  }

  if (/^\s*guten\s+morgen\b/.test(t) && !/\b(wetter|regen|schirm|temperatur)\b/.test(t)) {
    out = drop(out, 'weather')
    out = drop(out, 'hud')
    if (has(out, 'brief')) out = drop(out, 'calendar')
  }

  if (/^\s*ruf(?:e)?\s+mich\b/.test(t)) {
    out = drop(out, 'maps')
    out = boost(out, 'reminder', 0.3)
  }

  if (/\b(traceroute|tracert|welche\s+route\s+nimmt|tracepath)\b/.test(t)) {
    out = drop(out, 'maps')
    out = drop(out, 'drive')
    out = drop(out, 'hud')
    out = boost(out, 'trace', 0.28)
  }

  if (/\b(zusammenfassen|sprachnotiz|gespräch\s+nachbereiten|fass(?:e)?\s+das\s+gespräch)\b/.test(t)) {
    out = drop(out, 'todo')
    out = boost(out, 'digest', 0.25)
  }

  if (
    /\bwas\s+du\s+über\s+mich\s+weißt\b/.test(t) ||
    /\bbasierend\s+auf\s+(?:dem\s+)?was\s+du\b/.test(t) ||
    (/\b(?:wo\s+wohne|wo\s+arbeite|was\s+trinke)\s+ich\b/.test(t) && /\b(?:zusammen|fass)\b/.test(t))
  ) {
    out = drop(out, 'memory')
    out = boost(out, 'recall', 0.28)
  }

  if (/\bmerk(?:e)?\s*dir\b/.test(t) && /\b(?:freitag|montag|dienstag|mittwoch|donnerstag|samstag|sonntag|zahnarzt|termin)\b/.test(t)) {
    out = drop(out, 'memory')
    out = drop(out, 'teach')
    out = boost(out, 'calendar', 0.25)
  }

  if (/\bfachwissen\b/.test(t) || /^\s*lern(?:e)?\s+das\b/.test(t) || /\bmerk(?:e)?\s*dir\s+als\s+fachwissen\b/.test(t)) {
    out = drop(out, 'memory')
    out = drop(out, 'fan')
    out = drop(out, 'recall')
    if (/\bvergiss\s+fachwissen\b/.test(t) || /\bwas\s+steht\s+bei\s+uns\b/.test(t) || /^\s*fachwissen\b/.test(t)) {
      out = boost(out, 'pack', 0.28)
      out = drop(out, 'teach')
    } else {
      out = boost(out, 'teach', 0.28)
    }
  }

  if (/\b(?:benzinpreis|spritpreis|e10)\b/.test(t) && !/\b(?:teurer|billiger|wird|ausblick|prognose|tanke)\b/.test(t)) {
    out = drop(out, 'outlook')
    out = drop(out, 'fuel')
  }

  if (
    /weltlage|lage\s+welt|ölpreis|rohöL|brent|\bwti\b|opec|hormus|hormuz/.test(t) ||
    (/\b(benzin|e10|sprit)\b/.test(t) && /\b(teurer|billiger|ausblick|prognose|wird)\b/.test(t)) ||
    (/(^|[^a-zäöüß])öl([^a-zäöüß]|$)/.test(t) && /\b(warum|teuer|steigt|fällt|preis|ausblick)\b/.test(t)) ||
    (/\b(dollar|euro)\b/.test(t) && /\b(fällt|steigt|ausblick|prognose|wird)\b/.test(t)) ||
    (/\b(aktie|aktien|dax)\b/.test(t) && /\b(fällt|steigt|morgen|kaufen)\b/.test(t))
  ) {
    out = drop(out, 'news')
    out = drop(out, 'fuel')
    out = drop(out, 'fx')
    out = drop(out, 'research')
    out = boost(out, 'outlook', 0.28)
  }

  if (/^\s*(?:die\s+)?(?:nachrichten|tagesschau|schlagzeilen)\s*[.!?]*$/.test(t)) {
    out = drop(out, 'outlook')
    out = boost(out, 'news', 0.25)
  }

  if (/\bfahr(?:e|en)?\s+mich\b/.test(t) && /\b(tanke|tankstelle)\b/.test(t)) {
    out = drop(out, 'outlook')
    out = boost(out, 'fuel', 0.25)
  }

  if (/^\s*(?:was\s+ist|kurs)\s+(?:der\s+)?(?:dollar|euro)\b/.test(t) && !/\b(fällt|steigt|ausblick|wird)\b/.test(t)) {
    out = drop(out, 'outlook')
    out = boost(out, 'fx', 0.25)
  }

  if (/^\s*guten\s+morgen\b/.test(t)) {
    out = drop(out, 'outlook')
  }

  if (/\b(wetterstatistik|lage[- ]?kachel)\b/.test(t) || /^\s*lage\s+(an|aus)\s*$/.test(t)) {
    out = drop(out, 'outlook')
  }

  if (/\bbip\b/.test(t)) {
    out = drop(out, 'outlook')
  }

  if (/\b(taxi|uber|freenow|free\s*now)\b/.test(t) && !/\b(bahn|öpnv)\b/.test(t)) {
    out = drop(out, 'drive')
    out = drop(out, 'poi')
    out = drop(out, 'transit')
    out = drop(out, 'maps')
    out = boost(out, 'taxi', 0.3)
  }

  if (/\b(bahn|öpnv|zug)\b/.test(t)) {
    out = drop(out, 'poi')
    out = drop(out, 'taxi')
    out = boost(out, 'transit', 0.25)
  }

  if (/\b(kneipe|pubs?|\bbars?\b)\b/.test(t) && /\b(nähe|nächste|nächster)\b/.test(t)) {
    out = drop(out, 'taxi')
    out = drop(out, 'transit')
    out = boost(out, 'poi', 0.25)
  }

  if (/\b(hausstand|einstellungen\s+export|backup\s+export)\b/.test(t)) {
    out = drop(out, 'research')
    out = boost(out, 'backup', 0.3)
  }

  if (/\bfreitag\b/.test(t) && !/\bfriday\b/.test(t)) {
    out = drop(out, 'face')
    out = boost(out, 'calendar', 0.2)
  }

  if (/\bwas\s+steht\b/.test(t) && /\bfriday\b/.test(t)) {
    out = drop(out, 'face')
    out = boost(out, 'calendar', 0.25)
  }

  if (/^(?:(?:hey|hallo|hi)\s+)?friday\b/.test(t) && !/\bfreitag\b/.test(t) && !/\bwas\s+steht\b/.test(t)) {
    out = drop(out, 'calendar')
    out = boost(out, 'face', 0.25)
  }

  if (
    /\b(körper|koerper|weltkugel|\bkugel\b)\b/.test(t) ||
    /^\s*zeig(?:e)?\s+(?:die\s+)?(?:erde|hirn|körper|koerper)\s*$/.test(t) ||
    (gazetteerHit(t) && /^\s*wo\s+(?:liegt|ist)\s+/.test(t))
  ) {
    out = drop(out, 'pc')
    out = drop(out, 'eye')
    out = drop(out, 'here')
    out = drop(out, 'maps')
    out = boost(out, 'hud', 0.3)
  }

  if (/^\s*wo\s+ist\s+(?:der|die|das)?\s*(?:speichern|start|ok)\b/.test(t) || /^\s*zeig(?:e)?\s+speichern\b/.test(t)) {
    out = drop(out, 'here')
    out = drop(out, 'sky')
    out = drop(out, 'maps')
    out = boost(out, 'pc', 0.3)
  }

  if (/\b(wo\s+ist\s+die\s+iss|internationale\s+raumstation)\b/.test(t)) {
    out = drop(out, 'pc')
    out = drop(out, 'here')
    out = boost(out, 'sky', 0.3)
  }

  if (/\bwie\s+viele\s+(fenster|icons?|schaltflächen)\b/.test(t)) {
    out = drop(out, 'sensors')
    out = boost(out, 'pc', 0.25)
  }

  if (
    /\b(was\s+steht\s+auf\s+dem\s+beleg|beleg\s+lesen|termin\s+aus\s+dem\s+zettel|waschlabel|ean\s+auf\s+dem\s+foto|wo\s+liegt\s+)/.test(
      t,
    )
  ) {
    out = drop(out, 'pc')
    out = drop(out, 'haushalt')
    out = boost(out, 'eye', 0.25)
  }

  if (/\b(?:tisch|schreibtisch|desk\s+view)\b/.test(t) && !/\b(?:wetter|hotel)\b/.test(t)) {
    out = drop(out, 'weather')
    out = drop(out, 'here')
    out = boost(out, 'desk', 0.24)
  }

  if (parseDocIntent(text)) {
    out = drop(out, 'eye')
    out = boost(out, 'doc', 0.28)
  }

  if (has(out, 'app')) {
    out = drop(out, 'maps')
    out = drop(out, 'device')
    out = drop(out, 'memory')
    if (/\b(einstell|debug|sprachmodus|ged[aä]chtnis|theme|akzent|settings)\b/.test(t)) {
      out = drop(out, 'hud')
      out = boost(out, 'app', 0.15)
    }
  }

  if (parseWontIntent(text)) {
    out = drop(out, 'pc')
    out = drop(out, 'fx')
    out = drop(out, 'eye')
    out = drop(out, 'maps')
    out = boost(out, 'wont', 0.35)
  }

  return out
}
