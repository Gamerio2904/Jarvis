/** Low-Fi GUI-Simulation. Kein zweites CalendarScreen, keine erfundenen Termine. */

import { HOME_APPS, type HomeAppId } from './home-apps.ts'
import { readGlanceSnap } from './glance-snap.ts'

export type WireFrame = {
  id: HomeAppId
  label: string
  lines: string[]
}

export async function wireFor(id: HomeAppId, now = new Date()): Promise<WireFrame> {
  const app = HOME_APPS.find((a) => a.id === id)
  const label = app?.label || id
  if (id === 'calendar') {
    const snap = await readGlanceSnap(now)
    const next = snap.next && snap.next !== 'Nichts geplant' ? snap.next : 'Kein Termin im Store.'
    return {
      id,
      label,
      lines: ['Kalender (Drahtgitter)', next, 'Kein Google-Kalender.'],
    }
  }
  if (id === 'chat') {
    return { id, label, lines: ['Chat', 'Mini-Chat oder volle Leiste', 'Parser zuerst.'] }
  }
  if (id === 'voice') {
    return { id, label, lines: ['Sprache', 'Kugel-Shortcut, Folie getrennt', 'Kein WebGL.'] }
  }
  if (id === 'globe') {
    return { id, label, lines: ['Kugel', 'Schichten auf Zuruf', 'Kein Cesium.'] }
  }
  if (id === 'lage') {
    return { id, label, lines: ['Lage', 'Pins aus Feldern', 'Kein CCTV.'] }
  }
  if (id === 'overlay') {
    return { id, label, lines: ['CarPlay', 'Karte im Fahrmodus', 'Kein Apple CarPlay.'] }
  }
  if (id === 'tisch') {
    return { id, label, lines: ['Tischplatte', 'Werkbank ohne Gesicht', 'Icons aus.'] }
  }
  if (id === 'chess') {
    return { id, label, lines: ['Schach', 'Brett auf dem Feld', 'Kein Online-Gegner.'] }
  }
  if (id === 'yugioh') {
    return { id, label, lines: ['Yu-Gi-Oh', 'Duell auf dem Feld', 'Vereinfachte Effekte.'] }
  }
  return { id, label, lines: [label, 'Modul existiert', 'Simulation, nicht die Live-App.'] }
}
