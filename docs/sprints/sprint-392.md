# Sprint 392 — Parser `clip`

**Version:** `18.20.0` — **PLAN** Must
**Plan:** [`92-next.md`](../92-next.md)
**Voraussetzung:** keine. Nicht mit `#152` mergen.

## Ziel

YouTube-Link plus Schnittwort wird `clip`. Fernseher, Filmbewertung und
„Öffne TikTok“ bleiben, wo sie sind. Vor dem Download steht ein Ja-Satz.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S392-1 | Parser | `clip-parse.ts` | URL `youtube.com` / `youtu.be` / `m.youtube.com` und `highlight|schneid|top\s*[1-3]|reel|short`. 1–3 Links |
| S392-2 | Agent | `parse-catalog.ts` `execute-map.ts` `executor-ids.ts` `meta.ts` `prompt-slices.ts` | `medien`, `pc_hand`+`mouth`, `device`. Ein Satz Fakten |
| S392-3 | Konflikte | `conflicts.ts` | Gerätewort → `tv`. URL+Schnitt → `clip` vor `film`. `öffne tiktok` bleibt `wont` |
| S392-4 | Ja | `clip.ts` | Pending bis Ja. Text: Anzahl, Ordner `Videos\Jarvis`, kein Upload, YouTube-Bedingungen in einem Halbsatz |

## Won't

Download, ffmpeg, Upload.

## Abbruchkriterium

`YouTube auf dem Fernseher` oder `Wie gut ist Dune` landet auf `clip`.
