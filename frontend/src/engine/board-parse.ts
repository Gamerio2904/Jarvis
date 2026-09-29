/** Tischplatte / Werkbank. Nicht Schreibtisch-Foto, nicht nacktes „Tisch an“. */

import { HOME_APP_IDS, isHomeAppId, type HomeAppId } from './home-apps.ts'
import { loadSettings } from './store.ts'
import type { TischplatteView } from './board-types.ts'

export type BoardIntent =
  | { kind: 'on' }
  | { kind: 'off' }
  | { kind: 'view'; view: TischplatteView; sim?: HomeAppId }
  | { kind: 'catalog'; mode: 'planned' | 'can' | 'area' | 'docs'; area?: string }
  | { kind: 'jobs'; research?: string; planIndex?: number; planQuery?: string }
  | { kind: 'proposal'; accept: boolean }
  | { kind: 'theme' }
  | { kind: 'stop' }

const END = String.raw`[.!?]?\s*$`

const ON = new RegExp(String.raw`^\s*(?:tischplatte|werkbank|projekttafel)\s+an\s*` + END, 'i')
const OFF = new RegExp(
  String.raw`^\s*(?:(?:tischplatte|werkbank|projekttafel)\s+aus|icons?\s+wieder|homescreen[\s-]?icons?)\s*` + END,
  'i',
)

const VIEW_SPRINTS = new RegExp(String.raw`^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+die)?\s+)?sprints?\s*` + END, 'i')
const VIEW_PSP = new RegExp(
  String.raw`^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+den?|das)?\s+)?(?:psp|projektstruktur|baum)\s*` + END,
  'i',
)
const VIEW_MOD = new RegExp(String.raw`^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+die)?\s+)?module\s*` + END, 'i')
const VIEW_RES = new RegExp(
  String.raw`^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+die)?\s+)?(?:quellen|forschung|recherche)\s*` + END,
  'i',
)
const SIM = new RegExp(String.raw`^\s*simulier(?:e|en)?(?:\s+die)?\s+(?:die\s+)?(.+?)(?:-?gui)?\s*` + END, 'i')
const THEME = new RegExp(String.raw`^\s*(?:neuer\s+hintergrund|hintergrund\s+neu)\s*` + END, 'i')
const STOP = new RegExp(String.raw`^\s*(?:stopp(?:e)?\s+(?:die\s+)?jobs?|jobs?\s+stopp)\s*` + END, 'i')
const PLANNED = new RegExp(
  String.raw`^\s*(?:was\s+ist\s+geplant|was\s+steht\s+in\s+den\s+docs|zeig(?:e)?(?:\s+mir)?(?:\s+den)?\s+jarvis-?plan)\s*` +
    END,
  'i',
)
const CAN = new RegExp(String.raw`^\s*was\s+kann\s+jarvis\s*` + END, 'i')
const FEATURES = new RegExp(String.raw`^\s*welche\s+features?\s+hat\s+(?:der|die|das)?\s*(.+?)\s*` + END, 'i')
const DOCS = new RegExp(String.raw`^\s*lies(?:e)?(?:\s+die)?\s+docs\s+zu\s+(.+?)\s*` + END, 'i')

const JOBS = new RegExp(
  String.raw`^\s*(?:such(?:e)?|recherchier(?:e)?)\s+(?:open[\s-]?source|opensource|github)\s+(?:zu|nach|für)\s+(.+?)(?:\s+und\s+plan(?:e)?\s+sprints?(?:\s+für)?(?:\s+idee)?\s+(.+))?\s*` +
    END,
  'i',
)

const AREA_MAP: Record<string, string> = {
  kalender: 'calendar',
  calendar: 'calendar',
  termin: 'calendar',
  research: 'research',
  recherche: 'research',
  'deep research': 'research',
  gedächtnis: 'memory',
  hirn: 'memory',
  homescreen: 'home',
  tischplatte: 'board',
  lage: 'lage',
  kugel: 'globe',
  stimme: 'voice',
  chat: 'chat',
}

