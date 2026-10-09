# Sprint 505 — Live-Match-Ansicht

**Version:** `18.43.0` — **CODE** Must  
**Plan:** [`../104-next.md`](../104-next.md)  
**Voraussetzung:** 503. Die Statusblase für Ultron ist bereits im Test-Build `18.31.7`.

## Ziel

Ein KI-gegen-KI-Match läuft sichtbar im Overlay, jeder Schritt nacheinander.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S505-1 | Zuschauermodus | `YugiohDuel.tsx` | Board ohne Spielereingaben; beide Seiten über denselben Stepper. |
| S505-2 | Blasen beider Seiten | `YugiohDuel.tsx`, `yugioh-duel.css` | Blase zeigt Aktion der ziehenden Seite, Seite klar benannt. |
| S505-3 | Tempo | `YugiohDuel.tsx` | Echtzeit / schnell / ohne Anzeige; Pause und Abbruch jederzeit. |
| S505-4 | Reduced Motion | `yugioh-duel.css` | Animationen entfallen bei `prefers-reduced-motion`. |

## Abbruchkriterium

Anzeige blockiert die UI, springt Schritte oder lässt sich nicht pausieren
oder abbrechen.
