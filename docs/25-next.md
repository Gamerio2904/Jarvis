# 25 — Stimme & Jarvis-Ton (`1.31`)

PO 2026-08-17: Stimmenqualität hoch, Latenz runter, Antworten besser — vor allem Smalltalk. Formulierung näher an Jarvis.

Reihe davor: [`24-next.md`](./24-next.md). App vorher: Sideload **`1.30.0`**.

## Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`1.31.0`** | TTS Charon + erster Satz sofort; Persona Smalltalk | **CODE** |

Sprint: [`sprint-83.md`](./sprints/sprint-83.md).

## Stimme

Gemini-TTS: Stimme **Charon** (ruhig, männlich), Flash-Modell zuerst, Abbruch nach ~2,8 s → Android. Erster fertiger Satz wird gesprochen, nicht erst die ganze Bubble. System-TTS: deutsche Neural-Stimme, eher männlich, etwas tiefer.

Navi-Ansagen bleiben System-TTS (schnell).

## Chat

Gemini-Prompt: trocken, Siezen, sparsam Master/Sir, Smalltalk mit Rückfrage — kein Helpdesk. Temperatur höher für Variation. Guards schneiden „Gerne“ / „Als KI“ / „Womit kann ich dienen“ weiterhin weg.

Lokal 0,5B bleibt knapp (n_ctx). Qualität sitzt bei Gemini.

## Probe

1. Gemini an, Sprachmodus: erste Worte kommen mit dem ersten Satz, Stimme ruhiger/männlicher.
2. Chat: `Hey, wie geht’s?` — präsent, Rückfrage, kein „Wie kann ich helfen?“.
3. `Bin etwas kaputt.` — kurz da, kein Coach-Essay.
4. Offline-Stimme (System): nicht Pico, möglichst Neural.

## Won’t

Neue TTS-API-Keys, englische Default-Stimme, Duzen, Master in jeder Bubble.
