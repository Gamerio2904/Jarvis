# Sprint 344 — Koch-Agent und Zutaten vom Bild

**Version:** `18.11.2` — **PLAN** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 343 (Pin darf noch leer sein).

## Ziel

Der **64. Katalog-Agent** `cook` nimmt das letzte Zutaten-Foto und nennt
nur, was zu sehen ist. `food` bleibt EAN/OFF. Foto weiter nur über den
Kamera-Knopf.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S344-1 | Katalog | `executor-ids` `execute-map` `meta` `parse-catalog` | id `cook`, Label Koch, Organe eye+brain+memory |
| S344-2 | Parse | `cook-parse.ts` | Rezept / „was kann ich kochen“ / Speisekammer / „aus dem Bild“ |
| S344-3 | Konflikt | `conflicts.ts` | Küchenwort: haushalt drop, nacktes eye drop; food nur bei EAN/Marke |
| S344-4 | Vision | `handleCook` | Prompt: nur Sichtbares, unsicher markieren, nichts erfinden |
| S344-5 | Leer | derselbe Handler | Kein Foto → Foto-Knopf. Kein Gemini → ehrlich aus |
| S344-6 | Sweep | `sweep.ts` `prompt-slices` | Satz „Was kann ich aus dem Foto kochen“ |

## Won’t

65. Organizer. `food` umbiegen. Sprach-Foto. Rezept in diesem Sprint
schon ausformulieren (das ist 345). TheMealDB-Testkey in der APK.

## Abbruchkriterium

„Zutaten von Nutella“ trifft cook. Oder „Was bedeutet kochen“ (Wäsche)
trifft cook. Oder Vision ergänzt Zutaten, die nicht im Bild sind.

## Manuell

Foto Theke + „was kann ich damit kochen“ → sichtbare Liste, noch ohne
erfundenes Gericht. „Zutaten von Nutella“ bleibt Lebensmittel.
„Mach ein Foto“ bleibt wont.
