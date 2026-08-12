# Sprint 17 — Research Polish (Should, nach Hotfix)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **SHOULD** — nicht blocker für Delight; empfohlen vor Delight |
| Ziel-Version | **`0.6.2`** |
| Quelle | Deep-Test Feedback zu Sprint 15 (`0.6.0`); setzt Hotfix `0.6.1` voraus |

## Ziel

Nicht-zwingende Verbesserungen am Research-Stack: Jarvis-Persona in Quellen-Antworten, stärkere Dual-Provider-/DDG-Nutzung, Eval-Abdeckung der Deep-Test-Dimensionen.

## Should (Lieferumfang dieses Sprints)

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| P1 | **Research-Persona** — Live-Antworten nicht nur Template „Kurz aus den Quellen…“; Jarvis-Ton, weiterhin citation-pflichtig | Live-Wiki-Reply ≠ reines Template **oder** Template + kurze Jarvis-Einleitung; `[n]`/URLs bleiben |
| P2 | **Dual-Provider-Nutzung** — bei `wikipedia`+`duckduckgo` möglichst Quellen aus beiden (wenn Treffer), Dedupe/Allowlist bleiben | Mind. ein Eval/Probe mit gemischten `provider`-Tags wenn beide liefern |
| P3 | **DDG-Qualität** — leere/englische Abstracts härter behandeln; bei Nutzlosigkeit nicht „ok“ mit Müll vortäuschen | Dünne DDG-Treffer → verwerfen oder klar als schwach; lieber Wiki-only / empty-refuse |
| P4 | **Deep-Scorecard Research** — Must-Fail-Dimensionen: Opt-in-off-no-net, PII-query, empty-refuse, citation-present | `scripts/scorecard_0_6_2.py` (oder Erweiterung) failt bei Regression |
| P5 | Eval `scripts/eval_0_6_2.py` + Version `0.6.2` | Suite grün; Health/UI `v0.6.2` |

## Won’t

- Hotfix-Blocker (liegen in Sprint 16 / `0.6.1`)
- Delight/Settings-Overhaul (→ Sprint 18 / `0.7.0`)
- Neue Provider außerhalb Allowlist / Cloud-LLM als Denker

## Abhängigkeiten

- Sprint 16 / `0.6.1` empfohlen (sonst doppelte Query-Arbeit)
- Kann entfallen/verschoben werden, wenn PO Delight priorisiert — dann als `0.6.2` nachziehen

## Exit / Abnahme

PO: Research-Antworten fühlen sich nach Jarvis an; Provider-Mix robuster; Scorecard deckt Deep-Test-Risiken ab. Tag **`v0.6.2`** (optional vor Delight).
