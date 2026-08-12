# Sprint 13 — Router Hotfix (nach 0.5.0 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **HOTFIX / HIGH** — vor Should-Polish und Research |
| Ziel-Version | **`0.5.1`** |
| Quelle | Deep-Test Feedback zu Sprint 12 (`0.5.0`) |

## Ziel

Die **blocker-level** Qualitätslücken aus dem `0.5.0`-Test schließen: Inject/Task-Guards entkoppeln, schwache Merk-Writes stoppen, Non-Memory-Intents ohne Aussetzer-Final.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| F1 | **Inject ≠ Task** — Legitimate Tasks (`Plan mir…`) nie mit Inject-/SAFE_REFUSAL beantworten | Live: Wochenplan-Prompt → hilfreiche Task-Reply, nicht „Netter Versuch“ |
| F2 | **Inject-Reply Jarvis-DE** — bei `inject`: deutsches Jarvis-Canned; **kein** EN-Helpdesk (*How can I assist…*) | Live-Inject ohne EN/Boilerplate; Eval-Case |
| F3 | **Weak-Write Guardrail** — zu kurze/inhaltsleere Payloads (`Merk dir das irgendwie`) **nicht** speichern; False-Confirm-Pfad | Kein Store; klare Ablehnung statt `Notiert: das irgendwie` |
| F4 | **Policy-Fallbacks non-memory** — `settings` / `helpdesk_trap` / `task` (bei Guard-Fail): Jarvis-Canned statt finalem Aussetzer | Live `/protokoll` + Helpdesk-Bait ≠ „Kurzer Aussetzer“ |
| F5 | Eval `scripts/eval_0_5_1.py` + Version `0.5.1` | Suite grün; Health/UI `v0.5.1` |

## Won’t

- Router-Feinschliff „nice to have“ (→ Sprint 14 / `0.5.2`)
- Live-Scorecard-Ausbau (→ Sprint 14)
- Echtes Heavy-Modell / Routing-Ehrlichkeit (→ Sprint 14)
- Internet-Research (→ Sprint 15 / `0.6.0`)

## Abhängigkeiten

- Sprint 12 / `0.5.0` implementiert
- Empfohlen vor PO-Tag `v0.5.0` oder parallel als Patch

## Exit / Abnahme

PO: Task geht, Inject bleibt Jarvis/DE, Weak-Write speichert nicht, Settings/Helpdesk ohne Aussetzer. Tag **`v0.5.1`**.
