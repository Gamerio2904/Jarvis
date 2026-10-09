# Sprint 510 — Training-Overlay mit Analyse und Verify-Gate

**Version:** `18.45.0` — **CODE** Must  
**Plan:** [`../104-next.md`](../104-next.md)  
**Voraussetzung:** 506, 508 und 509.

## Ziel

„Trainieren“ im Dev-Menü öffnet ein Overlay: links das Spielfeld live, rechts
die Dev-Infos; danach Analyse, grüner Verify-Button und gegatetes Speichern.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S510-1 | Overlay | `YugiohDuel.tsx`, `yugioh-duel.css` | Links Live-Board, rechts Match-Nr., Decks, Suche (Tiefe, bester Zug, Alternativen), Lernkurve, Winrate, Elo. Pause und Abbruch; Abbruch speichert nichts. |
| S510-2 | Tempo | `YugiohDuel.tsx` | Voll sichtbar / schnell (Board nur jedes n-te Match) / nur Dev-Infos. |
| S510-3 | Analyse | `YugiohDuel.tsx` | Nach dem Lauf automatisch: Fehlerkandidaten, Statistik, Messung vor/nach auf festen Testspielen. |
| S510-4 | Verify-Button | `YugiohDuel.tsx` | Grüner Button erst nach der Analyse, Fortschrittsbalken, UI blockiert nicht. |
| S510-5 | Zwei Bedingungen | `yugioh-proof.ts` | Speichern nur bei Verify grün **und** Gate bestanden. Verify grün ohne Verbesserung: „Messung korrekt, aber keine Verbesserung“, nicht speichern. |
| S510-6 | Download | `YugiohDuel.tsx` | Nachweis-Datei immer ladbar; bei Fehlern mit Abweichungen zum Debuggen. |
| S510-7 | Speichern mit Rückfall | `yugioh-net.ts` | Alter Stand bleibt als vorheriger Checkpoint erhalten; Zwischenstände nur als Entwurf; bei Hintergrund/Schließen sauberer Abbruch oder fortsetzbar. |

## Abbruchkriterium

Eine Version wird ohne grünes Verify oder ohne bestandenes Gate aktiv, oder der
alte Stand geht verloren.
