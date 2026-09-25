# Sprint 347 — Kamera-Fähigkeiten S6+ (Rick and Morty)

**Version:** `18.12.0` — **CODE** Must
**Plan:** [`83-next.md`](../83-next.md) §3
**Voraussetzung:** 341 / Serie-Netz.

## Ziel

Foto einer Szene ab Staffel 6, dann Staffel und Folge. Jarvis schreibt
nur sichtbare Fähigkeiten in den Serie-Steckbrief. Titel der Folge nur
„laut Nutzer“, nie erfunden.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S347-1 | Parse | `rm-scene-parse.ts` | S06+ reicht; S01–S05 nur mit Szene-Wort |
| S347-2 | Foto | `doc.ts` | `saveLastEyeImage` vor OCR |
| S347-3 | Vision | `rm-scene.ts` | JSON who/skill/sure; Ja/Nein; ohne X |
| S347-4 | Store | `rm_scene_skills` IDB v10 | Merge ins Dossier, `origin: camera` |
| S347-5 | Route | `hud` / Director | pending `hud`+`rm_scene` vor Todos |
| S347-6 | Test | `test-rm-scene.mjs` | Gold=TEST_PROMPTS, 13 Packs |

## Won’t

65. Agent. Wiki. S06+ API-Knoten. Neue Graph-IDs. Folgentitel raten.
Kamera-Write unter Staffel 6. 14. Probe-Pack.

## Abbruchkriterium

Eine Fähigkeit ohne Foto oder ohne Staffel/Folge. Oder ein erfundener
S06-Titel. Oder Gold-Keys ≠ TEST_PROMPTS.
