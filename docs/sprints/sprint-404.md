# Sprint 404 — Stücke auf der Tafel

**Version:** `18.22.0` — **PLAN** Must
**Plan:** [`94-next.md`](../94-next.md)
**Voraussetzung:** Tischplatte `18.19` bleibt die Fläche. Kein zweites Brett.

## Ziel

Neun Stücke mit echten Daten. Sieben sichtbar, Module und Draht im
Datenmodell beiseite. Noch ohne freies Schieben.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S404-1 | Modell | `board-pieces.ts` | Ids: Sprintliste, PSP, Auftrag, Uhr, Quellen, Termin, Jobleiste, Module, Draht. Startlagen aus dem Plan. `off` für Module und Draht |
| S404-2 | Daten | `Workbench.tsx` | Sprintliste: offene Idee, sonst geplante Katalogzeilen mit Nummer und einer Zeile. PSP drei Ebenen. Uhr aus der Gerätezeit, Minutenring. Quellen aus `last_research_json`. Termin über `listEvents`. Jobs aus `board_jobs_json`. Leere Sätze wörtlich aus dem Plan. Die sieben Stücke liegen zusammen. `Zeig Module` und `Simulier …` bleiben bis 407 die heutige Vollfläche |
| S404-3 | Fläche | `index.css` | Ab 900 px die Startlagen als Glas auf der bestehenden Wand. Darunter eine Spalte. Kein Bild, kein Logo, kein zweites Motiv |

## Won't

Finger, Sätze, Ablage, Feder.

## Abbruchkriterium

Ein Stück zeigt Wetter, Auslastung oder eine Schlagzeile, die nicht im Speicher steht.
