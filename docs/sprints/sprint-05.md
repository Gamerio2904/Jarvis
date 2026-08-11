# Sprint 05 — Charakter-Feinschliff (Post-0.2.1 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.2.2`** |
| Quelle | Deep-Test nach Sprint 4 (`0.2.1`) auf `qwen2.5:7b` — 21 OK / 2 FIX / 0 FAIL |

## Ziel

Die beiden verbleibenden **Charakter-FIX**-Fälle sind geschlossen: kein Hilfe-Boilerplate nach Duzen-Bait, und harmlose „kaputt“-Smalltalk-Antworten klingen nach Jarvis — nicht nach Canned-Aussetzer.

## Kontext (Befund)

| Symptom | Schwere | Beispiel |
|---------|---------|----------|
| Boilerplate nach „Sprich mich mit du an…“ | FIX | „Wie kann ich Ihnen heute helfen?“ trotz Siezen |
| Harmloses „Bin etwas kaputt heute.“ → Canned | FIX | oft nur „Kurzer Aussetzer. Nochmal von vorn…“ statt Jarvis-Ton |

Sicherheit (Inject/Listen/Duzen/Sticky-Token) bleibt **grün** — Scope ist nur Charakterqualität.

## Must

| ID | Fix | Done wenn |
|----|-----|-----------|
| C1 | **Boilerplate hard-refuse** — nach max. Retries weiterhin Hilfe-Floskeln (`wie kann ich … helfen`, „Entschuldigung für den Fehler“, ähnliche Desk-Sätze) → Refuse/Regen mit Jarvis-Ton; Eval deckt `du_prompt`-Fall ab | Deep-Test: `du_prompt` ohne Boilerplate-Smell |
| C2 | **Kaputt-Pfad jarvis-treu** — Nutzer sagt „Bin etwas kaputt“: keine Sticky-Phrase im Reply **und** kein unnötiger `SAFE_DEGENERATE`-Canned, sondern kurze freche Jarvis-Antwort (Kante/Ruhe); Guard unterscheidet Sticky-Müll vs. normales Smalltalk-Echo | Deep-Test: `kaputt` OK ohne `guarded_canned` |

## Should

| ID | Inhalt |
|----|--------|
| C3 | Regen-Nudge + Persona: explizit „kein Helpdesk / keine Entschuldigungsfloskel“ |
| C4 | `scripts/eval_0_2_2.py` (oder Erweiterung von `eval_0_2_1`) für C1/C2 |

## Won’t

- Neue Features (Motion, Gedächtnis, Handy, TTS)
- Aufweichen der Inject-/Listen-/Duzen-Sicherheit aus `0.2.1`
- Tag `v0.2.1` ersetzen — `0.2.2` ist Patch danach

## Exit / Abnahme

1. Eval C4 grün auf `qwen2.5:7b`
2. Deep-Test der beiden FIX-Fälle: **0 FIX**
3. Kurzer Live-Check: Greeting + Kaputt + Du-Bait fühlen sich jarvis-näher an
4. Nach PO-OK: Tag **`v0.2.2`**

## Increment

Patch: Charakterfeinschliff ohne Feature-Scope — Boilerplate härter, Kaputt-Antworten menschlicher.
