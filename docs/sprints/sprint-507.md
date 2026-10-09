# Sprint 507 — Protokoll und Zug-Review

**Version:** `18.44.0` — **PLAN** Must  
**Plan:** [`../104-next.md`](../104-next.md)  
**Voraussetzung:** 503.

## Ziel

Jede Aktion beider Seiten wird protokolliert und nach dem Match ausgewertet.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S507-1 | Trajektorie | `yugioh-selfplay.ts` | Pro Aktion: Merkmale vorher, Kandidaten mit Werten, Wahl, Stellungsbewertung vorher/nachher. |
| S507-2 | Fehlerkandidaten | `yugioh-review.ts` | Aktionen mit großem Bewertungsabfall gegenüber der besten Alternative markieren. |
| S507-3 | Statistik | `yugioh-review.ts` | Aggregation je Archetyp und Aktionstyp (verpasste Angriffe, ungenutzte Effekte, Tempoverlust). |
| S507-4 | Dev-Ansicht | `YugiohDuel.tsx` | Match-Log mit Fehlerkandidaten; Export als JSON. |

## Abbruchkriterium

Review nennt Fehler ohne Beleg aus dem Protokoll oder verändert gespeicherte
Netze.
