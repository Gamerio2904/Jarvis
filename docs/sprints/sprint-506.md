# Sprint 506 — Dev-Umschalter Game ⇄ Dev

**Version:** `18.43.0` — **CODE** Must  
**Plan:** [`../104-next.md`](../104-next.md)  
**Voraussetzung:** keine.

## Ziel

Das Yu-Gi-Oh!-Fenster startet als Game-Overlay; ein Button wechselt ins
Entwicklermenü und bei erneutem Klick zurück.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S506-1 | Modus | `YugiohDuel.tsx` | Zustand `mode: 'game' \| 'dev'`, Standard `game`. |
| S506-2 | Dev-Inhalt | `YugiohDuel.tsx` | Builder, Trainingslabor, Netzlabor und Self-Play-Steuerung hinter dem Schalter. |
| S506-3 | Zustand erhalten | `YugiohDuel.tsx` | Laufendes Duell, Log und Training überstehen den Wechsel; Stepper pausiert im Dev-Modus. |
| S506-4 | Bedienung | `yugioh-duel.css` | Button erreichbar auf Handy/Tablet, Tastatur und Screenreader-Beschriftung. |

## Abbruchkriterium

Wechsel verliert Duellstand oder Trainingsfortschritt.
