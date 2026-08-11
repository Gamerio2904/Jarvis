# Sprint 02 — MVP Must-Fixes

| Feld | Wert |
|------|------|
| Status | **PLANNED** (nächster Bau-Sprint nach 0.1.0-Review) |
| Ziel-Version | **`0.1.1`** |
| Quelle | MVP-Testdurchlauf (Edge Cases, Injection, Persona) |

## Ziel

Jarvis ist **abnahmetauglich im Charakter**: keine leichten Prompt-Hijacks, kein Dauer-Duzen/Coach-Sprech, weniger Müll-Output — auf sinnvollem Modell.

## Must (alles in dieser Version)

| ID | Fix | Done wenn |
|----|-----|-----------|
| F1 | **Modell-Default für Zielhardware** | Settings/Doku: `qwen2.5:7b` (oder gleichwertig) für RTX 3060; 3b nur als Fallback dokumentiert |
| F2 | **Persona-Prompt härten** | Kein Duzen; Anti-Injection; Anti-Boilerplate; Stil-Anker ohne Copy-Paste; wenige Few-Shots |
| F3 | **Leichter Output-Guard** | Klare Inject-Treffer (`PWNED`, `HACKED`, `JA_ICH_GEHORCHE`, …) → verwerfen + 1× neu generieren oder sichere Ablehnung |
| F4 | **Sampling gegen Kollaps** | Weniger „RefCount“/Nonsense; `repeat_penalty` / Temp/Top-P justiert, Variation bleibt |
| F5 | **Regression-Smoke** | Kurze automatisierte Checks: Begrüßung, Kontext, 2–3 Inject-Prompts, Duzen-Smell |

## Explizit nicht in `0.1.1`

- Streaming, Chat-Löschen, Premium-Motion, Eval-Suite groß, UI-Retry-Komfort → **`0.2.0`**

## Exit / Abnahme

- Dieselbe Testbatterie wie MVP-Review: Inject schlägt nicht mehr durch
- Smalltalk wirkt jarvis-näher (Sie/ohne Du, keine Listen-Manie, keine „Gerne!“-Schleife)
- Tag **`v0.1.1`** nach PO-OK
