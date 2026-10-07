# Sprint 467 — Befehlsbereiche und Grenzen festlegen

**Version:** `18.32.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Release-/Geräte-Gate `18.31.0` bestanden.

## Ziel

Ultron hat eine überschaubare, testbare Liste von Funktionen, auf die ein
Sprachbefehl geroutet werden kann, einschließlich eines sicheren
„unklar/nachfragen“-Falls.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S467-1 | Router-Inventar | Router, Agentenkatalog, Tests | Vorhandene Kategorien und tatsächliche Handler im Code erfassen; keine neuen Funktionen behaupten |
| S467-2 | Verwechslungsfälle | Eval-Goldfälle | Ähnliche Sätze zu Todo, Einkauf, Notiz, Kalender, Planung und Chat gegeneinander abgrenzen |
| S467-3 | Unklar-Regel | Router-Vertrag | Festlegen, wann der Router keinen Handler auswählt und stattdessen eine Rückfrage nötig ist |
| S467-4 | Baseline | Eval-Auswertung | Für bestehende Testfälle aktuelle richtige, falsche und unsichere Zuordnungen dokumentieren |

## Abbruchkriterium

Eine Kategorie ohne vorhandenen Handler oder klare Soll-Regel wird als Lücke
festgehalten, nicht mit einem erfundenen Ziel-Label versehen.
