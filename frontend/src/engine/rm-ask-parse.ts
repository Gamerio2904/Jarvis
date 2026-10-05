/** Fragen zum Serie-Netz. Nicht food, nicht Kamera-Write, nicht Lage-Schalt. */
import { normalizeUtterance } from './utterance.ts'
import { searchCharacters } from './rm-graph.ts'

export type RmAskIntent = {
  kind: 'who' | 'skill' | 'graph'
  name: string | null
  skillQ: string | null
}

const STEAL =
  /\b(nutella|carbonara|wäsche|waschschüssel|zutat|rezept|staffel\s+[6-9]|s0[6-9]e)\b/i

const HUD_SWITCH =
  /^\s*(?:lage|kugel|körper|koerper|serie(?:n?[- ]?netz)?|charakter[- ]?netz)\s+(?:an|aus|ein|auf)\s*$/i

const WHO =
  /^\s*(?:wer\s+ist|erzähl(?:\s+mir)?\s+von|was\s+ist(?:\s+das\s+für\s+(?:ein(?:e|er)?)?)?)\s+(.+?)\s*[?!.]?\s*$/i

const SKILL_NAMED =
  /^\s*(?:wann\s+hatte|welche\s+fähigkeiten\s+hat|was\s+kann|fähigkeiten\s+(?:von|vom))\s+(.+?)\s*[?!.]?\s*$/i

const SKILL_PRONOUN =
  /^\s*(?:wann\s+hatte\s+(?:er|sie|der|die)|was\s+ist\s+(?:seine|ihre|die)\s+stärke|welche\s+fähigkeiten\s+hat\s+(?:er|sie)|was\s+kann\s+(?:er|sie))\b(.*)$/i

const GRAPH =
  /^\s*(?:was\s+steht\s+im\s+(?:serie[- ]?)?(?:netz|graph)|welche\s+charaktere(?:\s+kennst\s+du)?|was\s+weiß(?:t)?\s+der\s+graph)\s*[?!.]?\s*$/i

const SKILL_HINT = /\b(schild|portal|fähigkeit|stärke|phoenix|klon|meeseeks|cybernetik)\b/i

const KNOWN = /^(?:rick(?:\s+sanchez)?|morty(?:\s+smith)?|summer(?:\s+smith)?|beth(?:\s+smith)?|jerry(?:\s+smith)?|birdperson|evil\s+morty)$/i

function looksRmName(name: string): boolean {
  if (KNOWN.test(name)) return true
  return searchCharacters(name).some((c) => c.name.toLowerCase().includes(name.toLowerCase()))
}

function cleanName(raw: string): string | null {
  const t = raw
    .replace(/[.!?]+$/g, '')
    .replace(/\b(?:ein(?:e|en|er|em)?|das|der|die|automatisches?|seine|ihre)\s+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t || t.length < 2 || t.length > 60) return null
  if (/^(er|sie|es|seine|ihre|stärke|fähigkeit)$/i.test(t)) return null
  return t
}

export function parseRmAskIntent(text: string): RmAskIntent | null {
  const t = normalizeUtterance(text || '').trim()
  if (!t || t.length > 240) return null
  if (STEAL.test(t) || HUD_SWITCH.test(t)) return null
  if (/^\s*staffel\s+\d+\s+folge\s+\d+/i.test(t)) return null

  if (GRAPH.test(t)) return { kind: 'graph', name: null, skillQ: null }

  const who = WHO.exec(t)
  if (who) {
    const name = cleanName(who[1])
    if (name && looksRmName(name) && !/^(?:das\s+für\s+ein\s+film|film)\b/i.test(name)) {
      return { kind: 'who', name, skillQ: null }
    }
  }

  const named = SKILL_NAMED.exec(t)
  if (named) {
    const rest = named[1].replace(/\s+ein\s+automatisches?\s+/i, ' ').trim()
    const name = cleanName(rest.replace(/\s+(?:ein\s+)?(?:automatisches?\s+)?schild.*$/i, '').trim()) || cleanName(rest)
    if (!name || !looksRmName(name)) {
      /* Steuer, Weltlage, … */
    } else {
      const skillQ = SKILL_HINT.test(t) ? t : rest
      return { kind: 'skill', name, skillQ }
    }
  }

  const pro = SKILL_PRONOUN.exec(t)
  if (pro) {
    return { kind: 'skill', name: null, skillQ: (pro[1] || t).trim() || t }
  }

  if (SKILL_HINT.test(t) && /\b(rick|morty|summer|beth|jerry|birdperson)\b/i.test(t)) {
    const m = /\b(rick(?:\s+sanchez)?|morty(?:\s+smith)?|summer|beth|jerry|birdperson|evil\s+morty)\b/i.exec(t)
    return { kind: 'skill', name: m?.[1] || null, skillQ: t }
  }

  return null
}
