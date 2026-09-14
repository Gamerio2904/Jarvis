# Sprint 238 — Dual Brain Gold + Sideload (`15.2.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must — Defaults `brain_v2`, `brain_micro_llm_clarify`, `brain_micro_llm_merge` stehen auf `true` (`store.ts`) |
| Ziel-Version | **`15.2.0`** |
| Quelle | [`63-next.md`](../63-next.md) |
| Voraussetzung | Sprint **237** Shadow grün (B1, B5, B6) |

## Ziel

Dual Brain **ship**: Default `brain_v2: true`, `brain_primary: groq`, Micro-Slots an wo Shadow ok. Sideload **`15.2.0`**, Docs CODE.

## DoD

- [ ] Gold **B1–B8** aus [`63-next.md`](../63-next.md) §8
- [ ] `test:prompts` + `test:014` + `test:agents` + `test:brain-orchestrator`
- [ ] Settings-UI: Hirn-Reihenfolge erklärt (Groq first, Gemini Spezialist)
- [ ] [`16-gemini.md`](../16-gemini.md) aktualisiert (Gemini = Spezialist, nicht Default-Chat)
- [ ] APK `releases/Jarvis.apk` versionCode bump
- [ ] [`42-planned.md`](../42-planned.md) Pull-Reihenfolge: 15.x **CODE**

## Abnahme PO

- [ ] 3 Tage Dev-Alltag: Smalltalk spürbar schneller, Vision/Research unverändert gut
- [ ] Rollback getestet: `brain_v2` aus → 13.44-Verhalten
