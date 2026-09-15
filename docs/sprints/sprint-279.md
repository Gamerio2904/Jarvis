# Sprint 279 — `scripts/` unter tsc

**Version:** `18.1.0` — **CODE** Must
**Plan:** [`71-audit.md`](../71-audit.md) §3c, §4

## Ziel

Typfehler in Testläufen fallen beim Bauen auf, nicht erst zur Laufzeit.
`strict` bleibt an der App; Skripte haben ein eigenes tsconfig.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S279-1 | tsconfig | `tsconfig.scripts.json` | `checkJs`, `strict: false`, `strictNullChecks`, DOM+JSX. **Nicht** in `tsc -b`. Altbestand mit `// @ts-nocheck`; neue Skripte ohne diese Zeile fallen auf |
| S279-2 | npm | `package.json` `tsc:scripts` | Teil von `run-all-tests.sh` |

## Abbruchkriterium

`strict` an der App wird abgeschaltet, um einen Skript-Fehler durchzulassen.
