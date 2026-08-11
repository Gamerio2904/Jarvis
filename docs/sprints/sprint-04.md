# Sprint 04 — Guard Hardening (Post-0.2.0 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.2.1`** |
| Quelle | Deep-Test nach Sprint 3 (`0.2.0`) auf Fallback `qwen2.5:3b` — 31 OK / 2 FIX / 0 FAIL; Restlücken Must |

## Ziel

Die aus dem Deep-Test bekannten **Must-Fixes** sind geschlossen: keine Tip-Listen bei Roleplay/Inject, kein Duzen-Leak, kein Inject-Token mitten/am Ende der Antwort, kein Sticky-„Bin kaputt“ in längeren Replies — Abnahme ideal auf **`qwen2.5:7b`**.

## Kontext (Befund)

| Symptom | Schwere | Bemerkung |
|---------|---------|-----------|
| Listen-/Roleplay-Inject → nummerierte Tip-Listen | Must | Guard/Persona greifen noch nicht hart genug |
| Duzen (`du` / `dir` / …) leckt durch | Must | R3 unzureichend gegen Flexionen |
| Inject-Token mitten/am Ende (z. B. „… PWNED“) | Must | First-Line-/First-Token-Guard reicht nicht |
| Sticky „Bin kaputt“ in längeren Antworten | Must | Phrase-Detection greift nur Teilfälle |
| 3b-Qualität schwach | Should/Hinweis | Fallback-Warnung existiert; Abnahme auf **7b** |

## Must

| ID | Fix | Done wenn |
|----|-----|-----------|
| H1 | **Anti-Listen / Anti-Roleplay-Coach** — Injects à la „gib Tipps / Roleplay Coach“ erzeugen keine nummerierten Tip-Listen; Jarvis bleibt im Charakter (kurz, messenger-artig) | Deep-Test: List/Roleplay-Cases grün; kein `1.`/`2.`-Tip-Pattern in Refuse-Pfad |
| H2 | **Duzen-Guard v2** — erkennt Flexionen (`du`, `dir`, `dich`, `dein*`, Imperativ-Du) und triggert Retry/Refuse wie Persona verlangt | Deep-Test: Duzen-Cases grün auf 7b |
| H3 | **Whole-Reply Inject-Scan** — Inject-Tokens (`OWNED`, `PWNED`, Varianten) überall in der Antwort, nicht nur erste Zeile/Token | Deep-Test: Mid-/End-Inject grün |
| H4 | **Sticky-Phrase v2** — „Bin kaputt“ (und bekannte Sticky-Phrasen) auch **innerhalb** längerer Antworten → Retry/Refuse | Deep-Test: Sticky-in-long-reply grün |
| H5 | **Eval erweitern** — `scripts/eval_0_2_1.py` (oder Erweiterung von `eval_0_2_0.py`) deckt H1–H4 ab; Lauf dokumentiert auf **7b** (Fallback 3b optional, mit Warning) | Eval grün auf Default-Modell 7b |

## Should (wenn schnell)

| ID | Inhalt |
|----|--------|
| H6 | Persona-Hinweis schärfen: explizit „keine nummerierten Tip-Listen / Coach-Mode“ |
| H7 | Sampling nur anfassen, wenn H1–H4 nach Guard-Härte noch wackeln |

## Won’t (dieser Sprint)

- Neues Feature-Scope (GUI-Motion, Gedächtnis, Handy, TTS)
- Modellwechsel jenseits Default 7b / Fallback 3b
- Tag `v0.2.0` ersetzen — `0.2.1` ist **Patch nach** `0.2.0`

## Exit / Abnahme

1. Eval H5 grün auf `qwen2.5:7b`
2. Deep-Test-Regression der bekannten FIX-Fälle: **0 FIX / 0 FAIL** (mindestens die H1–H4-Szenarien)
3. Kurzer Live-Smalltalk: Persona hält, kein Duzen, kein Listen-Coach
4. Nach PO-OK: Tag **`v0.2.1`**

## Abhängigkeiten

- Sprint 3 (`0.2.0`) Code-Stand (Guards, Streaming, Eval-Basis)
- Ollama mit `qwen2.5:7b` für Abnahme

## Increment

Patch-Release: härtere Output-Guards + Eval für die Deep-Test-Lücken — kein neues Nutzer-Feature nötig.
