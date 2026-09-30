# Sprint 395 — Bildtitel

**Version:** `18.20.0` — **PLAN** Must
**Plan:** [`92-next.md`](../92-next.md)
**Voraussetzung:** 394.

## Ziel

Jeder Abschnitt bekommt 2–5 Wörter aus einem JPEG. Ein Titel aus dem
Nutzer-Satz gewinnt und spart Gemini.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S395-1 | Frame | PC `frames` | Ein JPEG bei `start+2s`, ≤200 KB, nur die erlaubte URL |
| S395-2 | Vision | Gemini, bestehender Slot | „Was ist im Bild, 2–5 Wörter, nichts dazuerfinden.“ Drei Bilder, ein Aufruf |
| S395-3 | Fallback | `clip.ts` | Leer, Fehler oder Timeout → `Abschnitt 2`. Transkript-Zitat nur, wenn kein JPEG |
| S395-4 | Nutzer | Parser | `Titel 2: Bull Dragon` überschreibt Punkt 2 |

## Won't

Ganzes MP4 an Gemini. Bildgenerator. Hashtags.

## Abbruchkriterium

Mehr als drei Bilder verlassen den PC, oder ein leeres Gemini-Feld wird zur erfundenen Pointe.