function areaOf(raw: string): string {
  const t = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  return AREA_MAP[t] || t.replace(/[^a-z0-9äöüß]+/gi, '').slice(0, 24)
}

function simModule(raw: string): HomeAppId | undefined {
  const t = raw.trim().toLowerCase()
  if (/kalender|termin/.test(t)) return 'calendar'
  if (/chat/.test(t)) return 'chat'
  if (/sprache|stimme/.test(t)) return 'voice'
  if (/kugel|erde/.test(t)) return 'globe'
  if (/lage/.test(t)) return 'lage'
  if (/overlay|folie/.test(t)) return 'overlay'
  if (/gehirn|hirn/.test(t)) return 'hirn'
  if (/einstell/.test(t)) return 'settings'
  if (/film|watch/.test(t)) return 'watchlist'
  const id = t.replace(/\s+/g, '')
  return isHomeAppId(id) ? id : HOME_APP_IDS.find((x) => t.includes(x))
}

function planRef(raw: string): { planIndex?: number; planQuery?: string } {
  const s = raw.trim()
  if (/^\d{1,2}$/.test(s)) return { planIndex: Number(s) }
  return { planQuery: s.slice(0, 80) }
}

export function parseBoardIntent(text: string): BoardIntent | null {
  const t = text.trim()
  if (!t || t.length > 280) return null
  if (/\b(?:schreibtisch|wetter|hotel|zimmertemperatur)\b/i.test(t) && !/\btischplatte\b/i.test(t)) {
    return null
  }
  if (/^\s*tisch(?:blick)?\s+(?:an|aus)\s*[.!]?\s*$/i.test(t)) return null
  if (ON.test(t)) return { kind: 'on' }
  if (OFF.test(t)) return { kind: 'off' }
  if (THEME.test(t)) return { kind: 'theme' }
  if (STOP.test(t)) return { kind: 'stop' }
  if (VIEW_SPRINTS.test(t)) return { kind: 'view', view: 'sprints' }
  if (VIEW_PSP.test(t)) return { kind: 'view', view: 'psp' }
  if (VIEW_MOD.test(t)) return { kind: 'view', view: 'modules' }
  if (VIEW_RES.test(t)) return { kind: 'view', view: 'research' }
  const sim = SIM.exec(t)
  if (sim) {
    const mod = simModule(sim[1] || '')
    if (mod) return { kind: 'view', view: 'sim', sim: mod }
  }
  if (PLANNED.test(t)) return { kind: 'catalog', mode: 'planned' }
  if (CAN.test(t)) return { kind: 'catalog', mode: 'can' }
  const feat = FEATURES.exec(t)
  if (feat) return { kind: 'catalog', mode: 'area', area: areaOf(feat[1] || '') }
  const docs = DOCS.exec(t)
  if (docs) return { kind: 'catalog', mode: 'docs', area: areaOf(docs[1] || '') }

  const jobs = JOBS.exec(t)
  if (jobs) {
    const research = (jobs[1] || '').trim().slice(0, 160)
    const planRaw = (jobs[2] || '').trim()
    if (research) {
      return planRaw
        ? { kind: 'jobs', research, ...planRef(planRaw) }
        : { kind: 'jobs', research }
    }
  }

  const pending = Boolean(loadSettings().proposal_pending)
  if (pending) {
    if (/^(?:ja(?:\s+bitte)?|merken|merk(?:e)?\s+dir(?:\s+den)?\s+vorschlag)\s*[.!?]?$/i.test(t)) {
      return { kind: 'proposal', accept: true }
    }
    if (/^(?:nein|verwerfen|nicht\s+merken)\s*[.!?]?$/i.test(t)) {
      return { kind: 'proposal', accept: false }
    }
  }
  return null
}
