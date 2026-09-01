# Sprint 144 — Gemini-Abbruch & Research-Pending (`6.93.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | V1 Abschluss nach 143 |
| Ziel-Version | `6.93.0` |
| Quelle | Phase-0-Audit S4–S6, [`51-phase0-audit.md`](../51-phase0-audit.md) §7 |
| Plan | Industry V1 Teil 3 |

## Ziel

Unvollständige Gemini-Sätze retry oder klarer Abbruch. `ja bitte` nach Such-Angebot führt die gemerkte Frage aus. Tweets sind Live-Lookup. Begrüßung nach Gerätezeit; Vorname nicht in der Anrede.

## Must

| ID | Inhalt |
|----|--------|
| C1 | `completeGemini`: MAX_TOKENS/ohne Satzende → Retry mit 1800 Tokens, nicht nur der erste Kurzversuch |
| C2 | `streamGemini` ohne Satzende → `completeGemini` |
| C3 | `looksTruncated` vor `scrubReply`; sonst `REPLY_TRUNCATED` |
| C4 | `ja bitte` / `RESEARCH_YES` + `last_step_tool` research/research_offer → gemerkte Äußerung |
| C5 | Tweets/Twitter/getweetet/gepostet in `isLiveLookup` |
| C6 | `stripVocativeNames`; Persona: Siezen, kein „Timon, …“ |
| C7 | Greeting aus Geräteuhr; User sagt Abend nach Mitternacht → Abend, nicht Guten Tag |
| C8 | Version `6.93.0` |

## Won’t

Volles Action-System (V3). TTS-Kaskade. Gemini-Banner aus jeder Fläche (V2). Chip-Zähler weg (V2).

## DoD

- [x] `ja bitte` nach `research_offer` schreibt die Ursprungsfrage zurück
- [x] Elon-Tweet ist `isLiveLookup`
- [x] `Guten Morgen` bleibt Brief, nicht Greeting
- [x] `test:014` grün
- [x] Typecheck grün
