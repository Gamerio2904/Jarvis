# Sprint 21 — Delight & Session Polish

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Priorität | **Should** — nach Reply-Quality `0.7.2` |
| Ziel-Version | **`0.7.3`** |
| Quelle | Rest aus altem Sprint-20-Plan + `0.7.0`/`0.7.1` Shoulds (Mood, Eggs, Research-UX, Latenz) |

## Ziel

**Session-/Delight- und Research-UX-Lücken** schließen: Mood-Scope, Eggs-off, Persona-Feinschliff, verständliche Research-Fehler, leichte Latenz — ohne neues Assist-MINOR.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| D1 | **Mood pro Conversation** — `/kante`/`/ruhe` nicht process-global | Chat A Mood leaked nicht in Chat B |
| D2 | **Eggs-off Fallback** — bei `easter_eggs_enabled=false` deterministische Kurzantwort oder klare Ablehnung | `/protokoll` / `/mission` bei Eggs aus → kurz, kein Settings-Waffle |
| D3 | **Persona-Konsistenz** — Emoji-Strip; Anrede Sie/Master laut `07`; keine Helpdesk-Hero-Floskeln | Finale Replies ohne Emoji-Wildwuchs; kein „Wie kann ich helfen?“-Hero |
| D4 | **Research-Fehler-UX** — Timeout / Provider-Down / Empty / Junk unterscheidbar; Query in Meta klar | Nutzer erkennt Ursache; kein stummes Empty |
| D5 | **Soft-Latenz** — kürzeres `num_predict` / weniger Retries bei Smalltalk & Eggs; Task behält Budget | Smalltalk-p50 spürbar unter vorherigem Deep-Test-Niveau (Richtwert) |
| D6 | Version `0.7.3` + Eval `scripts/eval_0_7_3.py` | Suite grün; Health/UI `0.7.3` |

## Should

| ID | Inhalt |
|----|--------|
| D7 | Delight-Caps (Moments/Jokes) optional in DB (überlebt Restart am Tag) |
| D8 | Dual-Source-Synth: DE+EN nicht pauschal „widersprechen“, wenn komplementär |
| D9 | Clarify-Spacing / Typo-Guards bei Memory-Clarify |
| D10 | Scorecard/Chaos-Nachzug aus `0.7.2` |

## Won’t

- Clarify-First, `/hilfe`, Streaming-Wahrnehmung, Memory-Confirm-UI (→ Sprint 22)
- Phase 2 Handy/Auth, Tools, TTS

## Abhängigkeiten

- Sprint 20 / `0.7.2` Must grün (sonst Delight auf wackliger Reply-Basis)

## Exit / Abnahme

PO: Mood isoliert; Eggs-off klar; Research-Fehler lesbar; Smalltalk nicht ewig „tot“. Tag **`v0.7.3`**.
