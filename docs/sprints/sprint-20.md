# Sprint 20 — Quality Polish (nach 0.7.1)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **Should** — nach Hotfix `0.7.1` |
| Ziel-Version | **`0.7.2`** |
| Quelle | Deep-Test Feedback zu `0.7.0` (Should/Quality) + Nachzieher aus Sprint 19 |

## Ziel

Die **nicht-blocker Qualitäts- und Delight-Lücken** schließen: Session-Scope, Eggs-Fallbacks, Persona-Konsistenz, Research-UX-Texte, leichte Latenz, Regression-Suite aus der Chaos-Probe.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| P1 | **Mood pro Conversation** — `/kante`/`/ruhe` nicht process-global | Chat A Mood leaked nicht in Chat B; Restart darf resetten |
| P2 | **Eggs-off Fallback** — bei `easter_eggs_enabled=false` deterministische Kurzantwort oder klare Ablehnung (kein LLM-Settings-Waffle) | `/protokoll` / `/mission` bei Eggs aus → kurz, kein Nested-Settings-Gequassel |
| P3 | **Persona-Konsistenz** — Emoji-Strip zuverlässig; Anrede Sie/Master laut `07` ohne Wildwuchs; keine „Hilfs-Assistent“-Floskeln | Probe: keine Emoji in finalen Replies; kein „Wie kann ich helfen?“-Hero |
| P4 | **Research-Fehler-UX** — Timeout/Provider-Down/Empty verständlich und unterscheidbar; Query in Meta/Audit klar | Nutzer sieht Ursache (Timeout vs. keine Quelle); kein stummes Empty ohne Hinweis |
| P5 | **Query-Hygiene Nachzug** — Topic ohne führendes „Wikipedia“-Spam; Char-Spam kollabieren | `Recherchiere Wikipedia zu Einstein` → Topic ≈ `Albert Einstein` |
| P6 | **Chaos-Regression** — `scripts/eval_0_7_2_chaos.py` (oder Scorecard) mit Kernfällen aus Deep-Test | Suite grün auf Must-Fällen; dokumentierte Should-Toleranzen |
| P7 | Version `0.7.2` + Eval/Scorecard-Update | Health/UI `0.7.2` |

## Should

| ID | Inhalt |
|----|--------|
| P8 | Soft-Latenz: kürzeres `num_predict` / weniger Retries bei Smalltalk & Eggs; Task behält Budget |
| P9 | Delight-Caps (Moments/Jokes) optional in DB statt nur In-Process (überlebt Restart am Tag) |
| P10 | Dual-Source-Synth: DE+EN nicht pauschal als „widersprechen“ labeln, wenn Inhalt komplementär |
| P11 | Clarify-Spacing / Typo-Guards bei Memory-Clarify („mir.Pizza“ → sauber) |

## Won’t

- Clarify-First-Flow, `/hilfe`, Streaming-Wahrnehmung, Memory-Confirm-UI (→ Sprint 21)
- Phase 2 Handy/Auth, Tools, TTS

## Abhängigkeiten

- Sprint 19 / `0.7.1` Must grün
- Delight/Research aus `0.6.x`–`0.7.0` vorhanden

## Exit / Abnahme

PO: Mood isoliert; Eggs-off klar; Ton ruhiger; Research-Fehler lesbar; Chaos-Suite als Netz. Tag **`v0.7.2`**.
