# Sprint 412 — Fenster auf der Tafel

**Version:** `18.23.0` — **CODE** Must
**Plan:** [`95-next.md`](../95-next.md)
**Voraussetzung:** 411. Der Ablauf steht auf `warten` oder ist leer.

## Ziel

Das Planfenster liegt mittig über der Tafel und schreibt die Zeilen
nacheinander. Der Knopf **So** schickt denselben Satz wie der Parser.
Noch kein Lauf.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S412-1 | Fläche | `AblaufWindow.tsx` `index.css` | Fest, kein Stück, nicht ziehbar. Ab 900 px Breite `min(720px, 78vw)`, Höhe höchstens `min(78vh, 640px)`, Glas wie `.board-piece`, Ecken 18 px. Darunter volle Breite mit 12 px Rand, Spalten untereinander, Scroll nur im Fenster. Öffnen 280 ms von Skala 0,96. `prefers-reduced-motion`: 120 ms Deckkraft, alles sofort sichtbar |
| S412-2 | Inhalt | `AblaufWindow.tsx` | Kopf **Ablauf**, Titel, Status. Links **Arbeit**, rechts **Wer**. Band **Gleichzeitig**, weitere Bänder **Danach**. Kartenname aus `meta.ts`. Graue Zeile unter den Bändern. Leer: nur der Leersatz, kein Knopf. Sonst Knopf **So** und `Sag, was anders sein soll.` |
| S412-3 | Schreiben | `AblaufWindow.tsx` `BoardStage.tsx` | Zeilen links alle 180 ms, Schreibmarke nur an der aktuellen Zeile. Karten einer Welle alle 80 ms, Text als ganze Zeile. Dann Status `warten`. Stücke auf Deckkraft 0,45, kein Finger. Mini-Chat bleibt. `Räum den Tisch` trifft das Fenster nicht |

## Won't

Änderung einer Karte, `runAgent`, Testkarten, Version.

## Abbruchkriterium

Das Fenster ist ein zehntes Stück in `tischplatte_pieces_json`, oder der Tisch lässt sich schieben, während es offen ist.
