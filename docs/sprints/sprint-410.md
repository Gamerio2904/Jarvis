# Sprint 410 — Sätze und Speicher

**Version:** `18.23.0` — **PLAN** Must
**Plan:** [`95-next.md`](../95-next.md)
**Voraussetzung:** Tafel `18.22` bleibt die Fläche. Kein neuer Agent.

## Ziel

`Plane das`, Schließen, Annehmen und die drei Änderungssätze erkennt der
Parser. Ein Ablauf lässt sich speichern. Noch kein Modell, kein Fenster,
kein Lauf.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S410-1 | Parser | `ablauf-parse.ts` | Formen aus Plan §4. `Plane das` ohne Rest nimmt die vorige Nutzernachricht, sonst `Was soll geplant werden?`. Text nach `Plane das:` ist der Arbeitstext, höchstens 2000 Zeichen. `So` und `Übernehmen` nur, wenn ein Ablauf `warten` ist. `Ja` nur dann und nur ohne anderen offenen Wunsch. `Plan zu` und `Fenster zu` schließen. Die drei Änderungssätze treffen eine Karte über Label oder Id |
| S410-2 | Speicher | `store.ts` | Store `plans`, IndexedDB 13. Eine Zeile pro Ablauf, Form aus Plan §2. Einstellungen nur `ablauf_id`, nicht flüchtig, kein `ablauf_json`. Keine neue Idee, nur weil geplant wird. Bis Sprint 411 antwortet `Plane das` mit `Plan nicht übernommen.` und legt keine Zeile an. Der Hausstand ist Sprint 416 |
| S410-3 | Nachbarn | `conflicts.ts` `idea-parse.ts` | `Mach einen Sprintplan`, `Füll den Plan`, `Plane Idee` bleiben `fill_plan`. `Such Open Source … und plane Sprints` bleibt `board`. `nächster Lidl` bleibt `poi`. `Hintergrund blau schwarz` bleibt Thema. Ohne offenen Ablauf fällt `So` durch wie bisher |

## Won't

Modell, Fenster, `runAgent` für mehrere Karten, Testkarten, Version.

## Abbruchkriterium

`Plane das` legt eine Idee an, oder `Füll den Plan` öffnet den Ablauf.
