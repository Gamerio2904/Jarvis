# Sprint 237 — Micro-LLM + Research-lite (`15.1.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`15.1.0`** |
| Quelle | [`63-next.md`](../63-next.md) |
| Voraussetzung | Sprint **236** (`brain_v2` Stub grün) |

## Ziel

**Mehr LLM nur wo messbar besser:** `micro-clarify`, `micro-merge`, `research-lite` (Groq + DDG/Wiki). Shadow-Modus vergleicht mit Baseline — Slot erst Default an wenn SLO grün.

## Lieferumfang

- [x] `micro-clarify`: Groq bei Policy-Gleichstand (margin < ε), Budget 600 ms, Fallback Regex
- [x] `micro-merge`: Director/Agent `userFacts` → ein Groq-Format-Call (max 120 tokens)
- [x] `research-lite`: Groq fasst DDG/Wiki; Escalate → Gemini nur wenn Quellen < Schwelle
- [x] `brain_shadow_mode`: parallel messen, alte Antwort liefern bis PO freigibt
- [x] Settings `brain_micro_llm.clarify|merge` — default **aus**
- [x] Debug-Trace: `brainSlots[]` mit `{ slot, model, ms, ok }`

## DoD

- [ ] Shadow: p95 Smalltalk **≤ −15 %** vs. 236 ohne micro
- [ ] Shadow: Gleichstand-Fehlrouting **≤** Baseline `13.44`
- [ ] Shadow: research-lite Quellen **≥** Links-only Pfad
- [x] Kein zweiter voller Chat-Call pro Turn (Assert in Tests)
- [x] `test:brain-orchestrator.mjs` erweitert
- [x] `test:prompts` 181/181

## Risiko

Mittel — Qualitäts-Gates Pflicht. Ein Slot rot → nur diesen Slot Flag aus.
