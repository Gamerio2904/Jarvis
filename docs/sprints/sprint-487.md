# Sprint 487 — Hausstandrevisionen kennzeichnen

**Version:** `18.37.0` — **CODE\*** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** 18.36.0 sicher freigegeben.

**Ist im Arbeitsbaum:** Revisionsvektor und SHA-256-Inhalts-Hash sind in
Backup, lokalen Hausstandänderungen und Tablet-Sync eingebunden. Gleiche
Revisionen, Dominanz und Konflikte werden verglichen; fehlende oder ungültige
Revisionen blockieren den Transfer. Tests decken Gleichheit, Dominanz,
Nebenläufigkeit und Inhaltsabweichung ab. Nutzerwahl, zusätzliche
Recovery-/Replay-Goldtests und Geräteabnahme bleiben offen.

## Ziel

Hausstandstände erhalten nachvollziehbare Revisionen, die Geräteuhren nicht als
Wahrheit voraussetzen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S487-1 | Umschlag | `backup.ts` `store.ts` | Schema-Version, Geräte-IDs, persistente Zähler je Peer und kanonischen Inhalts-Hash ergänzen. |
| S487-2 | Vergleich | `sync-compare.ts` | Revisionen nach Dominanz vergleichen; Zeitstempel nur anzeigen, nie als alleinige Gewinnerregel verwenden. |
| S487-3 | Tests | `test-tablet-sync.mjs` | Gleichheit, Dominanz, gleiche Zähler mit anderem Hash, Nebenläufigkeit und ungültiges Schema abdecken. |

## Abbruchkriterium

Unklare oder nebenläufige Revisionen werden als älter/neuer eingestuft, oder
Secret-Werte fließen in den Hash-Bericht.
