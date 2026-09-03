# Sprint 201 — Mag-ich-Parser ohne Hirn (`10.66.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** Should |
| Ziel-Version | **`10.66.0`** |
| Quelle | [`57-next.md`](../57-next.md) |
| Vorher | Memory-Tool G1 `Was trinke ich?` CODE. `Mag ich Döner?` fällt aufs LLM |

## Ziel

Pref-Fragen (`Mag ich …?`, `Mag ich noch Döner?`) gehen Parser → Memory oder Recall, auch ohne Gemini-Key.

## Must

| ID | Inhalt |
|----|--------|
| Q1 | `Mag ich Döner?` / `Mag ich noch Döner?` kein Hirn-Pflicht |
| Q2 | Mit Essen-Pin: ehrliche Antwort aus dem Pin (auch nach Contradiction-Delete: *Kein Essen gespeichert* oder *Nichts Belegtes*) |
| Q3 | Ohne Pin: ehrlich leer, nicht LLM-Halluzination |
| Q4 | `test:prompts` / Intensiv-Chat-Repro |

## Won’t

Jedes `mag ich` auf Memory zwingen (Musik, Filme). Neues Embedding.

## DoD

- [ ] Vite/Chat ohne Key: `Mag ich Döner?` → Memory/Recall-Satz, nicht *Kein Hirn bereit*
- [ ] G1 `Was trinke ich?` unverändert
