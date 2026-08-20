# Sprint 32 — Assist Continuity & Siezen

| Feld | Wert |
|------|------|
| Status | **PARKED** — Siezen-Scrub in Sprint 105 / `2.2.3` |
| Priorität | **HIGH** — Live-Probe (Clarify-Follow-up, Broken-Siezen, EN-Leak) |
| Ziel-Version | **`0.9.4`** |
| Quelle | Feedback nach `0.9.2`; Carry aus Sprint 27 Continuity |

## Ziel

Assist-Flows **halten die Spur**: nach Clarify kommt ein Plan, nicht Smalltalk; Siezen/EN bleiben sauber.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| C1 | **Clarify→Plan hart** — Follow-up nach Clarify immer `task` (+ Plan-Antwort) | Live: Training-Follow-up = Plan |
| C2 | **Residual-Siezen v4** — `meinst`/`sagst`/`mögtet`/`hattest Sie` softenen oder canned | Deep: broken_siezen=0 auf Probe-Set |
| C3 | **EN-Leak Guard** — z.B. „Computer games“ → DE oder Refuse | Eval-Stichprobe |
| C4 | Eval `scripts/eval_0_9_4.py` + Version `0.9.4` | Suite grün |

## Should

| ID | Inhalt |
|----|--------|
| C5 | Kaputt-/Müll-Input → knappe jarvis-treue Nachfrage (weniger LLM-Drama) |
| C6 | `model_heavy` ≠ `model_default` Hinweis/Defaults in Settings |

## Won’t

- Smart-Home
- Native App
- TTS

## Exit / Abnahme

PO: Clarify-Continuity spürbar; Siezen/EN stabil. Tag **`v0.9.4`**.

## Danach

- Sprint 33 / `0.9.5` Tools Hygiene & Confirm-UX
- Ab Sprint 34: NAS+APK (`0.10.x`)
