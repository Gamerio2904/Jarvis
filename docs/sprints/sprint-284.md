# Sprint 284 — Ideen-Überblick

**Version:** `18.2.1` — **CODE** Must
**Plan:** [`72-next.md`](../72-next.md)
**Voraussetzung:** Sprint **283**

## Ziel

Die offenen Ideen stehen in einer Liste. Parken und Erledigt sind Sätze,
kein zweites Produkt, kein Overlay.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S284-1 | Liste | `idea-parse.ts` | `zeig(?:e)?(?:\s+mir)?(?:\s+meine)? ideen`, `meine ideen`, `was liegt an ideen`. Default: `status==='open'`. `alle ideen` = open + parked, nicht done |
| S284-2 | Reply | `idea.ts` | Nummerierte Liste, nur Titel. Leer: `Keine offenen Ideen.` `persistLastList('idea', titles)` wie Todos |
| S284-3 | Parken / Weg | `idea-parse.ts` | `park(?:e)?(?:\s+die)? idee\s+(.+)`, `idee\s+(.+)\s+(?:ist\s+)?erledigt`, `idee (\d+) (parken\|weg)`. Nummer löst über die letzte Liste |
| S284-4 | Konflikte | `conflicts.ts` | `Zeig Notizen` bleibt `todo`/`notes`. `Zeig Ideen` bleibt `idea`. `Was steht an` bleibt Agenda (Erinnerung+Todo), **keine** Ideen — Ideen sind kein Termin |
| S284-5 | Optional Block | `chat-blocks.ts` nur wenn schon da | Tabelle mit Spalte Titel ist erlaubt, kein Muss. Kein Bild, keine Kugel |
| S284-6 | Test | `test-idea.mjs` | Liste nach zwei Creates. Parken nimmt die Zeile aus der offenen Liste. `Zeig Notizen` trifft `idea-parse` nicht |

## Won’t

- Eigene Lage-Sicht, Overlay oder Körper-Zweig nur für Ideen.
- Sortierung nach Score.
- Automatisches Cluster nach Thema.
- Erledigte in der Standardliste.

## Abbruchkriterium

`Was steht an` listet Ideen. Oder die Liste erfindet Titel, die nicht in
`ideas` liegen.

## Manuell

```
Idee: Lidl wenn die Kugel auf Stuttgart steht
Zeig meine Ideen
Park Idee 1
```

Die erste Zeile verschwindet aus der offenen Liste, bleibt unter
`alle Ideen` als geparkt. Den Sprintplan zeigt 285.
