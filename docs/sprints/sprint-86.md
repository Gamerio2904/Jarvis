# Sprint 86 — Befehle erkennen (`1.33.0`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** |
| Ziel-Version | **`1.33.0`** |
| Quelle | PO 2026-08-17 Qualität: besseres Erkennen, Verständnis |
| Voraussetzung | Sideload `1.32.1` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Gesprochene und getippte Alltagsbefehle landen im richtigen Tool — ohne neue Fähigkeiten.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| C1 | STT-Repairs (Netflix/YouTube/Disney/Prime, Orte, Satzzeichen) | „Netfliks“ / „hailbronn“ treffen |
| C2 | Filler + `COMMAND_START` | „Kannst du mal Netflix öffnen“ |
| C3 | `pickHeard` scored, kein Drive-`inMode`-Raten | Bester Parser-Treffer, nicht der erste |
| C4 | TV vs Spotify vs Drive | Film/App/TV-Cue vs. Musik vs. Fahrt |
| C5 | Follow-up + `und` | Nach TV „lauter“; „ja“/„mach“; drei Tool-Teile |
| C6 | Zahlenworte | „Wecker sieben Uhr“, „Timer Viertelstunde“ |
| C7 | Version `1.33.0` | Sideload |

## Probe

Siehe [`28-next.md`](../28-next.md) `1.33.0`.

## Won’t

Neue Tools, neue TV-Apps, Apple CarPlay.
