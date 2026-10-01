# Sprint 427 — Inspiration

**Version:** `18.25.0` — **CODE** Must
**Plan:** [`97-next.md`](../97-next.md) §2
**Voraussetzung:** 426. Die Rahmen können drei Spalten zeichnen.

## Ziel

Ein Satz zu einem Baustein zeigt drei feste Muster.
`Die erste` merkt das Muster für den nächsten Entwurf.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S427-1 | Muster | `entwurf-muster.ts` | Die Tabelle aus Plan §2, fest im Code. Drei Muster je Baustein. Unbekannter Name: `Den Baustein gibt es nicht.` und die sechs Namen. Kein Netz, kein Paket |
| S427-2 | Fläche | `EntwurfStage.tsx` | Dieselben Rahmen. Beschriftung wie in der Tabelle. Kein Arbeitstext ans Modell |
| S427-3 | Merken | `store.ts` | `Die erste` bis `Die dritte` schreibt `entwurf_muster`. Das nächste `Entwirf` setzt dieses Muster auf Bausteine dieser Art. `Entwurf zu` leert `entwurf_muster` |

## Won't

ReactBits, eine siebte Art, eine Schleife.

## Abbruchkriterium

`Inspiration zum Knopf` lädt eine Adresse oder installiert ein Paket.
