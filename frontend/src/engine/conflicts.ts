import type { Candidate, RouteCtx } from './route-types.ts'

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

  return out
}
