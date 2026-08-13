# Sprint 26 — Siezen & Recall Hotfix (nach 0.8.3 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Priorität | **HIGH** — Qualitäts-Patch, kein neues Fähigkeitsniveau |
| Ziel-Version | **`0.8.4`** |
| Quelle | Deep-Test `/tmp/deep_083.log` nach Sprints 23–25 / `0.8.3` |

## Ziel

Die **Restschwächen nach dem `0.8.3`-Deep-Test** schließen: saubereres Siezen (keine Mischformen), klarer Identitäts-Recall (ein Name), weniger Canned bei CJK-Tasks, Eval-Pins/Hygiene — ohne neues MINOR.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| P1 | **Broken-Siezen Heuristik erweitern** — u. a. `möchtest/schaffst/bleibst/willst/… + Sie`, `Sie haben Sie`, `Ruh Sie` | Deep-Stichproben (Hallo Jarvis, Moin, Nora-Recall, Multi-Turn) ohne diese Muster; Unit auf Phrasen |
| P2 | **`soften_duzen` Nachzug** — Map für erweiterte Verben (`möchtest`→`möchten`, `schaffst`→`schaffen`, `bleibst`→`bleiben`); Doppel-`Sie` kollabieren | `Möchtest Sie` → `Möchten Sie`; `Sie haben Sie` → sinnvolles `Sie haben`/Recall-Fallback |
| P3 | **Identitäts-Recall priorisieren** — bei „Wie heiße ich?“ genau **einen** Name-Key (höchste Conf / jüngster), keine Nora+Klaus-Liste | Eval: nach Write Klaus → Recall nur Klaus (nicht zusätzlich fremde Namen) |
| P4 | **CJK-User-Task nicht Smalltalk-canned** — User-CJK in Task-Prompt → Task-Fallback/Retry, nicht `SAFE_SMALLTALK` | Deep-Case „1. 搬家 … Plan“ liefert Plan oder `SAFE_TASK`, nicht Smalltalk-Canned |
| P5 | Eval `scripts/eval_0_8_4.py` + Version `0.8.4` | Suite grün; Health/UI `0.8.4` |

## Should

| ID | Inhalt |
|----|--------|
| P6 | Ältere Evals (`eval_0_8_0`, ggf. `0_7_1`) Version-Pin auf `0.8.x` akzeptieren |
| P7 | Persona-Rauschen drosseln: weniger „Kumpel“/überdrehte Begrüßung bei Sie-Anrede |
| P8 | Deep-Test-Skript als `scripts/deep_0_8_4.py` (oder `deep_0_8_x.py`) versionieren |
| P9 | Recall-Ack-Fallback wenn Soften kaputt → `ack_reply_for_recall` statt „Sie haben Sie…“ |

## Won’t

- Neue Tools / `0.9.0`
- Phase 2 Auth/Handy, NAS, TTS
- Research-Provider-Erweiterung

## Abhängigkeiten

- `0.8.3` Deep-Test durch (MUST ~66/69; echte Findings = Siezen/Recall/CJK)
- Baut auf `soften_duzen` / Identity-Retrieve aus Sprints 23–24

## Exit / Abnahme

PO: Keine typischen `*st Sie`-Mischformen in Stichprobe; Identitäts-Recall eindeutig; CJK-Task nicht Smalltalk-Canned; Eval `0.8.4` grün. Tag **`v0.8.4`**.

## Danach

- Optional **`0.9.0`** (Tools / stärkeres Assist) — **PO-Kommando**
- Phase 2 / NAS `1.0.0` — **PO-Kommando**
