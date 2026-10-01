# Sprint 417 — Sätze und Speicher

**Version:** `18.24.0` — **PLAN** Must
**Plan:** [`96-next.md`](../96-next.md) §3 §5
**Voraussetzung:** Tafel `18.22` und Ablauf `18.23` bleiben. Kein neuer Agent.

## Ziel

`Entwirf`, Inspiration, Wahl und `Entwurf zu` erkennt der Parser.
Eine Zeile lässt sich speichern. Noch kein Modell, keine Rahmen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S417-1 | Parser | `entwurf-parse.ts` | Formen aus Plan §5. `Entwirf das` ohne Rest nimmt die vorige Nutzernachricht, sonst `Was soll der Entwurf zeigen?`. Text nach `Entwirf eine App:` oder `Entwirf:` ist der Arbeitstext, höchstens 2000 Zeichen. Inspiration trifft nur die sechs Bausteine. `Die erste` bis `Die dritte` nur bei offenen Rahmen. `Entwurf zu` schließt |
| S417-2 | Speicher | `store.ts` | Store `drafts`, IndexedDB 14. Form aus Plan §3. Einstellungen `entwurf_id` und `entwurf_muster`, nicht flüchtig, kein `entwurf_json`. Bis Sprint 418 antwortet `Entwirf` mit `Entwurf nicht gezeichnet.` und legt keine Zeile an |
| S417-3 | Nachbarn | `board-parse.ts` `ablauf-parse.ts` | `Simuliere Kalender` bleibt `sim`. `Plane das` bleibt der Ablauf. `Mach einen Sprintplan` bleibt `fill_plan`. `nächster Lidl` bleibt `poi`. `Hintergrund blau schwarz` bleibt Thema. Ohne Rahmen fällt `Die erste` durch |

## Won't

Modell, Rahmen, Version, Testkarten, `18.24.6`.

## Abbruchkriterium

`Entwirf` legt eine Idee an, oder `Simuliere Kalender` öffnet drei Rahmen.
