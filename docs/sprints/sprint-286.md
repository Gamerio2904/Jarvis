# Sprint 286 — Plan auf Zuruf füllen, Custom erlaubt

**Version:** `18.2.3` — **PLAN** Should
**Plan:** [`72-next.md`](../72-next.md)
**Voraussetzung:** Sprint **285** (Schema und `parsePlan`)

## Ziel

Auf „mach einen Sprintplan für Idee 1“ füllt Jarvis die Vorlage. Er darf
Lieferumfang-Zeilen ergänzen und Custom-Sprints anhängen, wenn die Idee
das braucht. Er ändert die drei Kern-Titel nicht und führt nichts aus.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S286-1 | Parser | `idea-parse.ts` | `mach(?:e)?(?:\s+einen)? sprintplan(?:\s+für)?(?:\s+idee)?\s+(.+)`, `füll(?:e)?(?:\s+den)?(?:\s+sprint)?plan(?:\s+für)?(?:\s+idee)?\s+(.+)`, `plan(?:e)? idee\s+(.+)`. Nummer oder Titel über letzte Liste |
| S286-2 | Ein Zug | `idea.ts` | **Ein** Hirn-Aufruf. Werkzeug-Vertrag: JSON = `IdeaPlan`. Systemprompt fest, deutsch: die drei Kerne füllen; Zeilen in `lieferumfang` ergänzen ist erwünscht; Custom (`C1`…) nur mit Grund im `ziel`; keine Daten, keine RICE, keine App-Version, keine anderen Agenten beauftragen, kein `docs/sprints` |
| S286-3 | Fail-closed | `parsePlan` | Antwort, die das Schema bricht → ehrlicher Satz `Plan nicht übernommen.`, `idea.plan` unverändert. Kein zweiter Retry (Kontingent) |
| S286-4 | Speichern | `putIdea` | Nur nach erfolgreichem `parsePlan`. Reply = `formatPlan`. Custom-Sprints in der Reply sichtbar, mit Grund |
| S286-5 | Still | Create / Liste / Zeigen | 283, 284, 285-Show rufen 286 **nicht** auf |
| S286-6 | Test | `test-idea-plan.mjs` | Fixture-JSON mit drei Kernen + `C1` (ziel enthält „Gerät“) → parse ok. Fixture mit `rice` als Pflichtfeld-Ersatz → verworfen. Fixture die Kern 2 löscht → verworfen. Parser: `Notiz Milch` und `Zeig Ideen` treffen 286 nicht |

## Won’t

- Auto-Fill beim Festhalten.
- Mehr als ein Modellaufruf für denselben Satz.
- Research oder Todos aus dem frischen Plan.
- Custom ohne Grund.
- Englische Kapitel (*Discovery*, *Roadmap*).

## Abbruchkriterium

Ein Plan ohne Zuruf. Oder Jarvis hängt `C1` an, dessen `ziel` keinen Grund
hat, und speichert trotzdem. Oder ein zweiter Agent leuchtet im Körper.

## Manuell

```
Idee: Hausstand nach jedem Sideload prüfen
Mach einen Sprintplan für Idee 1
```

Drei gefüllte Kerne. Wenn Jarvis ein Custom braucht (z. B. Gerätetest),
steht der Grund im Ziel von `C1`. Todos und Erinnerungen bleiben leer,
bis jemand 287 sagt.
