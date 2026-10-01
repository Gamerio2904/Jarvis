/**
 * Feature-Katalog Freeze 2026-09-30, Bundle 18.20.0. Sideload-APK bleibt 18.19.0.
 * Quelle: Hilfe + Kopf 42-planned + Unreleased. Kein Docs-Clone zur Laufzeit.
 */
export type FeatureRow = {
  id: string
  version: string
  area: string
  title: string
  can: string
  wont: string
  prompt: string
}

export const CATALOG_STAND = '18.20.0'
export const CATALOG_FREEZE = '2026-09-30'

export const FEATURE_CATALOG: FeatureRow[] = [
  { id: 'home', version: '18.18.0', area: 'home', title: 'Homescreen', can: 'App-Kacheln statt Chat beim Öffnen.', wont: 'Android-Launcher, fremde Apps.', prompt: 'Zeig Homescreen' },
  { id: 'glance', version: '18.18.0', area: 'home', title: 'Werte-Leiste', can: 'Rechte Leiste zeigt Termin, Timer, Wetter-Satz, Einkauf, Key.', wont: 'Erfundene Live-Werte.', prompt: '' },
  { id: 'mini', version: '18.18.0', area: 'chat', title: 'Mini-Chat', can: 'Kleines Chatfenster auf dem Homescreen.', wont: 'Zweites Hirn.', prompt: '' },
  { id: 'voice-sphere', version: '18.18.0', area: 'voice', title: 'Sprach-Kugel', can: 'CSS-3D-Kugel als Sprach-Shortcut.', wont: 'WebGL.', prompt: '' },
  { id: 'board', version: '18.19.0', area: 'board', title: 'Tischplatte', can: 'Icons aus, HUD-Werkbank ohne Gesicht.', wont: 'Schreibtisch-Foto, Face-Hologramm, tldraw.', prompt: 'Tischplatte an' },
  { id: 'clip', version: '18.20.0', area: 'medien', title: 'YouTube-Highlights', can: '1–3 YouTube-Links, der PC schneidet eine lokale Datei.', wont: 'Upload, TikTok, Instagram, Schnitt auf dem Handy.', prompt: 'Schneide Highlights aus https://www.youtube.com/watch?v=aNvsF1jToJQ' },
  { id: 'calendar', version: '18.17.0', area: 'calendar', title: 'Kalender Alltag', can: 'Termine, ICS, Serie weekly/monthly, Konflikt ehrlich.', wont: 'Google-Kalender.', prompt: 'Termin morgen 15 Uhr Zahnarzt' },
  { id: 'ics', version: '18.17.0', area: 'calendar', title: 'ICS', can: 'Kalender als ICS raus und rein (RFC-Teilmenge).', wont: 'Cloud-Sync.', prompt: '' },
  { id: 'memory', version: '18.16.0', area: 'memory', title: 'Personen-Knäuel', can: 'Mama = Mutter. Geburtstag und Kontakt eine Person.', wont: 'Erfundener Vorname.', prompt: 'Mama hat am 3. März Geburtstag' },
  { id: 'gate', version: '10.60.0', area: 'memory', title: 'Memory-Gate', can: 'writeMemory mit STORE MERGE IGNORE REVISE.', wont: 'Stiller Web-Dump ins Cap-80.', prompt: 'Merk dir ich mag Mate' },
  { id: 'research', version: '11.60.0', area: 'research', title: 'Deep Research', can: 'Mehrere Queries, Quellen mit URL, Gemini-Grounding.', wont: '12-Stunden-Crawl, Multi-Agent.', prompt: 'Recherchiere tief: Anzugs-Energiequelle ehrlich, ohne Marvel-Magie' },
  { id: 'oss', version: '18.19.0', area: 'research', title: 'Open Source Suche', can: 'GitHub REST nur mit Token, sonst DDG site:github.com ehrlich unvollständig.', wont: 'Login-Scraping.', prompt: 'Recherchiere tief: Open-Source Kalender ICS Parser' },
  { id: 'idea', version: '18.2.0', area: 'idea', title: 'Ideen + Sprintplan', can: 'Idee merken. Eine Sprint-Hülle, so viele Sprints wie der Satz Tore braucht.', wont: 'Drei feste Titel, RICE, Dateien nach docs/sprints.', prompt: 'Idee: Körper und Chat gleichzeitig' },
  { id: 'lage', version: '18.14.0', area: 'lage', title: 'Lage-Kugel', can: 'Stecknadel, Flugzeug, Satellit aus Feldern.', wont: 'iframe, CCTV.', prompt: 'Zeig Lage' },
  { id: 'globe', version: '18.0.0', area: 'globe', title: 'Kugel', can: 'Weltkugel, Schichten auf Zuruf.', wont: 'globe.gl ohne Messung.', prompt: 'Zeig die Kugel' },
  { id: 'overlay', version: '18.7.0', area: 'overlay', title: 'Overlay / Folie', can: 'Fahrmodus-Folie.', wont: 'Computer-Use.', prompt: '' },
  { id: 'watchlist', version: '18.3.0', area: 'watchlist', title: 'Filme', can: 'Watchliste und Lieblinge.', wont: 'Netflix-Login.', prompt: 'Watchliste: Dune' },
  { id: 'plug', version: '2.1.0', area: 'plug', title: 'Steckdosen', can: 'Shelly/Tasmota an und aus mit Namen.', wont: 'Cloud-Broker.', prompt: 'alle Steckdosen aus' },
  { id: 'timer', version: '1.7.0', area: 'timer', title: 'Timer', can: 'Timer und Wecker lokal.', wont: '', prompt: 'Timer 8 Minuten Nudeln' },
  { id: 'weather', version: '2.2.0', area: 'weather', title: 'Wetter', can: 'Wetter im Chat, Satz in der Leiste wenn schon gefragt.', wont: 'Erfundenes Wetter auf dem Homescreen.', prompt: 'Wetter Berlin' },
  { id: 'tv', version: '1.26.0', area: 'tv', title: 'Fernseher', can: 'Tizen/Fire auf Zuruf.', wont: 'CEC-Fake.', prompt: 'Fernseher an' },
]

export function catalogByArea(area: string): FeatureRow[] {
  const a = area.trim().toLowerCase()
  if (!a) return []
  return FEATURE_CATALOG.filter((r) => r.area === a || r.id === a || r.title.toLowerCase().includes(a))
}

export function formatCatalog(rows: FeatureRow[], emptyArea?: string): string {
  if (!rows.length) {
    return emptyArea
      ? `steht nicht im Katalog (Stand ${CATALOG_STAND}).`
      : `Katalog leer (Stand ${CATALOG_STAND}).`
  }
  const head = `Stand ${CATALOG_STAND}, Freeze ${CATALOG_FREEZE}.`
  const lines = rows.slice(0, 12).map((r) => `${r.title}: ${r.can}${r.wont ? ` Won't: ${r.wont}` : ''}`)
  return [head, ...lines].join('\n')
}

export function catalogVersionNum(v: string): number {
  const p = v.split('.').map((n) => Number.parseInt(n, 10) || 0)
  return (p[0] || 0) * 10000 + (p[1] || 0) * 100 + (p[2] || 0)
}

export function versionAtLeast(v: string, min: string): boolean {
  return catalogVersionNum(v) >= catalogVersionNum(min)
}

export function catalogPlanned(min = '18.16.0'): FeatureRow[] {
  return FEATURE_CATALOG.filter((r) => versionAtLeast(r.version, min))
}

export function catalogHasRice(): boolean {
  return FEATURE_CATALOG.some((r) => Object.keys(r).some((k) => /rice/i.test(k)))
}
