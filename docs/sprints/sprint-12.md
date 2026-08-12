# Sprint 12 — Memory Must-Fixes (nach 0.4.0-Deep-Test)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.4.1`** |
| Quelle | Deep-Test / PO-Feedback zu Sprint 8 (`0.4.0`) |

## Ziel

Gedächtnis **vertrauenswürdig**: keine falschen Merk-Bestätigungen, keine Guard-Aussetzer bei Memory-Turns, „Vergiss alles“ wie erwartet.

## Must (Bugs / kaputt)

| ID | Fix | Done wenn |
|----|-----|-----------|
| M1 | **False-Confirm** — Jarvis sagt „gemerkt/notiert“, obwohl nichts persistiert wurde | Natürliche/unklare Merk-Sätze speichern **oder** klar ablehnen; nie Behaupten ohne Write |
| M2 | **Guard/Aussetzer bei Memory-Turns** — Helpdesk-/Degenerate-Fallback nach „Merk dir …“ und Folge-Turns | Memory-Ack und Recall ohne Canned `Kurzer Aussetzer` / `Kein Helpdesk hier`; Persona bleibt |
| M3 | **„Vergiss alles“** — Substring löscht 0 Einträge | Chat-Befehl leert Langzeitgedächtnis (wie UI „Alles löschen“); Eval-Case |
| M4 | Eval-Erweiterung `scripts/eval_0_4_1.py` | Cases: False-Confirm, Memory-ohne-Aussetzer, Vergiss-alles |
| M5 | Version `0.4.1` | Health + UI |

## Should

| ID | Inhalt |
|----|--------|
| M6 | Nach erfolgreichem Speichern kurze Jarvis-Bestätigung (1 Satz, kein Helpdesk) erzwingen / nudgen |
| M7 | Guard-Retries: bei erkanntem Memory-Write Boilerplate-Treffer nicht mit Helpdesk-Canned ersetzen |

## Won’t

- Parser-Feinschliff / Multi-Fakt-Split / UI-Edit (→ `0.4.2` / Sprint 13)
- Memory-Intent-Router / Subklassen (→ `0.5.0` / Sprint 9, Doc `10`)
- Research / Delight

## Abhängigkeiten

- `0.4.0` Gedächtnis v1 (Sprint 8)

## Exit

PO: Merk/Vergiss fühlt sich ehrlich an; keine Aussetzer-Serie nach Memory. Tag **`v0.4.1`**.
