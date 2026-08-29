# Sprint 83 — Stimme & Jarvis-Ton (`1.31.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.31.0`** |
| Quelle | PO 2026-08-17 Stimmenqualität, Latenz, Smalltalk/Jarvis-Formulierung |
| Voraussetzung | Sideload `1.30.0` |

## Ziel

Sprechen fühlt sich schneller und klarer an. Chat klingt nach Jarvis, nicht nach Helpdesk — besonders Smalltalk.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| V1 | Gemini-TTS Charon, Flash zuerst, Timeout → System | Männlicher, nicht minutenlang stumm |
| V2 | Erster Satz sofort TTS | Pipeline nicht auf ganze Bubble warten |
| V3 | Android-Stimme neural/männlich | Pico nicht Default |
| P1 | Gemini-Persona: Smalltalk, Siezen, sparsam Master/Sir | Kein „Gerne, wie kann ich helfen“ |
| P2 | Guards Helpdesk-Phrasen | Scrub bleibt |
| P3 | Version `1.31.0` | Sideload nach 1.30.0 |

## Probe

Siehe [`25-next.md`](../25-next.md).

## Won’t

Duzen-Default, neue Cloud-Keys, Navi über Gemini-TTS.
