# Sprint 87 — Bessere Antworten (`1.34.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.34.0`** |
| Quelle | PO 2026-08-17 intelligenter, bessere Antworten |
| Voraussetzung | `1.33.0` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Gemini-Smalltalk und Tool-Antworten klingen nach Jarvis, kennen den Turn davor, erfinden nichts.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| A1 | Mehr History im Sprachmodus | Bezug auf vorherige Zeile |
| A2 | Memory im Smalltalk | Name/Ort/Pref ohne Extra-Befehl, kein erfundener Vorname |
| A3 | Persona-Variation | Gleiche Frage, andere Formulierung (`07`) |
| A4 | Guards | Helpdesk weg, Sinn bleibt |
| A5 | Groq = dieselbe Persona | Limit-Fall nicht „anderer Bot“ |
| A6 | Tool-Turn im Chat | Nach Netflix darf Smalltalk den Turn kennen |
| A7 | Soft-Confirm „ja“/„mach“ | Letztes Tool, kein Smalltalk |
| A8 | Version `1.34.0` | Sideload |

## Probe

Siehe [`28-next.md`](../28-next.md) `1.34.0`.

## Won’t

Größeres Lokal-Modell, Duzen-Default, Master in jeder Bubble.
