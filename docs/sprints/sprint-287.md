# Sprint 287 — Ergänzen, Custom nach Satz, Erinnerung

**Version:** `18.2.4` — **CODE** Should
**Plan:** [`72-next.md`](../72-next.md)
**Voraussetzung:** Sprint **285**. 286 ist keine harte Kette: ein leerer
Plan darf per Satz ergänzt werden.

## Ziel

Wer den Plan schon hat, muss nicht alles neu generieren. Ergänzen,
Custom-Sprint, Streichen und Erinnern sind eigene Sätze. Ohne Satz
passiert nichts.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S287-1 | Zeile ergänzen | `idea-parse.ts` | `ergänz(?:e)?(?:\s+den)?(?:\s+plan)?(?:\s+um)?\s+(.+)`, `nimm in sprint (\d+)\s+(.+)`. Trifft den offenen Plan der letzten Idee oder `idee N`. Parser-only, wenn der Rest klar eine Task-Zeile ist: `id` auto `S{n}-{k}`, kein LLM. Unklar → ein Hirn-Zug, der **nur** eine `lieferumfang`-Zeile zurückgibt, `parsePlan` prüft |
| S287-2 | Custom nach Satz | `idea-parse.ts` | `custom sprint(?:\s+für)?(?:\s+idee)?\s+(.+)`, `extra sprint[:\s]+(.+)`. Neues `kind:'custom'`, nächste freie `C#`. `ziel` = der Satz (ist der Grund). Lieferumfang darf erst leer sein. Kein LLM nötig, wenn Titel+Grund im Satz stehen |
| S287-3 | Streichen | `idea-parse.ts` | `streich(?:e)? sprint (C?\d+)`. Kern: nicht löschen, sondern `ziel='entfällt: auf Zuruf'`, Lieferumfang leer. Custom: darf raus |
| S287-4 | Erinnerung | `remind-parse.ts` + `idea-parse.ts` | `REL_UNIT` um `wochen?`. `erinner(?:e)? mich in (.+) an (?:die )?idee\s+(.+)`, `… an sprint (C?\d+)`. Ohne Zeit: `Wann?`, nichts anlegen. `addReminder`, `kind:'once'`, Titel `Idee: …` / `Sprint …: …`. `in 2 Wochen Milch` bleibt `reminder` |
| S287-5 | Todo nur nach Ja | `idea.ts` | `mach sprint (\d+) zum todo` → Pending, Confirm wie Todos. Still aus einem gefüllten Plan: verboten |
| S287-6 | Test | `test-idea-plan.mjs` + Remind-Skript | Custom-Satz hängt `C1` an emptyPlan. Streichen Kern 2 → Karte bleibt, `entfällt`. Wochen-Relativ. Erinnerung ohne Zeit: 0 Zeilen in `reminders`. `in 20 Minuten Milch` nicht `idea` |

## Won’t

- Wöchentlicher Digest, Stale-Scan.
- Kern-Sprints physisch löschen.
- Todo oder Research ohne Satz.
- Custom, der die Kerne ersetzt.

## Abbruchkriterium

Eine Erinnerung oder ein Todo, nur weil ein Plan existiert. Oder Kern 1
ist nach „streich Sprint 1“ weg statt `entfällt`.

## Manuell

```
Custom Sprint: auf dem Handy nach dem Sideload
Erinner mich in 2 Wochen an Idee 1
```

`C1` steht am Plan, Grund ist der Satz. Notification nur nach dem
zweiten Satz.
