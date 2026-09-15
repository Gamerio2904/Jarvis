# Sprint 278 — Abbruch mit Abkürzungsliste

**Version:** `18.1.0` — **CODE** Should
**Plan:** [`71-audit.md`](../71-audit.md) §3a S260-7, §4

## Ziel

`looksTruncated` erkennt `[.!?]\s+[a-zäöü]` mitten im Text, ohne deutsche
Abkürzungen als Bruch zu werten.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S278-1 | Liste | `polish-guard.ts` | `ca`, `ggf`, `z. B.`, `bzw`, `usw`, … vor dem Punkt |
| S278-2 | Tests | `test-014.mjs` | `volatil. bis eine` = Abbruch. `ca. drei Kilometer.` = ganz |

## Abbruchkriterium

„ca. drei“ gilt als abgebrochene Antwort.
