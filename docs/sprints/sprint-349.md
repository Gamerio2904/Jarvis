# Sprint 349 — Ein Katalog-Agent `clip`

**Version:** `18.13.0` — **PLAN** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 348.

## Ziel

Der Director wählt **einen** Agenten `clip`. Kein Schwarm
Beschreibung/Upload/Konto, kein 5. Hirn.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S349-1 | Parse | `clip-parse.ts` | clip, reel, beats, hochladen, beschreibung für den clip, insta, tiktok, wie viele clips |
| S349-2 | Katalog | `parse-catalog.ts`, meta, executor, sweep | ein Eintrag `clip`; `test:agents` +1 |
| S349-3 | Konflikte | `conflicts.ts` | nicht `doc`, nicht `hud`/`rm_scene`, nicht `food`/`cook`, nicht `wont` „öffne Instagram“ |
| S349-4 | Pending | Director vor Todos | `clip`+`caption` / `clip`+`publish` wie hud/rm_scene |
| S349-5 | Phasen | `clip.ts` | ingest schon in 348; hier Status, Liste, „Konto?“ ohne Token im Chat |
| S349-6 | Nummer | Docs | 64. auf main, 65. nur wenn Koch `#149` zuerst merged |

## Won’t

Zweiter/dritter Clip-Agent. LLM-Organizer. `hud` für Reels.
Token im Chat. Publish in diesem Sprint.

## Abbruchkriterium

Ein zweiter Katalog-Agent für Caption oder Upload. Oder Ja auf
„öffne Instagram“ startet die App und gilt als Post.
