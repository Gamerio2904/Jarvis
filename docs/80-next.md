# 80 — Hirn und Agenten härten **PLAN**

Deep-Research nach den Fixes in `18.8.3`+ (Kalender-Umbenennung,
Osiris-Leiste, Watchliste Publikum, Pending-Frist). `18.5` (301–306)
bleibt PLAN und läuft **nicht** parallel.

Quellen (MIT/Apache, kein Copy der Apps):

- [blayer/EdgeCat](https://github.com/blayer/EdgeCat) — Planner → Executor → Evaluator um dasselbe On-Device-LLM
- [SangbumChoi/LocalAgent](https://github.com/sangbumchoi/localagent) — Abstention, Schema-Decode, Tool-Selector
- [AgentGate](https://arxiv.org/html/2604.06696v1) — Action-first Routing, Escalation statt Halluzination
- [slm-orchestrator](https://pypi.org/project/slm-orchestrator/) — 5-stufiger Fallback-Parser
- [Guardians](https://github.com/metareflection/guardians) — Plan erst prüfen, dann ausführen (Idee, kein Z3 in der APK)

## 0. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Hirn | Parser zuerst. Kein zweites Modell, kein LLM-Organizer, kein e5 in `pickRoute`. |
| Verify | **Regeln zuerst**, LLM-Richter nur bei uneindeutigem Ausgang — wie EdgeCat. |
| Pending | Kalender-Frist bleibt, bis Offset oder neuer Kalender-Satz. „Soll ich?“ fällt weiter mit dem nächsten Befehl (`78`). |
| Fail | Fehlschlag merken (`noteFail`). Kein LLM-Erfolg nach Write/Device. |
| 18.5 | Unberührt. |

## 1. Ist (nach diesem Execute)

Director: preflight → pending → `decideTurn` → Agent → sonst Propose/Unknown/LLM.
Kein generischer Verify-Schritt. `failureReply` stoppt Write/Device/factual.
Kalender-Frist wurde bisher bei jedem Folgesatz gelöscht. Chat konnte
„Ist erledigt“ sagen, ohne zu schreiben.

## 2. Vorschläge (nächste Schiene, nicht 18.5)

| # | Was | Warum (OSS) | Aufwand |
|---|-----|-------------|---------|
| A | **Rules-first Verify** nach Write: Modul sagt `ok`/`leer`/`fehler`. Nur `leer` darf einen Ein-Satz-Check (Groq JSON, kein Chat). | EdgeCat: Evaluator nur bei Ambivalenz | klein |
| B | **Abstention-Slot** im Router: `pick.kind === 'none'` + commandish → Unknown, nie Chat. Schon da; auf alle Read-Fails ohne `factual` ausweiten. | LocalAgent abstain | klein |
| C | **Fail-Memory in `RouteCtx`**: `last_failed_tool` aus `noteFail`, Prior senken, Retry-Satz vorschlagen. | EdgeCat replan | mittel |
| D | **JSON-Repair nur für Propose**, nicht für Antworten. | EdgeCat parser repair; Constraint-Tax: hartes Schema senkt SLM-Genauigkeit | klein |
| E | **Action-then-ground** für Propose: erst Agent-Id, dann deutscher Satz. | AgentGate | mittel |
| F | **Kein Micro-Merge** auf Tool-Bestätigungen. Kalender/Watchliste schon. Rest der Write-Agenten. | slm-orchestrator: structured path nicht umschreiben | klein |

Won’t: Qdrant, Mem0, Graphiti, zweites Hirn, Z3, Pipecat, e5 in `pickRoute`.

## 3. Schiene (PLAN, nicht ausführen)

| Sprint | Thema |
|--------|--------|
| 331 | Rules-first Verify + Fail-Memory in Ctx |
| 332 | Abstention auf Read-Fails; Micro-Merge-Allowlist |
| 333 | Propose: Action-then-ground + Repair |
| 334 | Härten, Gold unverändert (`GOLD_EXPECT` = `TEST_PROMPTS`) |

Nicht parallel zu `18.5`.
