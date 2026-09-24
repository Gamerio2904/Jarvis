# Sprint 305 — Docs und Code aufräumen

**Version:** landet in `18.10.0` (historisch `18.5.4`) — **CODE** Should
**Plan:** [`76-next.md`](../76-next.md) §3–4
**Voraussetzung:** keine. Parallel zu 301–304.

## Ziel

Wer `docs/` öffnet, sieht was live ist. Historisches bleibt, zieht aber
nicht. Code ohne doppelte Fallbacks und ohne tote CSS-Inseln.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S305-1 | Index | `docs/README.md`, `42-planned.md` | Live App-Code `18.10.0`, Sideload `18.9.8`. Kopf 42 nicht `17.0.0` |
| S305-2 | Banner | `07`, `08`, `14`, `16` | Eine Zeile oben: Status, was falsch wäre zu ziehen. Persona-07 an `persona.ts` (Groq, Sir selten) |
| S305-3 | Dualdateien | `46-*`, `62-*` | Eine kanonisch, die andere Verweis |
| S305-4 | `HISTORISCH.md` | neu, eine Seite | NAS 12, Sprints 34–39, „nicht ziehen“. Keine Datei löschen |
| S305-5 | Code | CSS `pin-bubble-backdrop` wenn tot; Kommentar `routeRegistry` Rollback | Kein Verhalten ändern, das 301–304 noch anfassen |

## Won’t

- 90 Markdown-Dateien löschen. Sprint-Log kürzen.
- versionCode-Schema (282) anfassen.

## Abbruchkriterium

Ein Doc im Lesepfad behauptet Gemini-Hauptweg oder Sideload `9.10.0` als
jetzt.

## Manuell

`docs/README.md` oben: 18.4.4. `42-planned.md` Pull-Reihenfolge beginnt
mit 18.5 PLAN.
