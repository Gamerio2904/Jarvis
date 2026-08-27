import { normalizeUtterance } from './utterance.ts'

export type OutlookKind = 'world' | 'oil_why' | 'fuel_outlook' | 'fx_outlook' | 'stock_ask'

export type OutlookIntent = { kind: OutlookKind }

const RECIPE = /\b(rezept|braten|olivenöl|sonnenblumenöl|backofen|kochen|salat|pfanne)\b/i
const HUD_LAGE = /^\s*lage\s+(an|aus|ein|weg|zu)\s*$/i
const NEWS_ONLY = /^\s*(?:die\s+)?(?:nachrichten|tagesschau|schlagzeilen|news)\s*[.!?]*$/i
const TANK_DRIVE = /\bfahr(?:e|en)?\s+mich\b/i
const TANK_WORD = /\b(tanke|tankstelle|tankstellen|tanken)\b/i

export function parseOutlookIntent(text: string, lastTool = ''): OutlookIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (HUD_LAGE.test(t) || /\bwetterstatistik\b/i.test(t)) return null
  if (RECIPE.test(t)) return null
  if (NEWS_ONLY.test(t)) return null
  if (TANK_DRIVE.test(t) && TANK_WORD.test(t)) return null
  if (/^\s*guten\s+morgen\b/.test(t)) return null
  if (/\bbip\b/i.test(t) || /\bgdp\b/i.test(t)) return null
  if (/^\s*(?:was\s+ist|kurs)\s+(?:der\s+)?(?:dollar|euro|usd|eur)\b/i.test(t) && !/\b(fällt|steigt|ausblick|prognose|wird|teurer)\b/i.test(t)) {
    return null
  }

  if (lastTool === 'outlook') {
    const follow = parseOutlookFollowUp(t)
    if (follow) return follow
  }

  if (/\b(aktie|aktien|dax|sap\b|tesla|nvidia)\b/i.test(t) && /\b(fällt|steigt|morgen|kaufen|verkaufen|ausblick)\b/i.test(t)) {
    return { kind: 'stock_ask' }
  }

  if (
    /\b(weltlage|lage\s+welt)\b/i.test(t) ||
    /\bwas\s+passiert\s+in\s+der\s+welt\b/i.test(t) ||
    /\bwas\s+ist\s+(?:die\s+)?weltlage\b/i.test(t) ||
    /\bwas\s+ist\s+die\s+lage\s+(?:in\s+der\s+welt|weltweit)\b/i.test(t)
  ) {
    return { kind: 'world' }
  }

  if (
    /\b(wird\s+(?:der\s+|das\s+)?(?:benzin|e10|sprit)|benzin\s+teurer|e10\s+teurer)\b/i.test(t) ||
    (/\b(benzin|e10|sprit)\b/i.test(t) && /\b(teurer|billiger|ausblick|prognose|wird)\b/i.test(t))
  ) {
    return { kind: 'fuel_outlook' }
  }

  if (
    /ölpreis|rohöL|brent|\bwti\b|opec|hormus|hormuz/i.test(t) ||
    (/(^|[^a-zäöüß])öl([^a-zäöüß]|$)/i.test(t) && /warum|teuer|steigt|fällt|preis|ausblick/i.test(t))
  ) {
    return { kind: 'oil_why' }
  }

  if (/\b(dollar|euro|wechselkurs)\b/i.test(t) && /\b(fällt|steigt|ausblick|prognose|wird)\b/i.test(t)) {
    return { kind: 'fx_outlook' }
  }

  return null
}

export function parseOutlookFollowUp(text: string): OutlookIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 48) return null
  if (/^(und\s+)?(benzin|e10|sprit)\b/i.test(t)) return { kind: 'fuel_outlook' }
  if (/^(und\s+)?(öl|brent|wti)\b/i.test(t)) return { kind: 'oil_why' }
  if (/^(und\s+)?(dollar|euro)\b/i.test(t)) return { kind: 'fx_outlook' }
  if (/^warum\s*[.!?]*$/i.test(t) || /^(und\s+)?warum\b/i.test(t)) return { kind: 'oil_why' }
  return null
}
