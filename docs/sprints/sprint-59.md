# Sprint 59 — Wetter-Nachfragen (`1.9.0`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** |
| Ziel-Version | **`1.9.0`** |
| Quelle | PO 2026-08-15 |

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| F1 | Nach einer Wetterlage: „und morgen?“, „und das Wochenende?“, „und der Schirm?“ | Gleicher Ort, neue Frage |
| F2 | „und in Berlin?“ wechselt den Ort, behält die Art der Frage | Kein komplettes Kommando nötig |
| F3 | Letzter Ort bleibt merken (wie jetzt der Standort-Cache) | Auch nach App-Wechsel kurz gültig |
| F4 | Weiter Open-Meteo, Lage + Tipp, kein Raten | Wie `1.6` |
| F5 | Version `1.9.0` + APK | Sideload |

## Probe

1. „Wetter heute“ → „und morgen?“ → Morgenlage für denselben Ort.
2. „und in München?“ → München, gleiche Art (heute/Schirm/anziehen).
3. Ohne vorheriges Wetter: ehrlich nachfragen oder „Wetter in …“ vorschlagen.

## Won’t

Mehrere Städte gleichzeitig, Pollen, Widget (das ist `1.10`).
