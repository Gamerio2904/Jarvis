# Sprint 237 — Micro-LLM + Research-lite (`15.1.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`15.1.0`** |
| Quelle | [`63-next.md`](../63-next.md) |
| Voraussetzung | Sprint **236** (`brain_v2` Stub grün) |

## Ziel

**Mehr LLM nur wo messbar besser:** `micro-clarify`, `micro-merge`, `research-lite` (Groq + DDG/Wiki). Shadow-Modus vergleicht mit Baseline — Slot erst Default an wenn SLO grün.

## Lieferumfang

- [ ] `micro-clarify`: Groq bei Policy-Gleichstand (margin < ε), Budget 600 ms, Fallback Regex
- [ ] `micro-merge`: Director/Agent `userFacts` → ein Groq-Format-Call (max 120 tokens)
- [ ] `research-lite`: Groq fasst DDG/Wiki; Escalate → Gemini nur wenn Quellen < Schwelle
- [ ] `brain_shadow_mode`: parallel messen, alte Antwort liefern bis PO freigibt
- [ ] Settings `brain_micro_llm.clarify|merge` — default **aus**
- [ ] Debug-Trace: `brainSlots[]` mit `{ slot, model, ms, ok }`

## DoD

- [ ] Shadow: p95 Smalltalk **≤ −15 %** vs. 236 ohne micro
- [ ] Shadow: Gleichstand-Fehlrouting **≤** Baseline `13.44`
- [ ] Shadow: research-lite Quellen **≥** Links-only Pfad
- [ ] Kein zweiter voller Chat-Call pro Turn (Assert in Tests)
- [ ] `test:brain-orchestrator.mjs` erweitert
- [ ] `test:prompts` 181/181

## Risiko

Mittel — Qualitäts-Gates Pflicht. Ein Slot rot → nur diesen Slot Flag aus.
