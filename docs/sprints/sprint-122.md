# Sprint 122 — Motion-Kern + GUI Over-the-top (`6.10`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | erste spürbare Fläche nach Leit `6.0` |
| Ziel-Version | `6.10.0` (Research `6.1`–`6.3` in diesem Sprint) |
| Quelle | PO: flüssig, hochwertige GUI, Mikrointegration |
| Plan | [`45-next.md`](../45-next.md) |
| Baut auf | `index.css` Motion-Tokens, Lage-Split `4.53`, GUI Premium `3.18.1` |

## Ziel

Ein rAF-/Motion-Budget für Chat, Lage und Overlays. Reduced-Motion und Hidden-Tab. Chat-Chrome: Tool-Chip, Token-Reveal, Composer/Mic-Mikro. Kein neues 3D-Framework.

## Must

| ID | Inhalt |
|----|--------|
| M1 | Spike FPS auf Mittelklasse-Handy: 30 fps Default, 60 nur bei Geste |
| M2 | Eine 3D-Sicht gleichzeitig; rAF aus wenn Tab hidden |
| M3 | Reduced-motion: dieselben Daten, keine leere Lage |
| M4 | Tool-Chip + Lage-Mitlauf (Organ/Pin) ohne zweiten Fetch |
| M5 | Composer/Wake-Bubble Pulse aus echtem State, nicht Deko-Loop |

## Won’t (dieser Sprint)

Körper-Cinematic (123). Drive-HUD (124). TTS-Picker (125). 1,5B-Modell. Sideload.
