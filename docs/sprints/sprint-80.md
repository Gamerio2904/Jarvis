# Sprint 80 — Wake-Word im Hintergrund + Fire TV (`1.28.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.28.0`** |
| Quelle | PO 2026-08-16 |

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| S1 | Wake-Word bei Screen aus | Foreground-Service, CPU-WakeLock, On-Device-STT wo möglich |
| S2 | Andere App = nur Name | Sprachmodus schließt im Hintergrund |
| S3 | Beenden | Schalter, Meldung „Beenden“, Sprachmodus Beenden |
| S4 | Fire TV HDMI 3 | Samsung-Quelle + ADB Play/Pause/Home |

## Probe

1. Sprache → Auf „Jarvis“ hören, Akku-Dialog erlauben.
2. Bildschirm aus, „Jarvis“ — App kommt, Gespräch.
3. Andere App: nur Wake-Word. Meldung **Beenden** stoppt alles.
4. Fire TV: HDMI 3, IP aus Info → Netzwerk, **Fire TV testen** (Ergebnis unter dem Knopf). 2. Gen oft kein WLAN-ADB — dann kein Dialog, Samsung-HDMI trotzdem.

## Won’t

Alexa, Amazon-Cloud, Gerät komplett aus (kein Mikrofon).
