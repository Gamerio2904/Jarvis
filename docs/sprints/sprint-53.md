# Sprint 53 — Ort & Wetter (`1.3.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.3.0`** |
| Quelle | PO 2026-08-15 |

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| W1 | „Wetter heute“ / „Temperatur hier“ nutzt Standort (einmal fragen) | Ohne Ortsname |
| W2 | Zahlen von Open-Meteo, Quelle sichtbar; Research an + Gemini ergänzt | Kein Fake-Wetter |
| W3 | Dienst down: ehrliche Absage, kein Raten | Kein Halluzinieren |
| W4 | Version `1.3.0` + APK | Sideload |

## Probe

1. Standort erlauben → „Wetter heute“ → °C + Open-Meteo-Link.
2. „Wetter in München“ ohne Standort.
3. Einstellungen → letzter Ort / Ort vergessen.

## Won’t

Tracking im Hintergrund, Wetter-Widget.
