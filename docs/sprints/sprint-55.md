# Sprint 55 — Sprachmodus (`1.5.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** (`1.5.1` Stimme + Screen-Fix) |
| Priorität | **MUST** — Riesenupdate nach `1.1`–`1.4` |
| Ziel-Version | **`1.5.0`** |
| Quelle | PO 2026-08-15: wie ChatGPT, Gespräch nicht aufnehmen; Shortcut Homescreen |

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| V1 | Sprachmodus: Sie sprechen, Jarvis antwortet mit Stimme, Sie können weiterreden | Kein „Aufnahme speichern / abspielen“ |
| V2 | So menschlich wie möglich: kurze Turns, Unterbrechen möglich, kein Vorlese-Roboter | Live-Gefühl |
| V3 | Homescreen-Shortcut „Jarvis hören“ öffnet direkt den Modus | Ein Tippen |
| V4 | Version `1.5.0` + APK | Sideload |

## Wake-Word (nicht Must in `1.5`)

Gerät **aus** → unmöglich. Screen aus, Handy an → nur mit nativem Dienst, Akku, OEM-Risiko. Eigene Stufe nach `1.5`, wenn PO das trotzdem will.

## Probe

1. Chat → **Hören** oder Sidebar → Jarvis hören.
2. Sprechen, Antwort hören, weiterreden. Antippen unterbricht.
3. Einstellungen → Shortcut auf Homescreen, oder App-Icon lange drücken → Jarvis hören.
4. Keine Audiodatei im Chat — nur Text.

## Won’t

Dauerhafte Cloud-Aufnahme, Voice auf dem ausgeschalteten Handy, Alexa-Ersatz.
