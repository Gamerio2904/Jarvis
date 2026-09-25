# Sprint 344 — Koch-Agent, Bild, Bestätigung

**Version:** `18.11.2` — **CODE** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 343 (Pin darf leer sein).

## Ziel

Der **64. Katalog-Agent** `cook` nennt nur, was auf dem Foto sicher
zu sehen ist, und fragt **Stimmt das?** bevor ein Rezept läuft
(FridgeChef-Schritt, ohne deren LLM-Rezept). `food` bleibt EAN/OFF.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S344-1 | Katalog | `executor-ids` `execute-map` `meta` `parse-catalog` | id `cook`, Organe eye+brain+memory |
| S344-2 | Parse | `cook-parse.ts` | Rezept / „was kann ich kochen“ / aus dem Bild; Ja / ohne X / dazu Y |
| S344-3 | Konflikt | `conflicts.ts` | haushalt drop, nacktes eye drop; food nur EAN/Marke |
| S344-4 | Vision | `handleCook` | `{ name, sure }[]`; unsicher extra, nicht in die Liste |
| S344-5 | Confirm | pending `cook_confirm` | Ohne Ja keine Recherche. „ohne Tomate“ streicht, „dazu Sahne“ hängt an |
| S344-6 | Leer | Handler | Kein Foto → Foto-Knopf. Kein Gemini → ehrlich aus |
| S344-7 | Sweep | `sweep.ts` `prompt-slices` | „Was kann ich aus dem Foto kochen“ |

## Won’t

Rezept in diesem Sprint ausformulieren (345). Staples still annehmen.
YOLO. Sprach-Foto. `food` umbiegen.

## Abbruchkriterium

Nutella trifft cook. Wäsche-kochen trifft cook. Vision ergänzt
Unsichtbares. Rezept startet ohne Ja.

## Manuell

Foto Theke + „was kann ich damit kochen“ → Liste + Nachfrage.
„Nein, ohne Gurke“ ändert die Liste, noch kein Gericht.
„Zutaten von Nutella“ bleibt Lebensmittel.
