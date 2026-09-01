# Sprint 138 — Retrieve + Quelle (`7.0.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `7.0.0`) |
| Priorität | V5 nach Leitentscheidung |
| Ziel-Version | `7.0.0` |
| Quelle | [`49-next.md`](../49-next.md) 7.10 / 6.61 |
| Plan | Industry V5 Teil 2 |

## Ziel

Recall nennt die Quelle (Kalender, Pin, Gespräch, Einkauf). `Was weißt du über den Zahnarzt` trifft den Termin, nicht die Pin-Liste. `Was weißt du über mich` bleibt Memory, nicht Recall.

## Must

| ID | Inhalt |
|----|--------|
| R1 | `formatRecallReply` mit Store-Quelle |
| R2 | `handleRecall` über `packVerified` — Treffer ohne Quelle = failed |
| R3 | Leeres Recall ist ehrlich, nicht erfunden |

## Won’t

Embeddings. Chat-Titel:body-Dumps.

## DoD

- [x] `pickRoute('Was weißt du über den Zahnarzt') === 'recall'`
- [x] Reply enthält `Kalender` beim Termin-Hit
