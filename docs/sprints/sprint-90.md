# Sprint 90 — Flüssig (`1.37.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.37.0`** |
| Quelle | PO 2026-08-17 flüssiger laufen |
| Voraussetzung | `1.36.0` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Dieselbe App, weniger Ruckler und Hänger: Chat, Fahrmodus-Overlay, Wake-Word, Voice-Loop, TV-Launch, Widget.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| F1 | Stream/Chat ohne Ruckler | Tokens ohne Layout-Sprung, bleibt am Ende |
| F2 | Fahrmodus Overlay-FPS | Karte + Spotify ohne Stottern |
| F3 | Wake-Word | Weniger Falsch-Treffer; „Jarvis, öffne Netflix“ eine Äußerung |
| F4 | Voice-Loop | Nach Antwort wieder `Ich höre` ohne Pause-Hänger |
| F5 | TV-Launch | `Öffne Netflix` nicht hinter Lookup; ehrliche Fehler |
| F6 | Widget + Standort + Settings | Termin/Wetter/Mic aktuell; Permission ehrlich; Gemini/TV findbar |
| F7 | Version `1.37.0` | Sideload |

## Probe

Siehe [`28-next.md`](../28-next.md) `1.37.0`.

## Won’t

Neues GUI-Theme, neues Widget-Layout als Produkt.
