# Changelog

Versionen folgen [`09-versioning.md`](./09-versioning.md).  
Sprints folgen numerischer Lieferreihenfolge ([`sprints/README.md`](./sprints/README.md)).

## Unreleased

App-Version im Code: **`1.1.0`**.

### `1.1.0` — Sound + Research-Quellen — *CODE*

- UI-Sounds: gemeinsamer AudioContext, entsperren nach Tipp; Testpiep beim Anschalten
- Quellen unter der Antwort, Links öffenbar; Audit speichert Suchen
- Reihe `1.2`–`1.5` geplant in [`17-next.md`](./17-next.md)

### Geplant — `1.2`–`1.5`

- `1.1` Sound + Research-Quellen · `1.2` Erinnerungen · `1.3` Ort/Wetter · `1.4` Kalender-GUI
- `1.5` Sprachmodus (Gespräch, Homescreen-Shortcut). Wake-Word bei ausgeschaltetem Handy: **nein**.

### `1.0.3` — Persona, Research, Notizen — *CODE*

- Jarvis beleidigt nicht mehr; keine erfundenen Internetsuchen
- Internet-Research (Opt-in) nutzt Google-Suche über Gemini; aus = ehrliche Absage
- „Notiz:“ speichert sofort; Memory-Ack ohne `name=Max`
- Chat-Avatar nutzt das Cover-Icon

### `1.0.2` — Test-Prompts zum Antippen — *CODE*

- Unter dem Chat: einzelne One-Click-Felder, jedes sendet einen Test-Prompt

### `1.0.1` — Cover & App-Icon — *CODE*

- Eigenes Jarvis-Cover (J-Monogramm, dunkel, grüne LED)
- Homescreen-Icon, rundes Icon, Splash statt Capacitor-Default
- APK weiter `Jarvis.apk`

### `1.0.0` — Jarvis 1.0 — *CODE*

- Sideload-APK heißt **`Jarvis.apk`**, Homescreen-Name Jarvis
- On-Device + optional Gemini-Kaskade + Groq-Fallback
- versionName `1.0.0` · versionCode `10000`

### `0.16.3` — Gemini-Kaskade + Groq-Fallback — *CODE*

- Bestes Free-Gemini zuerst; bei Limit/Überlastung sofort Flash-Lite, dann ältere Flash
- Optional Groq-Key: letzter Fallback mit hohem Free-Tier (kein dauerhaft keyloses LLM)
- Keine englische „high demand“-Meldung; überlastete Modelle kurz pausiert

### `0.16.2` — Gemini-Key einfügen — *CODE*

- API-Key-Feld: normale Tastatur, Einfügen möglich (kein Passwort-Feld)

### `0.16.1` — Lokalmodell nur auf Wunsch — *CODE*

- App-Start lädt die GGUF **nicht**, wenn Gemini an ist (auch nach Schließen/Öffnen)
- Lokales Modell nur über „Modell starten“, solange Gemini aus ist

### `0.16.0` — Gemini Opt-in — *CODE*

- Settings: Gemini (Google) Default aus; API-Key; Test
- Smalltalk über Gemini Flash, Memory/TV/Tools weiter lokal
- Banner: Chat geht ins Netz
- [`sprints/sprint-50.md`](./sprints/sprint-50.md) · [`16-gemini.md`](./16-gemini.md)

### `0.14.1` — TV verbinden & steuern — *CODE*

- Native Capacitor-Brücke: SSDP/Portscan, WOL, Tizen-WS 8001/8002, Token auf dem Gerät
- Settings: suchen, koppeln (Haken am TV), testen, Name/Host/MAC/Port, Kill-Switch
- Chat: „Fernseher an/aus“, lauter/leiser/stumm, HDMI; Follow-up nur nach TV-Turn
- Kein Fake-Erfolg ohne Plugin-Ergebnis; Gastnetz-Hinweis
- [`sprints/sprint-48.md`](./sprints/sprint-48.md)

