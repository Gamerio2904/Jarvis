# Sprint 31 — Memory Quality Hotfix

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **HIGH** — Live-Probe nach `0.9.2` |
| Ziel-Version | **`0.9.3`** |
| Quelle | Feedback-Probe (Multi-Fact verloren, Recall→Smalltalk-Halluzination) |

## Ziel

Memory **vollständig und ehrlich**: ein „Merk dir“-Satz speichert alle Fakten; Fragen zu bekannten Prefs routen auf Recall statt Smalltalk-LLM.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| M1 | **Multi-Fact Write** — „Ich heiße X und trinke Y“ → beide Fakten | Eval: beide Keys recallbar |
| M2 | **Pref-Recall-Routing** — „Was trinke/mag/esse ich?“ → `memory.recall`, kein Smalltalk | Gold + Live: keine Halluzination |
| M3 | **Identity/Pref Honesty** — unbekannte Prefs → klare Unsicherheit, kein Raten | Eval-Fälle grün |
| M4 | Eval `scripts/eval_0_9_3.py` + Version `0.9.3` | Suite grün |

## Should

| ID | Inhalt |
|----|--------|
| M5 | Soft-Harvest trennt mehrere Prefs im selben Satz |
| M6 | Deep `scripts/deep_0_9_3.py` |

## Won’t

- Smart-Home / Fire TV / Mail
- Phase 2 Handy-Auth
- Neue Tool-Typen

## Exit / Abnahme

PO: Multi-Fact sitzt; Pref-Fragen recallen statt erfinden. Tag **`v0.9.3`**.

## Danach

- Sprint 32 / `0.9.4` Assist Continuity & Siezen
