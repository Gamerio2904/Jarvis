# Sprint 394 — Rang aus dem Transkript

**Version:** `18.20.0` — **CODE** Must
**Plan:** [`92-next.md`](../92-next.md)
**Voraussetzung:** 393.

## Ziel

Groq wählt bis zu drei Intervalle aus Sätzen mit Zeiten. Intervalle dürfen
in der Quelle springen. Grenzen prüft Code, nicht das Modell.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S394-1 | Sätze | `clip-rank.ts` | json3 → Sätze `{start,end,text}`. Wortzeiten behalten |
| S394-2 | Rang | Groq, ein Aufruf | Prompt verlangt 1–3 Paare und ein Kurz-Zitat. Kein MP4, kein System-Prompt-Wechsel |
| S394-3 | Grenzen | derselbe Modul | 20–75 s je Abschnitt, Summe ≤ 180 s, innerhalb der Dauer, an Wortgrenzen schnappen. Ungültig → verwerfen, nicht runden bis es passt |
| S394-4 | Leer | `clip.ts` | Keine Untertitel und kein Whisper: „Dazu fehlen Wortzeiten.“ Kein Rate-Schnitt |

## Won't

Triggerwort-Lexikon, zweites Modell, Whisper als Pflicht.

## Abbruchkriterium

Der Rang gibt Zeiten zurück, die der Validator nicht angefasst hat und die über der Quelle liegen.
