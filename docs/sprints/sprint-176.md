# Sprint 176 — Kokoro-Spike + e5-Rerank (`9.10.3`) **PLAN** · Could

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | `9.10.3` (Spike; Bundle nur bei doppeltem GO) |
| Quelle | [`54-next.md`](../54-next.md) · Sprint 173–175 |
| Pflicht | **Could** — Default ist **nicht** bundeln |

## Ziel

Zwei unabhängige Spikes, keine Router-Änderung.

### Kokoro-82M

Studio-TTS vs Edge / Algieba / Piper (wenn 175 GO). **Nicht** parallel zu Piper in der APK. GO nur wenn näher an Algieba als Piper **und** Piper reicht nicht.

### e5-small (~120 MB)

Nur Umsortieren von `retrieve.ts`-Treffern. **Nie** `pickRoute`. GO nur wenn Keyword-RRF auf einem PO-Set **messbar** daneben liegt (≥3 klare Fehltreffer). Sonst Freeze.

## Must

| ID | Inhalt |
|----|--------|
| K1 | Eine Tabelle: Modell, MB, First-Audio oder nDCG/Treffer, Votum |
| K2 | Kein Embeddings-Router, auch nicht „nur ein bisschen“ |
| K3 | Kein stilles +200 MB in `releases/Jarvis.apk` |

## Won’t

LanceDB. Nemotron. LLMLingua. e5 als Intent-Score. Kokoro+Piper+Edge+Algieba alle an.

## DoD

- [ ] Zwei Voten (Kokoro, e5), jedes GO oder NO-GO
- [ ] `test:014` / Recall-Parser grün ohne e5
