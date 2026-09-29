# Sprint 383 — Werte-Leiste und Shortcuts

**Version:** `18.18.0` — **CODE + APK** Must
**Plan:** [`90-next.md`](../90-next.md)
**Voraussetzung:** 382.

## Ziel

Rechts klappt eine kleine Werte-Leiste. Mini-Chat und Sprach-Kugel liegen
als Shortcuts auf dem Homescreen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S383-1 | Leiste | `GlanceRail.tsx` `glance-snap.ts` | Rechts Mitte. Termin/Timer/Wetter/Einkauf/Key — nichts Erfundenes |
| S383-2 | Mini-Chat | `MiniChat.tsx` | Aufklappen, Senden, Groß → voller Chat |
| S383-3 | Kugel | `VoiceSphere.tsx` `VoiceMode.tsx` | CSS-3D, Pulse beim Sprechen. Shortcut startet kompakt, Sprache-Kachel volle Folie |

## Won’t

WebGL, Lottie, Now-Karten, erfundene Live-Werte.

## PO-Prüfung

Tab „Werte“ zeigt Uhr und „Nichts geplant“ ohne Termin. Kugel pulsiert nur mit Stimme.
