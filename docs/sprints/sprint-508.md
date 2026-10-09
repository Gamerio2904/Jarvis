# Sprint 508 — Lernen, Liga und Gate

**Version:** `18.44.0` — **PLAN** Must  
**Plan:** [`../104-next.md`](../104-next.md)  
**Voraussetzung:** 504 und 507.

## Ziel

Aus Self-Play-Daten lernen, ohne die Spielstärke zu verschlechtern.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S508-1 | Value-Kopf | `yugioh-net.ts` | Zusätzlicher Wertkopf, Ziel: Matchausgang; Speicherformat versioniert, `v1` bleibt lesbar. |
| S508-2 | Suchgestützte Policy | `yugioh-net.ts` | Policy wird zur Suchwahl hingezogen; REINFORCE mit Baseline bleibt als Vergleich. |
| S508-3 | Liga | `yugioh-selfplay.ts` | Checkpoint-Pool plus feste Referenzgegner (Heuristik, Vorversion); Model Soup über Checkpoints. |
| S508-4 | Gate | `yugioh-selfplay.ts` | Neue Version nur speichern, wenn sie auf festen Holdout-Seeds nicht schlechter ist; sonst Rückfall. |
| S508-5 | Doku | `yugioh-duel.md` | Gemessene Zahlen und Grenzen eintragen; keine Behauptung ohne Messung. |

## Abbruchkriterium

Version wird gespeichert, obwohl Holdout-Winrate gegen Heuristik oder
Vorgängerversion sinkt.
