# Sprint 287 — Ein nächster Schritt auf Zuruf

**Version:** `18.2.4` — **PLAN** Should
**Plan:** [`72-next.md`](../72-next.md)
**Voraussetzung:** Sprints **283** und **284**

## Ziel

Auf „was ist der nächste Schritt für Idee 1“ kommt **ein** Satz. Kein
Plan, kein Ticket, kein stilles Todo.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S287-1 | Parser | `idea-parse.ts` | `nächste(?:r)? schritt(?:\s+für\|\s+zu)?(?:\s+die)? idee\s+(.+)`, `was (?:tu\|mach)e ich als nächstes (?:mit\|bei)(?:\s+der)? idee\s+(.+)` |
| S287-2 | Ein Zug | `idea.ts` | Ein Hirn-Aufruf. Prompt fest: genau **ein** nächster Schritt, deutsch, alltagstauglich, keine Meilenstein-Liste, keine anderen Agenten beauftragen |
| S287-3 | Todo nur nach Ja | `idea.ts` + `pending` | Reply endet mit `Soll ich das als Todo anlegen?`. Nur `ja` / Confirm schreibt `addTodo`. Still anlegen ist verboten |
| S287-4 | Still | Create/List/Erinnerung | 283–285 rufen 287 nicht auf |
| S287-5 | Test | `test-idea.mjs` | Parser-Treffer. Nach dem Schritt: Pending-Todo, kein Todo in der Liste. `ja` → ein offenes Todo mit dem Schritttext |

## Won’t

- Auto-Roadmap, drei Meilensteine, Quartalsplan.
- Stilles Ticket an einen Coder- oder Research-Agenten.
- Mehrere Schritte „und dann … und dann …“ als Default.
- Kalender-Termin aus dem Schritt.

## Abbruchkriterium

Ein Todo ohne Ja. Oder mehr als ein Modellaufruf. Oder Jarvis zählt
Meilensteine auf.

## Manuell

```
Idee: Hausstand nach dem Sideload prüfen
Was ist der nächste Schritt für Idee 1
```

Ein Satz, Frage nach Todo. Ohne Ja bleibt die Todo-Liste leer.
