# Sprint 285 — Sprintplan-Vorlage im Code

**Version:** `18.2.2` — **CODE** Must
**Plan:** [`72-next.md`](../72-next.md)
**Voraussetzung:** Sprints **283** und **284**

## Ziel

Die Vorlage steht fest, bevor ein Modell sie sieht. Wer den Plan einer
Idee ohne Füllung verlangt, sieht die drei leeren Kern-Sprints — nicht
Nichts, nicht eine vom Modell erfundene Gliederung.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S285-1 | Schema | `engine/idea-plan.ts` **neu** | Typen `IdeaPlan`, `IdeaSprint` exakt wie [`72-next.md`](../72-next.md) §1. `CORE_TITLES = ['Kern','Härten','Probe']`. `emptyPlan(ideaId): IdeaPlan` legt drei `kind:'core'`-Karten mit leerem `ziel` / `lieferumfang` / `wont:['—']` / `abbruch:'—'`. Kein LLM |
| S285-2 | Prüfen | `idea-plan.ts` `parsePlan(raw)` | Unbekannte Felder verwerfen. `kind` nur `core`/`custom`. Kern `n` nur 1..3 in dieser Reihenfolge. Custom `n` = `C` + Ziffer, `ziel` muss einen Grund enthalten (nicht leer, nicht nur `—`). Sonst `null` — fail-closed |
| S285-3 | An die Idee | `store.ts` | `Idea.plan` speichern. `emptyPlan` schreiben erst wenn der User den Plan **zeigt** oder 286 füllt — nicht beim Create (283 bleibt `null`) |
| S285-4 | Zeigen | `idea-parse.ts` + `idea.ts` | `zeig(?:e)?(?:\s+mir)?(?:\s+den)? sprintplan(?:\s+für)?(?:\s+idee)?\s+(.+)`, `plan (?:von\|für) idee\s+(.+)`. Wenn `plan==null`: `emptyPlan` **nur in der Reply rendern**, noch nicht speichern. Deutsch, die drei Titel sichtbar |
| S285-5 | Render | `idea-plan.ts` `formatPlan(plan)` | Markdown-ähnlich im Chat: Überschrift, je Sprint Ziel + Lieferumfang-Zeilen. Kein Overlay |
| S285-6 | Test | `test-idea-plan.mjs` **neu** | `emptyPlan` hat genau drei core. `parsePlan` mit RICE-Feld → ohne Extra-Felder akzeptiert oder `null` (kein RICE in `formatPlan`). Custom ohne `ziel`-Grund → `null`. Create-Idee hat `plan===null` |

## Won’t

- Modellaufruf in diesem Sprint.
- Vorlage vom LLM erzeugen lassen.
- Plan beim `Idee:`-Satz anlegen.
- Datei unter `docs/sprints/` schreiben.

## Abbruchkriterium

`Zeig den Sprintplan` erfindet andere Kapitel als Kern/Härten/Probe.
Oder 283 legt schon einen Plan an.

## Manuell

```
Idee: Körper auch im Auto neben dem Chat
Zeig den Sprintplan für Idee 1
```

Drei leere Kerne. Noch kein Custom. Noch kein Cloud-Zug.
