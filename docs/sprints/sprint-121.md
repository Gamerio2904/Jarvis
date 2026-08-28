# Sprint 121 — Bühne & Hirn Leitentscheidung (`6.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach `5.11` Prompt-Patches; ohne Sideload |
| Ziel-Version | `6.0.0` (Research `6.1`–`6.3`, Bau ab `6.10`) |
| Quelle | PO: Animationen massiv, GUI Over-the-top, Chat/Stimme näher ChatGPT/Grok/Claude, Stimme besser |
| Plan | [`45-next.md`](../45-next.md) |
| Baut auf | Lage Körper/Kugel **CODE** `5.11.0`, Fahrmodus intern, Gemini-TTS Algieba/Kore |

## Ziel

Festschreiben, **was** der Sprung nach `5.11` ist: eine Schiene **Bühne** (Motion, Lage, CarPlay, Sprache) plus **Hirn** (Gemini-Schliff, nicht 0,5B = Claude). Kein Execute.

## Must

| ID | Inhalt |
|----|--------|
| L1 | Ehrlichkeit: 0,5B bleibt Default; Frontier-Ton = Gemini/Groq Opt-in |
| L2 | Over-the-top = Geste/Fokus, nicht 60 fps Idle |
| L3 | Körper/Kugel/Drive/Voice bleiben ehrliche Daten, keine Fake-Gauges |
| L4 | Kein ElevenLabs, kein Marvel-Mesh, kein Live-Satellit |
| L5 | `5.12` Debug-Hintergrund und `4.77` LocateAnything nicht überschreiben |

## Won’t (dieser Sprint)

Code. Sideload. Modellwechsel. Neue Tools.