### `0.14.0` — Qualität & Latenz — *CODE* (in `0.14.1`)

- Erstes Token: Warmstart, `cache_prompt`, kürzeres Sampling
- Memory/Tools/TV vor dem LLM; Alltagssprache; ehrliches Nichtwissen
- Kein „Ollama: online“; Status on-device; Siezen/Fake-Claims härter
- [`sprints/sprint-47.md`](./sprints/sprint-47.md) · [`14-quality-tv.md`](./14-quality-tv.md)

### `0.13.2` — Chat-Hang Hotfix — *CODE*

- Streaming statt Non-Stream: Tokens sichtbar, kein endloses „schreibt…“
- Mehr CPU-Threads, kleineres `n_ctx`, kürzeres Persona (0.5B auf dem Handy)
- Abbruch nach 45s ohne erstes Token; Status zeigt Wartezeit
- [`sprints/sprint-46.md`](./sprints/sprint-46.md)

### `0.13.1` — Modell-Download Hotfix — *CODE*

- First-Run lädt die GGUF direkt (OPFS/IndexedDB), nicht über wllama-OPFS-Metadaten
- App-Neustart startet das gespeicherte Modell, ohne erneut ~470 MB zu laden
- Chat: Qwen-Template, Timeout, kein endloses „schreibt…“
- CapacitorHttp umgeht WebView-CORS; lokales wllama-compat-WASM (kein jsDelivr)
- Fehlertext auf Deutsch im First-Run-Overlay
- [`sprints/sprint-45.md`](./sprints/sprint-45.md)

### `0.13.0` — Sprint 44 (On-Device) — *CODE*

- TypeScript-Engine + IndexedDB + wllama (Qwen2.5 0.5B Q4)
- First-Run: Modell-Download aufs Gerät
- Entfernt: Python-Backend, Ollama, NAS/Docker/Autostart
- TV geparkt
- [`sprints/sprint-44.md`](./sprints/sprint-44.md) · [`13-on-device.md`](./13-on-device.md)

### `0.12.0` — Sprint 43 (NAS-Proxy) — *SUPERSEDED*

### `0.11.2` — Sprint 42 (Samsung TV Settings-UI) — *CODE*

- Suchen, koppeln, testen, umbenennen
- [`sprints/sprint-42.md`](./sprints/sprint-42.md)

### `0.11.1` — Sprint 41 (Samsung TV Hotfix) — *PLANNED*

- WOL-Timing, False-Claims, Follow-up-Phrasen
- [`sprints/sprint-41.md`](./sprints/sprint-41.md)

### `0.11.0` — Sprint 40 (Samsung TV Core) — *PLANNED*

- Tizen lokal: Ein/Aus (WOL), Vol, Mute, HDMI; kein Confirm; ein Gerät
- [`sprints/sprint-40.md`](./sprints/sprint-40.md)

### `0.10.5` — Sprint 39 (APK Polish) — *PLANNED*

- First-Run, Icon, Sideload-README; Abschluss `0.10`
- [`sprints/sprint-39.md`](./sprints/sprint-39.md)

### `0.10.4` — Sprint 38 (APK Hotfix) — *PLANNED*

- Tastatur, Reconnect, ehrliche URL/401-Fehler
- [`sprints/sprint-38.md`](./sprints/sprint-38.md)

### `0.10.3` — Sprint 37 (APK Core) — *PLANNED*

- Capacitor-Android Sideload gegen NAS (URL + Token)
- [`sprints/sprint-37.md`](./sprints/sprint-37.md)

### `0.10.2` — Sprint 36 (NAS Auth & LAN) — *PLANNED*

- Owner-Token, 401 ohne Header, LAN-Default
- [`sprints/sprint-36.md`](./sprints/sprint-36.md)

### `0.10.1` — Sprint 35 (NAS Hotfix) — *PLANNED*

