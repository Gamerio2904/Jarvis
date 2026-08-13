# Changelog

Versionen folgen [`09-versioning.md`](./09-versioning.md).  
Sprints folgen numerischer Lieferreihenfolge ([`sprints/README.md`](./sprints/README.md)).

## Unreleased

### Geplant — `0.8.5` / Sprint 27 (Persona & Continuity Hotfix)

- Master-Scrub; Residual-Duzen v3; Clarify→Plan-Continuity; Eval-Pins
- [`sprints/sprint-27.md`](./sprints/sprint-27.md)

### Geplant — `0.9.0`–`0.9.2` / Sprints 28–30 (Local Tools — Option A)

- `0.9.0` Tool-Runtime + Notes/Todos + Confirm
- `0.9.1` Hotfix (False-Confirm, Memory↔Tool)
- `0.9.2` Polish (Continuity, Listen-UX, Scorecard)
- [`sprints/sprint-28.md`](./sprints/sprint-28.md) · [`29`](./sprints/sprint-29.md) · [`30`](./sprints/sprint-30.md)

### `0.8.4` — Sprint 26 (Siezen & Recall Hotfix) — *READY FOR REVIEW*

- Broken-Siezen Heuristik + `soften_duzen` Verb-Nachzug; Identitäts-Recall ein Name; CJK-Task ≠ Smalltalk-Canned
- Recall-Ack wenn Soften scheitert; Kumpel-Scrub; Eval-Pins `0.8.x`
- Eval `scripts/eval_0_8_4.py`, Deep `scripts/deep_0_8_4.py`, Version `0.8.4`
- Deep-Test durch — Restpunkte → Sprint 27 / `0.8.5`; Tools → `0.9.0`
- [`sprints/sprint-26.md`](./sprints/sprint-26.md)

### `0.8.3` — Sprint 25 (Assist Ops & Carry-over) — *READY FOR REVIEW* (liefert auch 0.8.1 + 0.8.2)

- Scorecard Assist; Mood/Delight-Caps in DB; Audit-Link in Quellen-UI; Latency-Hinweis Settings
- Eval `scripts/eval_0_8_3.py`, Scorecard `scripts/scorecard_0_8_3.py`, Version `0.8.3`
- Deep-Test durch — Restpunkte → Sprint 26 / `0.8.4`

### `0.8.2` — Sprint 24 (Edge & Reply Polish) — *READY FOR REVIEW* (mitgeliefert in `0.8.3`)

- Capabilities-Kurzformen; Begrüßungs-Canned; Forget-/Soft-Reject-Acks; Residual-Duzen-Retry
- Eval `scripts/eval_0_8_2.py`

### `0.8.1` — Sprint 23 (Assist Hotfix) — *READY FOR REVIEW* (mitgeliefert in `0.8.3`)

- `normalize_value` Wortgrenzen; Soft-Confirm Value-Gate; `soften_duzen` entschärfen; Garbage-Soft-Memory
- Eval `scripts/eval_0_8_1.py`

### `0.8.0` — Sprint 22 (Assist Clarity) — *READY FOR REVIEW* (liefert auch 0.7.2 + 0.7.3)

- Clarify-First bei vagen Tasks; `/hilfe` Fähigkeiten-Karte; Streaming-Status „Jarvis schreibt…“
- Research-UI-Echo (`status_label` / Query); Memory Soft-Confirm nach Soft-Harvest
- Eval `scripts/eval_0_8_0.py`, Version `0.8.0`
- Deep-Test durch — offene Punkte → Sprints 23–25

### `0.7.3` — Sprint 21 (Delight & Session Polish) — *READY FOR REVIEW* (mitgeliefert in `0.8.0`)

- Mood pro Conversation; Eggs-off deterministisch; Research-Fehler-UX; Soft-Latenz Smalltalk
- Eval `scripts/eval_0_7_3.py`

### `0.7.2` — Sprint 20 (Reply Quality Polish) — *READY FOR REVIEW* (mitgeliefert in `0.8.0`)

- SAFE_SMALLTALK drosseln / Duzen weicher; Memory-Recall ohne Helpdesk-Canned; CJK→Task-Fallback
- Capabilities-Fakt; Soft-Inject-Härte
- Eval `scripts/eval_0_7_2.py`

### `0.7.1` — Sprint 19 (Quality Hotfix) — *READY FOR REVIEW*

- Settings-Clamp (`research_timeout_sec` u. a.); Guard-Entschärfung; Task-Listen bleiben Inhalt
- Settings-Fakten (Modell/Version/Research); Research Junk-Refuse + Negation
- Inject-Härte (Pirate/System-Prompt); Anti-Identitäts-Halluzination
- Eval `scripts/eval_0_7_1.py`, Version `0.7.1`

### `0.7.0` — Sprint 18 (Delight + Settings) — *READY FOR REVIEW*

- Flaches Settings-Panel (Allgemein, Modell, Delight, Sound, Easter Eggs, Forschung, Danger)
- Jarvis-Momente (Cap/Tag), Inside Jokes (Toggle/Frequenz, Kategorie `joke`)
- UI-Sounds (Default aus), Easter-Egg-Commands gelistet (`/protokoll`, `/mission`, …)
- Eval `scripts/eval_0_7_0.py`, Version `0.7.0` (inkl. 0.6.1/0.6.2)

