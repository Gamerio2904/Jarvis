# Sprint 20 — Reply Quality Polish (nach 0.7.1 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **HIGH** — vor Delight-Polish und Assist |
| Ziel-Version | **`0.7.2`** |
| Quelle | Deep-Test Feedback zu Sprint 19 / `0.7.1` |

## Ziel

Die **Restschwächen nach dem Quality-Hotfix** schließen: weniger Canned-Smalltalk, stabiler Memory-Recall, kein CJK/Sprach-Leak in Tasks, Multi-Turn nicht durch Fallbacks zerstören. Jarvis soll harmlose Prompts **wirklich beantworten**.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| R1 | **SAFE_SMALLTALK drosseln** — nur nach echtem Guard-Fail (Boilerplate/Degenerate), nicht als Default bei leichtem Duzen/EN-Touch; LLM-Antwort bevorzugen oder leicht repairen | `Hallo Jarvis`, Hamburg-Trip, `OK`/`Danke` ≠ reines „Alles klar… worum geht's?“; Canned-Quote in Chaos-Suite klar unter vorherigem Niveau |
| R2 | **Memory-Recall ohne Helpdesk** — nach Write/Recall nie `SAFE_NO_HELPDESK` / `SAFE_SMALLTALK` als Final | `Merk dir: Ich heiße Nora` → `Wie heiße ich?` enthält Name oder Memory-Ack, kein Helpdesk |
| R3 | **CJK / Non-DE auf Task** — CJK/Kyrillisch in Task-Antworten → Retry oder Intent-Fallback; kein Mischtext | Umzug-Todo / Pläne ohne CJK-Zeichen |
| R4 | **Duzen weicher behandeln** — nicht sofort Full-Canned; Strip/Retry bevor SAFE_* | Task-Pläne bleiben Inhalt, Anrede Sie/neutral |
| R5 | **Multi-Turn nicht canned-killen** — Kontext-Turns (Budget, Ort, Folgefragen) dürfen nicht in SAFE_SMALLTALK landen | „Budget 150“ → „Was war das Budget?“ trifft 150 (ohne dazwischen Helpdesk/Smalltalk-Canned) |
| R6 | **Capabilities-Fakt** — `Was kannst du alles?` deterministisch kurz (Lokal/Memory/Research/Eggs), kein LLM-Waffle | Antwort nennt Kernfähigkeiten + Limits in &lt;5 Zeilen |
| R7 | Eval `scripts/eval_0_7_2.py` + Version `0.7.2` | Suite grün; Health/UI `0.7.2` |

## Should

| ID | Inhalt |
|----|--------|
| R8 | Soft-Inject-Bait (`HACKED_OK` ohne Jailbreak-Muster) → klarer Refuse oder Ignorieren ohne SAFE_SMALLTALK |
| R9 | Chaos-Kernfälle aus `0.7.1`-Deep-Test in Eval (Canned-Rate, Recall, CJK) |

## Won’t

- Mood pro Conversation / Eggs-off (→ Sprint 21 / `0.7.3`)
- Clarify-First, `/hilfe`, Streaming-UX (→ Sprint 22 / `0.8.0`)
- Phase 2 Netz/Auth

## Abhängigkeiten

- Sprint 19 / `0.7.1` implementiert und deep-getestet

## Exit / Abnahme

PO: Smalltalk antwortet wieder; Recall trifft Fakten; Tasks bleiben Deutsch/Inhalt. Tag **`v0.7.2`**.
