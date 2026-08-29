# Sprint 110 — Weltlage / Vorhersage **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | `4.0.0` (bündelt `4.1`–`4.17`) |
| Quelle | PO: Reel Weltlage/Öl, Wunsch Vorhersage |
| Voraussetzung | Code `3.19.0` |
| Plan | [`35-next.md`](../35-next.md) |

## Ziel

Weltlage holen und Ausblicke **rechnen**, ohne Orakel. Research `4.1`–`4.4` entschieden, dann Register-Tool `outlook`.

## Must

| ID | Inhalt | Done |
|----|--------|------|
| N1 | Reel ehrlich vs. Marketing | ja |
| N2 | Ist-Stand news/fx/fuel/research | ja |
| N3 | Researchphasen vor Code | ja, Tabelle in `35-next.md` |
| N4 | Bau `4.5`–`4.17` | ja, gebündelt in `4.0.0` |
| N5 | Won’t: Allwissen, Aktien-Garantie, Captcha-Bypass | ja |

## Code

Tool `outlook`: Parser, Tags, Serien (Frankfurter + FRED opt-in + E10-Cache), Vertrag, Watch/Interrupt opt-in, Lage-Kachel `world`. Kein `if` in `chat.ts`. Sideload nicht in diesem Sprint.

## Won’t (dieser Sprint)

APK, EIA parallel zu FRED, Stooq/Yahoo, Punktprognose.
