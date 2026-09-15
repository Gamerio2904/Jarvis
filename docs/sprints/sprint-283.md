# Sprint 283 — Idee festhalten

**Version:** `18.2.0` — **PLAN** Must
**Plan:** [`72-next.md`](../72-next.md)
**Voraussetzung:** keine. Audit-Zahlen 272–282 bleiben [`71-audit.md`](../71-audit.md).

## Ziel

Wer eine Idee sagt, hat sie hinterher. Jarvis erfindet keine. Notiz, Todo
und Gedächtnis bleiben, was sie sind.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S283-1 | Typ + Store | `store.ts` | `Idea`: `id`, `title`, `body`, `status: 'open'\|'parked'\|'done'`, `source_conversation_id`, `created_at`, `updated_at`. `listIdeas`, `addIdea`, `putIdea`. IndexedDB-Store `ideas`, Migration wie `notes` |
| S283-2 | Parser | `engine/idea-parse.ts` **neu** | `idee[:\s](.+)`, `neue idee\s+(.+)`, `merk(?:e)? dir die idee\s+(.+)`, `ich hab(?:e)?(?:\s+da)?(?:\s+ne\|\s+eine)? idee[:\s]+(.+)`. Titel = erster Satz oder bis 80 Zeichen, Rest = `body`. Rückgabe `{ kind:'create', title, body }` |
| S283-3 | Abgrenzung | `idea-parse.ts` + Tests | `Notiz Milch`, `Todo Milch`, `ich muss Milch`, `merk dir ich mag Milch`, `lern das` → **kein** Treffer. `Idee: Schach gegen den Körper halten` → Treffer |
| S283-4 | Agent | `parse-catalog.ts` | Ein Eintrag `idea`, `sideEffect: 'write'`, `autonomy: 'parser'`. Kein `promptSlice`, der andere Agenten startet. Deutsch in der Karte: **Idee** |
| S283-5 | Execute | `engine/idea.ts` **neu** | `addIdea`, Reply `Idee liegt: {title}.`. Kein Confirm (wie Notiz). Kein Memory-Write, kein Teach |
| S283-6 | Hausstand | `backup.ts` | `ideas` exportieren und importieren. Zähler in der Zusammenfassung. Alte Backups ohne Feld bleiben gültig (`arr(o.ideas)`) |
| S283-7 | Test | `test-idea.mjs` **neu** | Create-Sätze treffen. Notiz/Todo/Memory/Teach treffen nicht. `listIdeas` nach `addIdea` enthält die Zeile |

## Won’t

- RICE/ICE, Prioritätszahl, Domänen-Tag-Pflicht.
- Stilles Ernten aus dem Chat.
- Notion/Obsidian.
- Neuer Organizer-Agent.

## Abbruchkriterium

Eine Idee ohne Parser-Treffer. Oder „Notiz Milch“ landet in `ideas`.

## Manuell

```
Idee: Körper und Chat gleichzeitig, auch im Auto
```

Reply bestätigt den Titel. `Zeig meine Ideen` darf in diesem Sprint noch
fehlen — das ist 284. In den Einstellungen / Hausstand-Export ist `ideas`
gezählt.