### `0.6.2` — Sprint 17 (Research Polish) — *READY FOR REVIEW* (mitgeliefert in `0.7.0`)

- Research-Persona-Synthese; Dual-Provider-Interleave; DDG-Thin-Filter
- Scorecard `scripts/scorecard_0_6_2.py`; Eval `scripts/eval_0_6_2.py`

### `0.6.1` — Sprint 16 (Research Hotfix) — *READY FOR REVIEW* (mitgeliefert in `0.7.0`)

- Query-PII-Sanitizer; Noise-Strip; Topic-Extraktion; Settings-Default-Hygiene
- Eval `scripts/eval_0_6_1.py`

### `0.6.0` — Sprint 15 (Internet-Research) — *READY FOR REVIEW*

- Opt-in Toggle (`research_opt_in`, Settings API + UI), Default aus
- Retrieval: Wikipedia + DuckDuckGo Allowlist; Mock-Provider für Eval
- Citation-Synthese / No-source-Refuse; Quellen-Badge + Audit-Log
- Eval `scripts/eval_0_6_0.py`, Version `0.6.0`

### `0.5.2` — Sprint 14 (Router Polish) — *READY FOR REVIEW*

- Router-Patterns (`mach mir einen Plan`, Capability-Bait); Extra-Gold ≥5
- Health: `heavy_equals_default` + Warning bei Heavy=Default
- Live-Scorecard `scripts/scorecard_0_5_2.py` (Inject-EN, Task-FP, Recall, Weak-Write)
- Persona: EN-Leak-Retry, Clarify-Emoji-Strip, Recall ohne Helpdesk-Tail
- Eval `scripts/eval_0_5_2.py`, Version `0.5.2` (inkl. Sprint-13-Hotfix)

### `0.5.1` — Sprint 13 (Router Hotfix) — *READY FOR REVIEW* (mitgeliefert in `0.5.2`)

- Inject/Task entkoppelt; Inject → `SAFE_INJECT` (kein EN-Helpdesk)
- Weak-Write Guardrail; Non-Memory-Fallbacks ohne Aussetzer
- Eval `scripts/eval_0_5_1.py` (akzeptiert Health `0.5.1`/`0.5.2`)

### `0.5.0` — Sprint 12 (Intent-Router + Scores)

- Intent-Router v1 inkl. Memory-Subklassen write/recall/forget/clarify
- Policy-Map, Model-Routing (`routing_mode`), Research ohne Opt-in blockiert
- Scorecard + Baseline-Gate (`scripts/scorecard_0_5_0.py`)
- Eval `scripts/eval_0_5_0.py`, Version `0.5.0`

### `0.4.3` — Sprint 11 (Memory Hotfix)

- Clause-Split: Beruf/Fakt-Values enden vor `und`/`oder`
- Recall-Op bei Token-Hit: Nudge + Fakt-Fallback statt Aussetzer
- Pref ohne Pflicht-„mein“ (`Speichere: Lieblingsfarbe ist Grün`)
- Shared `parse_lieblings_pref`; Eval `scripts/eval_0_4_3.py`, Version `0.4.3`

### `0.4.2` — Sprint 10 (Memory Polish)

- Multi-Fakt-Split, Value-Normalisierung, Widerspruch „nicht X, sondern Y“
- Soft-Harvest mit niedriger Confidence + TTL (`expires_at`)
- Retrieve ohne Ambient-Leak; `max_context_messages` als Cap
- Summary nach Assistant-Write + DE-only Guard
- UI: Kategorie-Filter + „unsicher“-Badge
- Eval `scripts/eval_0_4_2.py`, Version `0.4.2`

### `0.4.1` — Sprint 9 (Memory Must-Fixes)

- False-Confirm: natürliche Merk-Phrasen speichern; sonst klare Ablehnung
- Memory-Turns: kein Helpdesk-/Aussetzer-Fallback (`SAFE_MEMORY_ACK`)
- „Vergiss alles“ = Full Wipe
- Eval `scripts/eval_0_4_1.py`, Version `0.4.1`

### `0.4.0` — Sprint 8 (Gedächtnis & Kontext)

- Langzeitgedächtnis v1 (`memory_items`, merk/vergiss, soft Lieblings-Harvest)
- Gesprächszusammenfassung + Kontextpack (persona + memory + summary + last_k)
- APIs `GET/POST/DELETE /api/memory`, Health `memory_count`
- UI „Was Jarvis über mich weiß“
- Eval `scripts/eval_0_4_0.py`

### `0.3.1` — Sprint 7 (GUI Polish)

- Ambient-Gradient, Composer-Focus, Mobile-Backdrop, Chat-Wechsel, Stream-Caret, Empty-State

### `0.3.0` — Sprint 6 (GUI Premium-Motion)

- Message-Enter, Streaming-Caret, Composer-Focus, Sidebar/Drawer
- `prefers-reduced-motion`, Ambient-Gradient, Typografie Outfit/Manrope

## Planned

| Version | Sprint | Inhalt |
|---------|--------|--------|
| `1.0.0` | Phase 3 | NAS / 24/7 |

## Earlier (pending tags)

- `0.2.2` Charakter-Fixes · `0.2.1` Guard Hardening · `0.2.0` Streaming/Guards
- `0.1.1` Must-Fixes · `0.1.0` MVP Local Smalltalk
