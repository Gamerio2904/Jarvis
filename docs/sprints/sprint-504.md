# Sprint 504 — Zugsuche mit Kombinationen

**Version:** `18.42.0` — **CODE*** Must (Engine; UI folgt in 505/506)  
**Plan:** [`../104-next.md`](../104-next.md)  
**Voraussetzung:** 503.

## Ziel

Der Zug wird aus bewerteten Aktionsfolgen gewählt statt aus Einzelaktionen,
sodass Kombinationen berücksichtigt werden.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S504-1 | Beam Search mit iterativer Vertiefung | `yugioh-search.ts` | Tiefe 1, 2, 3 … über `candidateActions` (Breite 5–6); nach jeder Stufe steht ein gültiger bester Zug. Zustand per Kopie, Engine bleibt rein. |
| S504-2 | Stellungsbewertung | `yugioh-search.ts` | LP-Differenz, Feld, Hand, Ressourcen; später durch Value-Kopf ersetzbar. |
| S504-3 | Verdeckte Hand | `yugioh-search.ts` | Gegnerhand nur als Stichprobe aus bekanntem Deck; mehrere Stichproben gemittelt. |
| S504-4 | Zeitprofile | `yugioh-search.ts` | Profil „Spiel“: kein festes kurzes Limit, Abbruch bei Stabilität (bester Zug über zwei Stufen gleich, Vorsprung vor Platz 2 stabil), hartes Limit 30 s gegen Schleifen; danach bester bisheriger Zug. Profil „Training“: kleines festes Budget, damit Self-Play genug Daten liefert. Zusätzlich Knoten-/Tiefenobergrenze (Speicher auf dem Handy). |
| S504-6 | Stellungs-Tabelle | `yugioh-search.ts` | Bereits bewertete Stellungen werden gemerkt; Anzahl der Stichproben für die verdeckte Hand wächst mit der Tiefe. |
| S504-5 | Tests | `test-yugioh-duel.mjs` | Suche findet bekannte Zweizug-Kombination; liest keine verdeckten Karten; hält Budget. |

## Abbruchkriterium

Suche nutzt verdeckte Information, überschreitet 30 s bzw. das Trainingsbudget oder spielt auf
Holdout-Seeds schlechter als die Heuristik ohne dokumentierte Begründung.
