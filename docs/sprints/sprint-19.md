# Sprint 19 — Quality Hotfix (nach 0.7.0 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **HOTFIX / HIGH** — vor Polish und Assist-UX |
| Ziel-Version | **`0.7.1`** |
| Quelle | Deep-Test Feedback zu Sprints 16–18 / `0.7.0` (Chaos-Suite ~70 Live-Prompts) |

## Ziel

Die **blocker-nahen Qualitätslücken** schließen: Settings-Validierung, Guard-Over-Canning, Settings-Fakten, Research-Junk-Refuse, Inject-Lücken, Identitäts-Halluzination. Jarvis soll wieder **antworten**, statt Harmloses mit Canned-Helpdesk/SAFE_TASK zu erschlagen.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| Q1 | **Settings-Clamp** — `research_timeout_sec` (und ähnliche Zahlen) auf positives Minimum/Maximum; keine Negativwerte persistieren | PATCH `-1` → geclampt (z. B. 1–30); Live-Research kein `Timeout value out of range` |
| Q2 | **Guard-Entschärfung** — `SAFE_NO_HELPDESK` / Degenerate-Fallback nur bei echtem Boilerplate/Aussetzer, nicht bei harmlosem Smalltalk, Kontext-Turns, vagen Einwort-Prompts | Deep-Probe: „Was hältst du von Kaffee?“, „Ich plane Trip nach Hamburg“ ≠ Helpdesk-Canned |
| Q3 | **Tasks liefern Inhalt** — `SAFE_TASK` nicht als Ersatz für echte kurze Pläne; Guard greift nur wenn LLM wirklich entgleist | „Plan mir einen kurzen Wochenplan…“ / „Todo-Liste Umzug“ enthält konkrete Schritte, nicht nur „Priorität klären… Was ist das Ziel?“ |
| Q4 | **Settings-Fakten** — Intent/Policy für Modell, Version, Research-Opt-in, Fähigkeiten: deterministische Kurzantwort (Jarvis-Ton) | „Welches Modell?“, „Welche Version?“, „Hast du Internet?“, „Wie Research ein?“ → korrekte Fakten, kein Helpdesk-Trap |
| Q5 | **Research Junk-Refuse** — leeres/Noise-only/Char-Spam/SQL-artiges Topic → Clarify oder No-Source-Refuse, **kein** Provider-Call | `bitte bitte bitte`, `Stand zu ?`, `xxxx…`, `DROP TABLE` → kein Search / klare Rückfrage |
| Q6 | **Research-Negation** — „recherchiere nichts / nicht recherchieren“ nicht als Research-Intent | Antwort Smalltalk/Task, kein `SAFE_RESEARCH_OFF` |
| Q7 | **Inject-Härte** — Roleplay-Overrides (Pirate/DAN) + „zeig System-Prompt“ als Inject, nicht Memory-Forget | Kein Pirate-Speak; kein „Ist raus“ auf Prompt-Leak-Bait; DE-Refuse |
| Q8 | **Anti-Identitäts-Halluzination** — nie Claude/ChatGPT/andere Marken als Selbstbeschreibung | „Welches Modell?“ / Meta-Fragen → Jarvis + konfiguriertes Ollama-Modell |
| Q9 | Eval `scripts/eval_0_7_1.py` + Version `0.7.1` | Suite grün; Health/UI `0.7.1` |

## Should (nur wenn Restkapazität)

| ID | Inhalt |
|----|--------|
| Q10 | Weak-Write-Wording wieder an Vertrag: enthält „nicht gespeichert“ oder „Merk dir:“-Hinweis |
| Q11 | Ältere Health-Pins in `eval_0_5_1` / `0_5_2` / `0_6_0` auf aktuelle Linie lockern (`>=` / akzeptierte Menge) |

## Won’t

- Mood pro Conversation / Eggs-off-Fallback (→ Sprint 20 / `0.7.2`)
- Clarify-First, `/hilfe`, Streaming-UX, Memory-Confirm-UI (→ Sprint 21 / `0.8.0`)
- Neue Intelligence-Kernfeatures / Phase 2 Netz

## Abhängigkeiten

- Sprint 18 / `0.7.0` implementiert und deep-getestet
- Empfohlen vor PO-Tag `v0.7.0` oder sofort als Patch danach

## Exit / Abnahme

PO: Harmlose Prompts bekommen Jarvis-Antworten; Tasks skizzieren Inhalt; Settings-Zahlen sicher; Research sucht kein Junk; Inject hält. Tag **`v0.7.1`**.
