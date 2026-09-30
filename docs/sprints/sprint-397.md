# Sprint 397 — Gold und Fixture

**Version:** `18.20.0` — **PLAN** Must
**Plan:** [`92-next.md`](../92-next.md)
**Voraussetzung:** 392–396.

## Ziel

Parser-Gold und ein Render gegen ein lokales Testvideo. Kein YouTube im Test.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S397-1 | Gold | `eval/corpus.ts` | Schnitt+URL → `clip`. `YouTube auf dem Fernseher` → `tv`. `Wie gut ist Dune` → `film`. `Öffne TikTok` → `wont`. Nackte URL ohne Schnittwort nicht `clip` |
| S397-2 | Rang | `test-clip-rank.mjs` | Fixture-json3. Summe > 180 und Start hinter dem Ende fallen weg |
| S397-3 | Render | Fixture-MP4, 4 s, stumm | Zwei Intervalle, ASS enthält beide Titel, Ausgabe 1080×1920, Dauer = Summe |
| S397-4 | Job | `clip.ts` | Ein Job, TTL 30 min. `Clip-Status` ohne Job: „Kein Schnitt läuft.“ |
| S397-5 | Version | Docs | Erst wenn ein Windows-PC eine Datei geschrieben hat: App `18.20.0`. Bis dahin APK `18.19.0` |

## Won't

Live-YouTube in CI. Social-Token. Merge `#152`.

## Abbruchkriterium

Ein Gold-Satz aus `tv` oder `film` wird rot, weil `clip` auf jede URL scored.
