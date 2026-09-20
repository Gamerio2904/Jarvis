# Sprint 320 — Propose härten, ehrliches Unknown

**Version:** `18.7.5` — **CODE** Must
**Plan:** [`78-next.md`](../78-next.md)
**Voraussetzung:** Sprint **315**. Verträge dürfen 317–319 nutzen.

## Ziel

Unklare Befehle, die **so nicht eingebaut** sind, werden nicht
kleingeredet. Parser zuerst. Vorschlag nur wenn `looksCommandish`.
Unknown: eine Absage + bis zu drei Nachbarn. Nie „habe ich gemacht“.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S320-1 | DOMAIN | `tool-contract.ts` | `watchliste\|liebling\|overlay\|folie\|einstellungen\|settings\|lage\|kugel\|schicht\|debug` dazu. `liste` bleibt — Shopping nicht stehlen |
| S320-2 | COMMAND | `tool-contract.ts` | `öffne\|zeig\|schließ\|wechsel\|blende` an den Anfang der Befehlsformen. Sonst zahlt „Öffne …“ nie einen Vorschlag. `QUESTION` unverändert: „Was ist eine Watchliste“ bleibt Smalltalk |
| S320-3 | Verträge | `tool-contract.ts` | `open_watchlist` → `Öffne Watchliste` (Agent `watchlist`). `open_favorites` → `Öffne Lieblinge`. `open_settings` → `Öffne Einstellungen` (Agent `app`). `close_overlay` → `Overlay zu`. `set_jarvis_flag` → `Research an` / `Gemini aus` aus Allowlist-Titel + state. Schema: `state` schon da; `title` schon da. Kein neues Arg außer wenn `title` den Flag-Namen trägt |
| S320-4 | Unknown | `director.ts` `rescueByProposal` | Nach `pick.kind==='none'`: Propose wie heute. Fällt Propose aus (`none`, Timeout, Quota, unbestätigt) **und** `looksCommandish`: `unknownReply(text)` — eine Zeile + bis zu drei Katalog-Sätze, die `decideTurn` **jetzt** auf `run` setzt. Kein zweiter Modellaufruf. Smalltalk (`!looksCommandish`) streamt weiter |
| S320-5 | Nachbarn | `tool-contract.ts` oder `command-neighbors.ts` **neu** | Feste deutsche Sätze aus Parsern (Watchliste, Lieblinge, Einstellungen, Overlay zu, Timer, Wecker). Token-Overlap, Cap 3, keine Embeddings. Nur Sätze, die der Router bestätigt |
| S320-6 | Test | `test-propose-18.mjs` o. ä. | `Mach das Overlay für die Filme auf` → Propose `Öffne Watchliste` oder Nachfrage. `Stell irgendwas mit der Watchliste an` → Absage + Nachbarn, kein Fake-Execute. `Was ist eine Watchliste` → kein Propose. Bestehende Timer/TV-Propose-Tests grün |

## Won’t

- LLM führt JSON aus. Zweiter Groq-Call nach `none`.
- e5 / Mem0 / Qdrant / Graphiti in `pickRoute`.
- ReAct-Schleife. Plugin-Shell.

## Abbruchkriterium

Unknown behauptet Ausführung. Oder Smalltalk („Wie geht's“) zahlt
Propose. Oder „Öffne …“ bleibt unsichtbar für `looksCommandish`.

## Manuell

```
Mach das Overlay für die Filme auf
Stell irgendwas mit der Watchliste an
Was ist eine Watchliste
Klick auf Speichern
```

Erster: Watchliste oder ehrliche Nachfrage. Zweiter: Absage +
Nachbarn. Dritter: Antwort, kein Tool. Vierter: Won’t.
