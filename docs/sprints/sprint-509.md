# Sprint 509 — Nachweis-Datei, Verify und Elo-Liga

**Version:** `18.45.0` — **PLAN** Must  
**Plan:** [`../104-next.md`](../104-next.md)  
**Voraussetzung:** 507 und 508.

## Ziel

Ob die KI besser wird, ist an einer herunterladbaren Datei nachprüfbar, nicht nur behauptet.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S509-1 | Nachweis-Datei | `yugioh-proof.ts` | JSON plus Kurzbericht `.md`: App-/Netz-Version, SHA-256 der Gewichte vor/nach Training, Seeds, Hyperparameter, Lernkurve, Messung je Gegner (Heuristik, Vorversion, Zufall) mit Wilson-95-%-Intervall, Winrate je Archetyp inkl. Holdout, Rohdaten aller Testspiele, Gate-Entscheidung, Engine-Stand. |
| S509-2 | Verify | `yugioh-proof.ts` | Format/Version prüfen, Hash neu berechnen, Testspiele mit festen Seeds und **festem Knotenbudget** (kein Zeitlimit) nachspielen, Zug für Zug vergleichen, Statistik neu rechnen; bei Abweichung erste Stelle (Spiel, Zug, erwartet/tatsächlich) melden. |
| S509-3 | Versteckter Seed-Satz | `yugioh-proof.ts` | Zweiter Testseed-Satz, der nur beim Verify benutzt wird, gegen Überanpassung auf die Trainings-Testspiele. |
| S509-4 | Elo-Liga | `yugioh-league.ts` | Checkpoints plus Referenzen (Zufall, Heuristik als Anker 1000); feste Seeds, beide Zugseiten; Bradley-Terry-Anpassung mit Unsicherheitsband; Paar-Tabelle gegen Kreisen. Engine-Änderung markiert die Liga als neu zu spielen. |
| S509-5 | Optionale Blindprobe | `YugiohDuel.tsx` | Du spielst eine feste Duellzahl gegen alte/neue Version ohne Kenntnis der Zuordnung; Ergebnis kommt in die Datei. |
| S509-6 | Tests | `test-yugioh-duel.mjs` | Verify erkennt manipulierten Hash, geänderte Gewichte und geänderte Ergebnisse; gleiche Datei ergibt gleiches Verify; Elo steigt für künstlich stärkere Version. |

## Abbruchkriterium

Verify meldet grün bei veränderter Datei, oder Nachspielen ist nicht
reproduzierbar.
