# Sprint 489 — Konflikte sicher erhalten

**Version:** `18.37.0` — **CODE\*** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** 488.

**Ist im Arbeitsbaum:** Nebenläufige oder gleiche, aber inhaltlich verschiedene
Revisionen blockieren den automatischen Transfer. Bei Konflikt wird ein
kurzlebiges Ticket aus lokaler und entfernter Revision erzeugt; die Auswahl
„Übernimm den Tablet-Stand“ oder „Übernimm den Handy-Stand“ wird daran
gebunden und schlägt fehl, sobald sich einer der Stände geändert hat.
Bedienoberfläche, Recovery-Goldtests und Geräteabnahme bleiben offen.

## Ziel

Gleichzeitige Änderungen überschreiben einander nicht. Der Nutzer kann einen
Stand ausdrücklich als Quelle auswählen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S489-1 | Konfliktstatus | `sync-compare.ts` `tablet-sync.ts` | Nichtdominante Revisionen als Konflikt markieren; keine Uhrzeit-/Last-write-wins-Regel. |
| S489-2 | Auswahl | Sync-UI/Chat | Quelle und Zielgerät verständlich nennen; Bestätigung an genau beide verglichenen Revisionen binden. |
| S489-3 | Rückfall | `backup.ts` | Abbruch, Nein, Schemafehler und gleichzeitige Änderung behalten beide Stände und den Wiederherstellungspunkt. |

## Abbruchkriterium

Unaufgelöster Konflikt überschreibt einen Stand oder eine alte Bestätigung
überschreibt eine neuere Revision.
