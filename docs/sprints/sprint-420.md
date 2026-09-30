# Sprint 420 — Öffnen und Archiv

**Version:** `18.24.0` — **PLAN** Must
**Plan:** [`96-next.md`](../96-next.md)
**Voraussetzung:** 419. Die Karten stehen auf der Mitte.

## Ziel

Ein Tipp oder `Zeig Projekt …` öffnet die Dateiliste. Der Schlitz und
`Schredder` legen die Karte ins Archiv und lassen die Dateien liegen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S420-1 | Tipp | `PortfolioStage.tsx` `Shredder.tsx` | Bewegung unter 8 px öffnet. Darüber beginnt das Ziehen. `onShred` setzt `archived` true. Antwort `Tik Tak To liegt im Archiv.` Dateien, Mappe und Hausstand bleiben |
| S420-2 | Liste | `PortfolioStage.tsx` `index.css` | Dateien in der Reihenfolge aus Plan §3, Bewegung 280 ms, Versatz 50 ms, Skala 0,96. Dahinter Deckkraft 0,45, kein Finger. JSON zeigt Titel und Sprintzeilen. Wenig Bewegung nur Deckkraft |
| S420-3 | Sätze | `portfolio-parse.ts` `portfolio.ts` | `Zeig Projekt`, `Schredder`, `Archivier Projekt`, `Hol Projekt … zurück`, `Portfolio` als Zurück. Dieselben Funktionen wie Tipp und Schlitz. Zwei Treffer nennen die vollen Titel |

## Won't

Beispiele, ein Tipp, der schreddert, stilles Löschen.

## Abbruchkriterium

`onShred` oder `Schredder` entfernt die Zeile aus dem Store, oder ein Tipp ohne Ziehen archiviert.
