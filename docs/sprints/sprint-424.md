# Sprint 424 — Sätze und Speicher

**Version:** `18.25.0` — **PLAN** Must
**Plan:** [`97-next.md`](../97-next.md) §3 §5
**Voraussetzung:** Tafel `18.22`, Ablauf `18.23`, Portfolio und Scan `18.24.6` bleiben. Kein neuer Agent.

## Ziel

`Entwirf`, Inspiration, Wahl und `Entwurf zu` erkennt der Parser.
Eine Zeile lässt sich speichern. Noch kein Modell, keine Rahmen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S424-1 | Parser | `entwurf-parse.ts` | Formen aus Plan §5. `Entwirf das` ohne Rest nimmt die vorige Nutzernachricht, sonst `Was soll der Entwurf zeigen?`. Text nach `Entwirf eine App:` oder `Entwirf:` ist der Arbeitstext, höchstens 2000 Zeichen. Inspiration trifft nur die sechs Bausteine. `Die erste` bis `Die dritte` nur bei offenen Rahmen. `Entwurf zu` schließt |
| S424-2 | Speicher | `store.ts` | Store `drafts`, IndexedDB 15. Form aus Plan §3. Einstellungen `entwurf_id` und `entwurf_muster`, nicht flüchtig, kein `entwurf_json`. `portfolio` bleibt auf seiner Zeile. Bis Sprint 425 antwortet `Entwirf` mit `Entwurf nicht gezeichnet.` und legt keine Zeile an |
| S424-3 | Nachbarn | `board-parse.ts` `ablauf-parse.ts` `portfolio-parse.ts` `room-scan.ts` | `Simuliere Kalender` bleibt `sim`. `Plane das` bleibt der Ablauf. `Go` bleibt Portfolio. `Scanne den Raum` und `Scanne den Apfel` bleiben der Scan. `Mach einen Sprintplan` bleibt `fill_plan`. `nächster Lidl` bleibt `poi`. `Zeig mir London` bleibt die Kugel. Ohne Rahmen fällt `Die erste` durch |

## Won't

Modell, Rahmen, Version, Testkarten, ein Anheben von `18.24.6`.

## Abbruchkriterium

`Entwirf` legt eine Idee oder ein Portfolio-Projekt an, oder `Simuliere Kalender` öffnet drei Rahmen.