- Backup/Restore, Volume-Rechte, ehrliche Startfehler
- [`sprints/sprint-35.md`](./sprints/sprint-35.md)

### `0.10.0` — Sprint 34 (NAS Core) — *PLANNED*

- Docker Compose: backend + frontend + ollama, Autostart, Volumes
- [`sprints/sprint-34.md`](./sprints/sprint-34.md) · [`12-nas-apk.md`](./12-nas-apk.md)

### `0.9.5` — Sprint 33 (Tools Hygiene & Confirm-UX) — *PLANNED*

- Listen-Scope, UI Ja/Nein-Confirm, Aufräumen
- [`sprints/sprint-33.md`](./sprints/sprint-33.md)

### `0.9.4` — Sprint 32 (Assist Continuity & Siezen) — *PLANNED*

- Clarify→Plan hart; Residual-Siezen; EN-Leak Guard
- [`sprints/sprint-32.md`](./sprints/sprint-32.md)

### `0.9.3` — Sprint 31 (Memory Quality Hotfix) — *PLANNED*

- Multi-Fact Write; Pref-Recall-Routing; Honesty statt Halluzination
- [`sprints/sprint-31.md`](./sprints/sprint-31.md)

### `0.9.2` — Sprint 30 (Tools Polish & Continuity) — *READY FOR REVIEW*

- Multi-Turn: Liste → „Erledige das erste / Nr. 2“ ohne neue Confirm
- Listen-UX: offen/erledigt/alle + Todos-Suche; nummerierte Replies
- Scorecard `scripts/scorecard_0_9_2.py`; UI Tool-Status-Chips; Eval `eval_0_9_2`
- Version `0.9.2` · [`sprints/sprint-30.md`](./sprints/sprint-30.md)

### `0.9.1` — Sprint 29 (Tools Hotfix) — *READY FOR REVIEW*

- False-Confirm-Guard; Inject blockt Tool-Pending; Pending-Timeout; Todo-Dedup
- Kurz-Acks (`SAFE_ACK`); Platzhalter-Scrub; Imperativ-Duzen; klarere Tool-Fehler
- Eval `scripts/eval_0_9_1.py`, Deep `scripts/deep_0_9_1.py`, Version `0.9.1`
- [`sprints/sprint-29.md`](./sprints/sprint-29.md)

### `0.9.0` — Sprint 28 (Local Tools Core) — *READY FOR REVIEW* (liefert auch 0.8.5)

- Tool-Runtime: Allowlist, Confirm-before-Write, Audit
- Tools `notes` + `todo` (lokal SQLite); Router-Intent `tool`; `/hilfe` aktualisiert
- Eval `scripts/eval_0_9_0.py`, Deep `scripts/deep_0_9_0.py`, Version `0.9.0`
- [`sprints/sprint-28.md`](./sprints/sprint-28.md)

### `0.8.5` — Sprint 27 (Persona & Continuity Hotfix) — *READY FOR REVIEW* (mitgeliefert in `0.9.0`)

- Master/Sir-Scrub; Residual-Duzen v3; Clarify→Plan Continuity; Eval-Pins
- Eval `scripts/eval_0_8_5.py`
- [`sprints/sprint-27.md`](./sprints/sprint-27.md)

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
| `0.10.0`–`0.10.5` | 34–39 | NAS-Compose — **Parking** (Docker geht nicht) |
| `0.11.0`–`0.11.2` | 40–42 | Samsung-TV lokal |
| `0.12.0` | 43 | NAS native + Reverse-Proxy :8080 + Sideload-APK |
| `1.0.0` | PO | nächster MAJOR (nicht NAS) |

## Earlier (pending tags)

- `0.2.2` Charakter-Fixes · `0.2.1` Guard Hardening · `0.2.0` Streaming/Guards
- `0.1.1` Must-Fixes · `0.1.0` MVP Local Smalltalk
