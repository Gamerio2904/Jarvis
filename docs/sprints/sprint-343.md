# Sprint 343 — Gewürze im Hauptgehirn

**Version:** `18.11.1` — **PLAN** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 342 frei daneben; Core aus 340.

## Ziel

„Merke dir meine Gewürze“ legt **einen** Pin `gewuerze` in denselben
Speicher wie Name und Pref. Synonyme fallen zusammen (Pfeffer =
black pepper), damit der Koch später trifft. Kein FlavorDB, kein
zweites Hirn, kein 14-Tage-Verfall.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S343-1 | Parse | `cook-parse.ts` / `memory-parse` | merke / zeig / vergiss; „dazu noch“ = MERGE |
| S343-2 | Pin | `memory-core` Helfer | `readSpicePin` / `writeSpicePin`; key `gewuerze`, `fact` |
| S343-3 | Alias | `spice-alias.ts` | Kleine DE/EN-Tabelle; Schreiben und Lesen normalisieren |
| S343-4 | Bild | `cook.ts` + Auge | Nur sichere sichtbare Namen; unsicher nicht speichern |
| S343-5 | Text | derselbe Write | Ohne Foto: genannte Namen, nicht raten |
| S343-6 | Recall | Memory-Block / Koch | „Welche Gewürze habe ich?“ liest den Pin |
| S343-7 | Test | `test-memory` / neu | merke ersetzt; MERGE; Alias nicht doppelt; kein `notiz` |

## Won’t

TTL wie Recherche. Stilles Speichern ohne merke. Eigene IndexedDB.
Gewürze als `pref`. FlavorDB-Paarung. Ganze OFF-Taxonomie laden.

## Abbruchkriterium

Pin landet als `notiz`. Oder Vision erfindet Kreuzkümmel. Oder
„Pfeffer“ und „black pepper“ liegen als zwei Zeilen.

## Manuell

Foto Gewürzregal + merke → Liste. Recall dieselbe. Zweites merke
ersetzt. „dazu noch Thymian“ hängt an. Vergiss → leer.
