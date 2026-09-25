# Sprint 343 — Gewürze im Hauptgehirn

**Version:** `18.11.1` — **PLAN** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 342 frei daneben; Core aus 340.

## Ziel

„Merke dir meine Gewürze“ legt **einen** Pin `gewuerze` in denselben
Speicher wie Name und Pref. Der Koch liest später genau diese Liste.
Kein zweites Hirn, kein 14-Tage-Verfall.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S343-1 | Parse | `cook-parse.ts` / `memory-parse` | merke / zeig / vergiss Gewürze; „dazu noch“ = MERGE |
| S343-2 | Pin | `memory-core` Helfer | `readSpicePin` / `writeSpicePin`; key `gewuerze`, `fact`, origin user\|tool |
| S343-3 | Bild | `cook.ts` + Auge | Letztes Foto → Vision nur sichtbare Namen; unsicher nicht speichern |
| S343-4 | Text | derselbe Write | Ohne Foto: die genannten Namen, nicht raten |
| S343-5 | Recall | Memory-Block / Koch | „Welche Gewürze habe ich?“ liest den Pin, sonst ehrlich leer |
| S343-6 | Test | `test-memory` / neu | merke ersetzt; MERGE hängt an; vergiss löscht; MERK-Notiz gewinnt nicht |

## Won’t

TTL wie Recherche. Stilles Speichern ohne merke. Eigene IndexedDB.
Gewürze als `pref` (das ist Geschmack, nicht der Schrank).

## Abbruchkriterium

Pin landet als `notiz`. Oder ein zweiter Store. Oder Vision erfindet
„Kreuzkümmel“, der nicht auf dem Bild steht.

## Manuell

Foto Gewürzregal, „merke dir meine Gewürze“ → Liste. „Welche Gewürze
habe ich?“ dieselbe Liste. Zweites merke ersetzt. „Vergiss meine
Gewürze“ → leer.
