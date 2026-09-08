import type { BodyOrgan } from '../hud-parse.ts'
import type { AgentAutonomy, AgentVisibility, DepartmentId } from './types.ts'

export type AgentMeta = {
  label: string
  department: DepartmentId
  organs: BodyOrgan[]
  visibility: AgentVisibility
  autonomy: AgentAutonomy
}

/** Static cluster metadata — parse/execute live in catalog.ts */
export const AGENT_META: Record<string, AgentMeta> = {
  wont: { label: "Won't-Liste", department: 'system', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  identity: { label: 'Jarvis / Friday', department: 'system', organs: ['mouth'], visibility: 'user', autonomy: 'parser' },
  tv: { label: 'Fernseher', department: 'geraete', organs: ['hand', 'mouth'], visibility: 'domain', autonomy: 'parser' },
  fan: { label: 'Ventilator', department: 'geraete', organs: ['hand'], visibility: 'domain', autonomy: 'parser' },
  plug: { label: 'Steckdose', department: 'geraete', organs: ['hand'], visibility: 'domain', autonomy: 'parser' },
  device: { label: 'Gerät', department: 'geraete', organs: ['hand'], visibility: 'domain', autonomy: 'parser' },
  amazon: { label: 'Amazon Music', department: 'geraete', organs: ['hand'], visibility: 'domain', autonomy: 'parser' },
  app: { label: 'App starten', department: 'geraete', organs: ['hand'], visibility: 'domain', autonomy: 'parser' },
  film: { label: 'Film / Streaming', department: 'medien', organs: ['mouth', 'eye'], visibility: 'domain', autonomy: 'parser' },
  drive: { label: 'Fahrmodus', department: 'navigation', organs: ['hand', 'eye'], visibility: 'domain', autonomy: 'parser' },
  maps: { label: 'Karten', department: 'navigation', organs: ['hand'], visibility: 'domain', autonomy: 'parser' },
  here: { label: 'Standort', department: 'navigation', organs: ['eye'], visibility: 'domain', autonomy: 'parser' },
  fuel: { label: 'Tanke', department: 'navigation', organs: ['eye'], visibility: 'domain', autonomy: 'parser' },
  poi: { label: 'POI', department: 'navigation', organs: ['eye'], visibility: 'domain', autonomy: 'parser' },
  transit: { label: 'Bahn / ÖPNV', department: 'navigation', organs: ['eye'], visibility: 'domain', autonomy: 'parser' },
  taxi: { label: 'Taxi', department: 'navigation', organs: ['hand'], visibility: 'domain', autonomy: 'parser' },
  leave: { label: 'Losgehen', department: 'navigation', organs: ['hand'], visibility: 'domain', autonomy: 'parser' },
  blitzer: { label: 'Blitzer', department: 'navigation', organs: ['eye'], visibility: 'domain', autonomy: 'parser' },
  hud: { label: 'Lage / Körper', department: 'navigation', organs: ['eye'], visibility: 'domain', autonomy: 'parser' },
  trace: { label: 'Traceroute', department: 'navigation', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  calendar: { label: 'Kalender', department: 'alltag', organs: ['memory', 'hand'], visibility: 'domain', autonomy: 'parser' },
  alarm: { label: 'Wecker', department: 'alltag', organs: ['hand'], visibility: 'domain', autonomy: 'parser' },
  timer: { label: 'Timer', department: 'alltag', organs: ['mouth', 'hand'], visibility: 'domain', autonomy: 'parser' },
  reminder: { label: 'Erinnerung', department: 'alltag', organs: ['memory'], visibility: 'domain', autonomy: 'parser' },
  todo: { label: 'Todos / Notizen', department: 'alltag', organs: ['memory'], visibility: 'domain', autonomy: 'parser' },
  brief: { label: 'Tageslage', department: 'alltag', organs: ['memory'], visibility: 'domain', autonomy: 'parser' },
  birthday: { label: 'Geburtstag', department: 'alltag', organs: ['memory'], visibility: 'domain', autonomy: 'parser' },
  holiday: { label: 'Feiertag', department: 'alltag', organs: ['memory'], visibility: 'domain', autonomy: 'parser' },
  ferien: { label: 'Schulferien', department: 'alltag', organs: ['memory'], visibility: 'domain', autonomy: 'parser' },
  shopping: { label: 'Einkaufsliste', department: 'alltag', organs: ['hand'], visibility: 'domain', autonomy: 'parser' },
  home: { label: 'Zuhause-Routine', department: 'alltag', organs: ['memory'], visibility: 'domain', autonomy: 'parser' },
  'watch-price': { label: 'Preiswache', department: 'alltag', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  'chat-folder': { label: 'Chat-Ordner', department: 'alltag', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  weather: { label: 'Wetter', department: 'information', organs: ['eye', 'brain'], visibility: 'domain', autonomy: 'parser' },
  news: { label: 'Nachrichten', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  outlook: { label: 'Weltlage', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  search: { label: 'Chatsuche', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  warn: { label: 'Unwetter', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  fx: { label: 'Wechselkurs', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  sport: { label: 'Sport', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  sky: { label: 'Himmel', department: 'information', organs: ['eye'], visibility: 'domain', autonomy: 'parser' },
  nature: { label: 'Natur', department: 'information', organs: ['eye'], visibility: 'domain', autonomy: 'parser' },
  flights: { label: 'Flüge', department: 'information', organs: ['eye'], visibility: 'domain', autonomy: 'parser' },
  food: { label: 'Lebensmittel', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  library: { label: 'Buch', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  law: { label: 'Gesetz', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  haushalt: { label: 'Haushalt', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  sensors: { label: 'Sensoren', department: 'information', organs: ['hand'], visibility: 'domain', autonomy: 'parser' },
  chess: { label: 'Schach', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  digest: { label: 'Gespräch', department: 'information', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  memory: { label: 'Gedächtnis', department: 'wissen', organs: ['memory', 'brain'], visibility: 'domain', autonomy: 'parser' },
  recall: { label: 'Recall', department: 'wissen', organs: ['memory'], visibility: 'domain', autonomy: 'parser' },
  teach: { label: 'Fachwissen anlegen', department: 'wissen', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  pack: { label: 'Fachwissen abfragen', department: 'wissen', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  pc: { label: 'PC steuern', department: 'werkstatt', organs: ['pc_hand', 'pc_eye'], visibility: 'domain', autonomy: 'parser' },
  eye: { label: 'Auge / Foto', department: 'werkstatt', organs: ['eye'], visibility: 'domain', autonomy: 'parser' },
  doc: { label: 'Datei', department: 'werkstatt', organs: ['eye', 'hand'], visibility: 'domain', autonomy: 'parser' },
  desk: { label: 'Tisch / Ground', department: 'werkstatt', organs: ['eye', 'pc_eye'], visibility: 'domain', autonomy: 'parser' },
  backup: { label: 'Hausstand', department: 'system', organs: ['brain'], visibility: 'domain', autonomy: 'parser' },
  face: { label: 'Jarvis / Friday', department: 'system', organs: ['mouth'], visibility: 'domain', autonomy: 'parser' },
}

export function metaFor(id: string): AgentMeta {
  const m = AGENT_META[id]
  if (!m) throw new Error(`agents/meta: unknown id "${id}"`)
  return m
}
