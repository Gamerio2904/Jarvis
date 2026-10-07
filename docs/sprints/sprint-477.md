# Sprint 477 — Rückfrage sicher fortsetzen

**Version:** `18.34.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Sprint 476.

## Ziel

Fehlende Pflichtangaben werden in einer kurzen Frage erbeten. Eine Antwort
setzt nur die dazugehörige Aktion im richtigen Gespräch fort.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S477-1 | Eine gezielte Rückfrage | Pending-/Dialoglogik | Zuerst die wichtigste fehlende Angabe erfragen, statt mehrere Dinge zu vermischen |
| S477-2 | Antwort eindeutig binden | Pending-State und Tests | Antwort an Aktion, Gespräch und noch fehlendes Feld binden |
| S477-3 | Abbruch/Wechsel behandeln | Dialogtests | Stopp, Themenwechsel, App-Neustart und veraltete Antwort sicher behandeln |
| S477-4 | Erst nach Vollständigkeit handeln | Tool-Gates | Aktion erst ausführen, wenn alle Pflichtangaben vorhanden und geprüft sind |

## Abbruchkriterium

Eine verspätete oder fremde Antwort darf keine andere oder veraltete Aktion
auslösen.
