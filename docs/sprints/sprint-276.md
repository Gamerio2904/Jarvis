# Sprint 276 — Fahrmodus aufräumen, Kalender ohne Autofokus

**Version:** `18.1.0` — **CODE** Should
**Plan:** [`71-audit.md`](../71-audit.md) §3e Oberfläche, §4

## Ziel

Beim Verlassen des Fahrmodus enden Stimme und Mikrofon. Der Kalender zieht
den Fokus erst, wenn das Terminblatt offen ist.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S276-1 | Unmount | `DriveMode.tsx` | Cleanup: `stopListen`, `stopSpeak`, `endVoiceSession`. Mic-Knopf bleibt klickbar und bricht ab (`hearGen`), nicht `disabled` während des Hörens |
| S276-2 | Fokus | `Calendar.tsx` | `titleRef.focus()` nur bei `sheetOpen`. Blatt `inert` + `pointer-events: none` wenn zu — sonst fokussiert WebView das versteckte Titel-Feld |

## Abbruchkriterium

Stimme läuft weiter, nachdem der Fahrmodus zu ist. Kalender öffnet die Tastatur
ohne dass jemand einen Termin anlegt.
