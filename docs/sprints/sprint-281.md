# Sprint 281 — Toter Code, mit Test

**Version:** `18.1.0` — **CODE** Could
**Plan:** [`71-audit.md`](../71-audit.md) §3e Toter Code, §4

## Ziel

Neue Leichen fallen im Testlauf auf. Die 54 ungenutzten Exporte (API-Rümpfe,
alte Kachel-Pipeline) bleiben liegen: blindes Löschen trifft dynamische
Importe. Der Test deckt Settings-Schlüssel, CSS-Deckel und verwaiste Skripte.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S281-1 | Test | `scripts/test-dead-code.mjs` | `DEFAULT_SETTINGS`-Schlüssel müssen außerhalb store/schema/migrate/backup vorkommen, sonst Allowlist. CSS-Unreferenziert < 80. Skripte in `package.json` / `run-all-tests.sh` oder Allowlist (Emulator) |
| S281-2 | npm | `test:dead-code` | in `run-all-tests.sh` |

Emulator-Skripte bleiben — sie laufen nicht im CI, sind aber das Gerät-Werkzeug.

## Abbruchkriterium

Ein neuer unbenutzter Settings-Schlüssel ohne Begründung in der Allowlist.
