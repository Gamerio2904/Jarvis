# Sprint 03 — Qualität & Robustheit (Verbesserungen)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.2.0`** |
| Quelle | MVP-Test „Verbessern“-Rest + Backlog Shoulds |

## Ziel

MVP bleibt stabil; Nutzung wird **robuster und angenehmer**, ohne schon Phase-2/NAS anzufassen.

## Scope (Should / Verbesserungen)

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| I1 | **UI-Fehlerfälle klarer** | Offline/Timeout/Modell-fehlt verständlich; optional Retry-Button |
| I2 | **Streaming-Antworten** | Tokens erscheinen live (Typing fühlt sich echter an) |
| I3 | **Injection-Härte ausbauen** | Mehr Patterns / System-Sandwich; Guard über reine Keyword-Liste hinaus |
| I4 | **Qualitäts-Eval im Repo** | Testskript (Happy/Edge/Müll/Inject/Persona-Smells) versioniert unter `scripts/` oder `tests/` |
| I5 | **Chat löschen** | Einzelnes Gespräch löschbar (Persistenz-Hygiene) |
| I6 | **Feintuning Sampling/UX** | Nach 0.1.1 nachziehen: Latenz-Hinweise, leichte UI-Politur (noch Motion light) |

## Explizit nicht in `0.2.0`

- Premium-Motion-GUI-Update → eigenes späteres MINOR  
- Maximal-Gedächtnis → späteres MINOR  
- Handy/VPN (Phase 2), NAS (`1.0.0`), TTS → später  

## Exit / Abnahme

- Eval-Suite läuft lokal grün auf dem gewählten Modell
- Streaming + Löschen + bessere Fehler-UX vom PO ok
- Tag **`v0.2.0`**
