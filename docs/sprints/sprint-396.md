# Sprint 396 — Render Top-Liste

**Version:** `18.20.0` — **PLAN** Must
**Plan:** [`92-next.md`](../92-next.md)
**Voraussetzung:** 394, 395.

## Ziel

Eine lokale 1080×1920-Datei: 16:9 in der Mitte, Unschärfe oben und unten,
Liste füllt sich, ein Wort, Originalton, harter Schnitt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S396-1 | Schnitt | ffmpeg | Nur die Intervalle, Quelle ≤720p, Reihenfolge = Rang |
| S396-2 | Layout | ffmpeg | 1080×1920. Bild y=640 h=608. Oben/unten `gblur=24`. Siehe [`92-next.md`](../92-next.md) §6 |
| S396-3 | ASS | Generator im PC-Prozess | Ein Event pro Wort. Liste als Events ab `start`. Farben aus der Whitelist. Filter `ass=` |
| S396-4 | Datei | `Videos\Jarvis` | H.264, AAC 128 k, `+faststart`. Arbeitordner nach `done` weg. Timeout 12 min |
| S396-5 | libass | Status | Build ohne `ass` → `error: tool` „libass fehlt“ |

## Won't

Musik, TTS, Blende, Gesicht-Crop, Upload.

## Abbruchkriterium

Der Titel oder ein Wort steht in den ffmpeg-Argumenten statt in der ASS-Datei.
