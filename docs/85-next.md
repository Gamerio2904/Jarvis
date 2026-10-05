# 85 — Themen-Experte **CODE** (`18.12.2`)

PO: «Werde ein Experte in Star Wars» legt einen Experten an. Der
recherchiert tief und beantwortet spätere Fragen nur mit Beleg.

Kein Schwarm, kein 5. Hirn, kein neuer Katalog-Eintrag pro Franchise.

## 0. Ist

| Stelle | Heute |
|--------|--------|
| `teach` / `pack` | nur «lern das als Fachwissen» |
| Katalog | 63 Agenten auf `18.12.0` |
| Deep Research | `fillDeepResearchLinks` + DuckDuckGo/Wikipedia |

## 1. Architektur

```text
«Werde ein Experte in Star Wars» → Agent expert (einer)
Ja → Deep Research → Knowledge-Pack origin=expert
Fragen mit Thema / last_step=expert → nur Pack-Sätze
«Welche Experten» / «Vergiss den Experten Star Wars»
```

Der sichtbare «neue Agent» ist das Pack plus der eine Dispatcher
`expert` (64. Katalog-Agent auf main). Star-Wars, Marvel, … sind
Themen, keine weiteren `parse-catalog`-Zeilen.

## 2. Won’t

LLM-Organizer. Ein Katalog-Agent je Filmreihe. Fakten ohne Quelle.
Nutella/Carbonara/S6 als Experte. Handle/Rechte erfinden.
`18.5` parallel. Koch/`hud` stehlen.

## 3. Sprint

[355](./sprints/sprint-355.md) — Parser, Katalog, Confirm, Research, Tests.
