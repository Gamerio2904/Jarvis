# Sprint 286 — Widerspruch auf Zuruf

**Version:** `18.2.3` — **PLAN** Should
**Plan:** [`72-next.md`](../72-next.md)
**Voraussetzung:** Sprints **283** und **284**

## Ziel

Auf „stell Idee 1 in Frage“ kommt **ein** kurzer Widerspruch. Beim
Festhalten und beim Listen bleibt Jarvis still.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S286-1 | Parser | `idea-parse.ts` | `stell(?:e)? (?:die )?idee\s+(.+) in frage`, `was spricht gegen (?:die )?idee\s+(.+)`, `anwalt des teufels(?:\s+zu)?(?:\s+idee)?\s+(.+)`. Nummer oder Titel |
| S286-2 | Ein Zug | `idea.ts` | Nach dem Treffer **ein** Aufruf ans Hirn (`BrainOrchestrator` / bestehender Chat-Abschluss), nicht ein zweiter Agent. Prompt fest, deutsch: höchstens fünf kurze Punkte, keine Roadmap, keine Scores, keine anderen Agenten erwähnen. Quelle ist `idea.title` + `idea.body` |
| S286-3 | Research | — | Nur wenn der Satz `recherchier` / `such nach` enthält. Sonst **kein** Netz. Kein stilles `runAgent('research')` |
| S286-4 | Still | Execute-Pfad Create/List | 283 und 284 rufen 286 **nicht** auf |
| S286-5 | Konflikt | `conflicts.ts` + Sprint 277 | `Stimmt nicht` bleibt S260-6 / 277 (letzte Faktenaussage). `Stell Idee 1 in Frage` ist `idea`. Kein Diebstahl |
| S286-6 | Test | `test-idea.mjs` | Parser-Treffer. Create-Satz setzt keinen Challenge-Intent. `Stimmt nicht` → `idea-parse` null. Prompt-Fixture enthält „höchstens fünf“ / kein „RICE“ |

## Won’t

- Auto-Widerspruch nach jeder neuen Idee.
- Coder/Research anstoßen.
- RICE, ICE, „Priorität“.
- Englische Rolle *Devil's Advocate* in der UI.

## Abbruchkriterium

Widerspruch ohne Zuruf. Oder mehr als ein Modellaufruf für diesen Satz.
Oder Jarvis startet Research, obwohl niemand „recherchier“ gesagt hat.

## Manuell

```
Idee: Immer Vollbild, Chat weg
Stell Idee 1 in Frage
```

Kurze deutsche Punkte. Kein zweiter Agent im Körper, der zusätzlich
aufleuchtet.
