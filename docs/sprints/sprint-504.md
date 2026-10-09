# Sprint 504 — Zugsuche mit Kombinationen

**Version:** `18.42.0` — **PLAN** Must  
**Plan:** [`../104-next.md`](../104-next.md)  
**Voraussetzung:** 503.

## Ziel

Der Zug wird aus bewerteten Aktionsfolgen gewählt statt aus Einzelaktionen,
sodass Kombinationen berücksichtigt werden.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S504-1 | Beam Search | `yugioh-search.ts` | Tiefe 3–4, Breite 5–6 über `candidateActions`; Zustand per Kopie, Engine bleibt rein. |
| S504-2 | Stellungsbewertung | `yugioh-search.ts` | LP-Differenz, Feld, Hand, Ressourcen; später durch Value-Kopf ersetzbar. |
| S504-3 | Verdeckte Hand | `yugioh-search.ts` | Gegnerhand nur als Stichprobe aus bekanntem Deck; mehrere Stichproben gemittelt. |
| S504-4 | Zeitbudget | `yugioh-search.ts` | Hartes Limit pro Zug (z. B. 300 ms) mit Rückfall auf Heuristik. |
| S504-5 | Tests | `test-yugioh-duel.mjs` | Suche findet bekannte Zweizug-Kombination; liest keine verdeckten Karten; hält Budget. |

## Abbruchkriterium

Suche nutzt verdeckte Information, überschreitet das Budget oder spielt auf
Holdout-Seeds schlechter als die Heuristik ohne dokumentierte Begründung.
