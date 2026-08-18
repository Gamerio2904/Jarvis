# 06 — MVP & Sprint-Plan

> Historisch (MVP `0.1`). **Jetzt:** Sideload `1.40.2`, Qualitäts-Serie [`28-next.md`](./28-next.md), Sprints [`sprints/README.md`](./sprints/README.md).

## MVP v0.1 — Definition

**Name:** Local Smalltalk Jarvis  
**Phase:** 1 (mit Phase-0-Persona als Eingang)

### In Scope

- Lokales LLM über **Ollama** (kein Cloud-Denken)
- Backend mit Jarvis-Persona + Gesprächskontext (letzte N Turns)
- **Persistente** Chats; Zielrichtung **mehrere Chats + Liste + Neues Gespräch** (MVP darf schlank/bedingt sein, aber ausbaufähig)
- Web-Chat-UI: **Spotify dunkel** + **ChatGPT-artiges Layout**; Motion **light**
- Smalltalk-**Qualität** als Abnahmekriterium
- **Lebendige**, variable Antworten (kein Template-Bot) — Stil laut `07`

### Out of Scope (MVP)

- Native App, NAS 24/7, TTS
- Volles Langzeitgedächtnis / „erinnert sich an alles“
- Premium-Motion-Pack (kommt als späteres **GUI-Update**-Sprint)
- Chat-Löschen (zurückgestellt)
- Phase-2+-Netz/VPN/Auth-Feinschliff
- At-rest-Encryption

### MVP-Erfolg (Abnahme)

Du schreibst z.B. „Hey, wie geht’s?“ und die Antwort ist:

1. lokal erzeugt,
2. kurz und messenger-artig,
3. charakterfest nach `07-persona.md`,
4. nicht generisch-ChatGPT-haft,
5. **nicht** immer gleich / templatehaft (Variation spürbar).

**Misserfolg früh erkennen**

| Symptom | Typische Reaktion |
|---------|-------------------|
| Steife/templatehafte Antworten | Persona schärfen; Sampling/Prompt; **Anti-Template** durchsetzen; ggf. Modellwechsel |
| Zu langsam | erst Qualität halten; später quantisieren/kleineres Modell (PO: Speed nachrangig) |
| Kontextvergesslichkeit | Kurzgedächtnis N erhöhen / Prompt-Struktur fixen |

---

## Sprint 0 — Planning & Spikes — **DONE**

**Status:** Abgeschlossen (2026-08-11)  
**Sprint-Ziel:** Planung steht; Blocker für Sprint 1 sind so weit geklärt, dass Bau starten kann.  
**Artefakt:** [`sprints/sprint-00.md`](./sprints/sprint-00.md)

| Item | Status | Done wenn / Ist |
|------|--------|-----------------|
| Planungsdokumente | **Done** | `docs/01`–`09` + Changelog, Index verlinkt |
| Offene Fragen / Workshop | **Done** | Keine offenen P0; Rest zurückgestellt (`08`) |
| Persona-Kern + Stil-Anker | **Done** | `07` inkl. Anti-Template / Variation |
| Hardware-Kurzcheck | **Done** | Windows, 16 GB, RTX 3060; VRAM-Standard ~12 GB |
| Stack-Richtung | **Done** | Ollama, ausgewogenes Modell, Web-only, Backend pragmatisch |
| UI-Anspruch | **Done** | Spotify dunkel + ChatGPT-Layout; Motion light → späteres GUI-Update |
| Versionierung | **Done** | `0.1.0`=MVP; `0.10.x`=NAS+APK; `1.0.0`≠NAS (`09`) |

**Increment Sprint 0:** Entscheidbare Planung; Sprint 1 freigegeben.

**Retro (3 Bullets)** — siehe `sprints/sprint-00.md`.

---

## Sprint 1 — Local Smalltalk MVP — **READY FOR REVIEW**

**Status:** Umsetzung fertig — wartet auf PO-Abnahme  
**Ziel-Version:** `0.1.0`  
**Artefakt:** [`sprints/sprint-01.md`](./sprints/sprint-01.md)  
**Sprint-Ziel:**  
„Ich kann im Browser lokal mit Jarvis smalltalken — Persona an, Gesprächskontext an, Chats speicherbar, Web-UI in Spotify-Dunkel/ChatGPT-Richtung (Motion light), Antworten lebendig/variabel.“

### Geplanter Scope (Must)

| Story | Inhalt |
|-------|--------|
| S1.1 | Lokaler Modell-Host läuft |
| S1.2 | Modell gewählt & grob ok |
| S2.1 | Chat Request/Response |
| S2.2 | Persona aktiv |
| S2.3 | Kurzgedächtnis |
| S3.1 | Browser-Chat-UI |

### Should (wenn Zeit)

- S2.4 Persona per Config-Datei
- S3.2 Mobile Viewport brauchbar
- S1.3 Fehler, wenn Modell down

### Could

- S3.3 Typing/Loading-Indikator

### Sprint-1-Exit

PO-Review: 10-Minuten-Smalltalk-Abnahme bestanden oder konkrete Nachbesserungs-Stories erzeugt.

---

## Sprint 2 — MVP Must-Fixes → **`0.1.1`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-02.md`](./sprints/sprint-02.md)

**Ziel:** Charakter/Injection/Modell so fixen, dass der MVP abnahmetauglich ist.

| Must | Inhalt |
|------|--------|
| F1 | Modell-Default 7b für RTX 3060 |
| F2 | Persona-Prompt härten |
| F3 | Output-Guard gegen klare Injects |
| F4 | Sampling gegen Kollaps |
| F5 | Regression-Smoke |

---

## Sprint 3 — Verbesserungen → **`0.2.0`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-03.md`](./sprints/sprint-03.md)

**Ziel:** Robustheit & Komfort + Restlücken aus `0.1.1` (OWNED-Inject, degenerierte Antworten, Duzen/Boilerplate, Fallback-UX, Eval).

| Block | Inhalt |
|-------|--------|
| Restfixes R1–R8 | OWNED-Guard, Degenerate/Sticky, Duzen/Boilerplate/KI-Frage, Sprache, Fallback-Warnung |
| I1–I6 | UI-Fehler/Retry, Streaming, härtere Injection, Eval-Suite, Chat löschen, Sampling/UX |

---

## Sprint 4 — Guard Hardening → **`0.2.1`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-04.md`](./sprints/sprint-04.md)

**Ziel:** Must-Fixes aus dem Deep-Test nach `0.2.0` — Guards halten auch bei Listen/Roleplay, Duzen-Flexionen, Mid-Reply-Inject und Sticky-in-Long-Reply; Eval auf 7b.

| Must | Inhalt |
|------|--------|
| H1 | Anti-Listen / Anti-Roleplay-Coach |
| H2 | Duzen-Guard v2 (Flexionen) |
| H3 | Whole-Reply Inject-Scan |
| H4 | Sticky-Phrase v2 |
| H5 | Eval erweitern + Abnahme auf 7b |

---

## Sprint 5 — Charakter-Feinschliff → **`0.2.2`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-05.md`](./sprints/sprint-05.md)

**Ziel:** Die 2 FIX-Fälle aus dem `0.2.1`-Deep-Test — kein Helpdesk-Boilerplate, Kaputt-Smalltalk jarvis-treu statt Canned-Aussetzer.

| Must | Inhalt |
|------|--------|
| C1 | Boilerplate hard-refuse nach Retries |
| C2 | Kaputt-Pfad jarvis-treu (kein unnötiger Canned) |

---

## Sprint 6 — GUI Update Premium-Motion → **`0.3.0`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-06.md`](./sprints/sprint-06.md)

**Ziel:** Bestehende Chat-UI spürbar premium machen — gezielte Motion, smoother Composer/Sidebar/Streaming; Layout & Charakter bleiben.

| Must | Inhalt |
|------|--------|
| M1–M4 | Message-Enter, Streaming-Präsenz, Composer-Focus, Sidebar-Motion |
| M5 | `prefers-reduced-motion` |
| M6 | Version `0.3.0` |

**Danach:** Polish `0.3.1` → Gedächtnis `0.4.0`

---

## Sprint 7 — GUI Polish → **`0.3.1`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-07.md`](./sprints/sprint-07.md)

| Must | Inhalt |
|------|--------|
| P1–P3 | Gradient / Composer-Focus / Backdrop stärker |
| P4–P5 | Ruhiger Chat-Wechsel, stabiler Stream-Caret |
| P6 | Version `0.3.1` |

**Danach:** Gedächtnis `0.4.0` → … → Router `0.5.0` → Hotfix `0.5.1` → Polish `0.5.2` → Research `0.6.0` → Hotfix `0.6.1` → Polish `0.6.2`

---

## Sprint 8 — Gedächtnis & Kontext → **`0.4.0`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-08.md`](./sprints/sprint-08.md) · Details: [`10-intelligence-capabilities.md`](./10-intelligence-capabilities.md)

| Must | Inhalt |
|------|--------|
| G1–G3 | Summary, Kontextkompression, Langzeitgedächtnis v1 |
| G4–G6 | Prompt-Pipeline, Eval `eval_0_4_0.py`, Version `0.4.0` |
| G7–G8 | UI „Über mich“, Summary nach N Turns |

---

## Sprint 9 — Memory Must-Fixes → **`0.4.1`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-09.md`](./sprints/sprint-09.md)

| Must | Inhalt |
|------|--------|
| M1–M3 | False-Confirm, Guard/Aussetzer bei Memory, „Vergiss alles“ |
| M4–M5 | Eval `eval_0_4_1.py`, Version `0.4.1` |

---

## Sprint 10 — Memory Polish → **`0.4.2`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-10.md`](./sprints/sprint-10.md)

| Must | Inhalt |
|------|--------|
| P1–P3 | Natürliche Phrasen, Multi-Fakt-Split, Values + Widerspruchs-Heuristik v1 |
| P4–P6 | Retrieve, Summary-Timing/DE, Settings |
| P7–P8 | Soft-Harvest TTL/Confidence, UI-Kategorie-Filter |
| P9 | Eval + Version `0.4.2` |

---

## Sprint 11 — Memory Hotfix → **`0.4.3`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-11.md`](./sprints/sprint-11.md)

| Must | Inhalt |
|------|--------|
| H1 | Clause-Split: Beruf/Fakt-Values ohne Nachsatz |
| H2 | Recall ohne finales Aussetzer-Canned |
| H3 | Pref ohne Pflicht-„mein“ (`Speichere: Lieblings…`) |
| H4 | Eval + Version `0.4.3` |

---

## Sprint 12 — Intent-Router, Model-Routing & Scores → **`0.5.0`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-12.md`](./sprints/sprint-12.md) · [`10`](./10-intelligence-capabilities.md)

| Must | Inhalt |
|------|--------|
| I1–I2 | Intent-Router + Policy-Map; **merk/recall/forget** getrennt; kein Helpdesk-Fallback |
| I1d | Contradiction-Handling (`clarify`): ersetzen + nachfragen |
| I3 | Model-Routing (auto/default/heavy) |
| I4–I5 | Persona-/Quality-Scores + Baseline-Gate |
| I6 | Version `0.5.0` |

---

## Sprint 13 — Router Hotfix → **`0.5.1`** *(prio)*

**Status:** READY FOR REVIEW (mitgeliefert in `0.5.2`)  
**Artefakt:** [`sprints/sprint-13.md`](./sprints/sprint-13.md)

| Must | Inhalt |
|------|--------|
| F1–F2 | Inject/Task entkoppeln; Inject nur Jarvis-DE |
| F3 | Weak-Write Guardrail |
| F4 | Non-Memory-Fallbacks ohne Aussetzer |
| F5 | Eval + Version `0.5.1` |

---

## Sprint 14 — Router Polish → **`0.5.2`** *(Should)*

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-14.md`](./sprints/sprint-14.md)

| Should | Inhalt |
|--------|--------|
| S1–S2 | Router-Patterns; Routing-Ehrlichkeit |
| S3–S4 | Live-Scorecard; Persona-Kleinkram |
| S5 | Eval + Version `0.5.2` |

---

## Sprint 15 — Verlässliche Internet-Research → **`0.6.0`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-15.md`](./sprints/sprint-15.md) · [`10`](./10-intelligence-capabilities.md)

| Must | Inhalt |
|------|--------|
| R1–R4 | Opt-in, Retrieval, Citations, No-source-Refuse |
| R5–R7 | Quellen-UI, Audit-Log, Eval + Version |

---

## Sprint 16 — Research Hotfix → **`0.6.1`** *(prio)*

**Status:** READY FOR REVIEW (mitgeliefert in `0.7.0`)  
**Artefakt:** [`sprints/sprint-16.md`](./sprints/sprint-16.md)

| Must | Inhalt |
|------|--------|
| H1–H3 | Query-PII-Sanitizer, Noise-Strip, Topic-Extraktion |
| H4 | Settings-Default-Hygiene |
| H5 | Eval + Version `0.6.1` |

---

## Sprint 17 — Research Polish → **`0.6.2`** *(Should)*

**Status:** READY FOR REVIEW (mitgeliefert in `0.7.0`)  
**Artefakt:** [`sprints/sprint-17.md`](./sprints/sprint-17.md)

| Should | Inhalt |
|--------|--------|
| P1–P3 | Research-Persona; Dual-Provider/DDG-Qualität |
| P4–P5 | Deep-Scorecard; Eval + Version `0.6.2` |

---

## Sprint 18 — Delight & Settings → **`0.7.0`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-18.md`](./sprints/sprint-18.md) · [`11`](./11-delight-and-settings.md)

| Must | Inhalt |
|------|--------|
| D1 | Flaches Settings-Panel |
| D2–D5 | Momente, Jokes, Sound, Easter Eggs (Liste in Settings) |
| D6 | Version `0.7.0` |

---

## Sprint 19 — Quality Hotfix → **`0.7.1`** *(prio)*

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-19.md`](./sprints/sprint-19.md)  
**Quelle:** Deep-Test nach `0.7.0`

| Must | Inhalt |
|------|--------|
| Q1 | Settings-Clamp (`research_timeout_sec` u. a.) |
| Q2–Q3 | Guard-Entschärfung; Tasks liefern Inhalt statt nur SAFE_TASK |
| Q4 | Settings-Fakten (Modell/Version/Research/Fähigkeiten) |
| Q5–Q6 | Research Junk-Refuse + Negation („recherchiere nichts“) |
| Q7–Q8 | Inject-Härte; Anti-Identitäts-Halluzination |
| Q9 | Eval + Version `0.7.1` |

---

## Sprint 20 — Reply Quality Polish → **`0.7.2`** *(prio)*

**Status:** READY FOR REVIEW (mitgeliefert in `0.8.0`)  
**Artefakt:** [`sprints/sprint-20.md`](./sprints/sprint-20.md)  
**Quelle:** Deep-Test nach `0.7.1`

| Must | Inhalt |
|------|--------|
| R1 | SAFE_SMALLTALK drosseln — harmlose Prompts wirklich beantworten |
| R2 | Memory-Recall ohne Helpdesk/Smalltalk-Canned |
| R3–R4 | CJK/Non-DE auf Task; Duzen weicher |
| R5 | Multi-Turn nicht durch Canned zerstören |
| R6 | Capabilities-Fakt deterministisch |
| R7 | Eval + Version `0.7.2` |

---

## Sprint 21 — Delight & Session Polish → **`0.7.3`**

**Status:** READY FOR REVIEW (mitgeliefert in `0.8.0`)  
**Artefakt:** [`sprints/sprint-21.md`](./sprints/sprint-21.md)

| Must | Inhalt |
|------|--------|
| D1–D2 | Mood pro Conversation; Eggs-off Fallback |
| D3–D5 | Persona; Research-Fehler-UX; Soft-Latenz |
| D6 | Eval + Version `0.7.3` |

---

## Sprint 22 — Assist Clarity → **`0.8.0`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-22.md`](./sprints/sprint-22.md)

| Must | Inhalt |
|------|--------|
| A1 | Clarify-First bei vagen Tasks |
| A2 | Fähigkeiten-Karte `/hilfe` |
| A3 | Streaming-Wahrnehmung |
| A4–A5 | Research-UI-Echo; Memory Soft-Confirm |
| A6 | Eval + Version `0.8.0` |

**Deep-Test:** durch — kritische Findings → Sprint 23 / `0.8.1`.

---

## Sprint 23 — Assist Hotfix → **`0.8.1`** *(prio)*

**Status:** READY FOR REVIEW (mitgeliefert in `0.8.3`)  
**Artefakt:** [`sprints/sprint-23.md`](./sprints/sprint-23.md)  
**Quelle:** Deep-Test nach `0.8.0`

| Must | Inhalt |
|------|--------|
| H1–H2 | `normalize_value` Wortgrenzen; Soft-Confirm Value-Gate |
| H3–H4 | `soften_duzen` entschärfen; Garbage-Soft-Memory stoppen |
| H5 | Eval + Version `0.8.1` |

---

## Sprint 24 — Edge & Reply Polish → **`0.8.2`**

**Status:** READY FOR REVIEW (mitgeliefert in `0.8.3`)  
**Artefakt:** [`sprints/sprint-24.md`](./sprints/sprint-24.md)

| Must | Inhalt |
|------|--------|
| E1–E2 | Capabilities-Kurzformen; Begrüßungs-Canned drosseln |
| E3–E5 | Forget-Ack; Residual-Duzen; Soft-Reject UX |
| E6 | Eval + Version `0.8.2` |

---

## Sprint 25 — Assist Ops & Carry-over → **`0.8.3`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-25.md`](./sprints/sprint-25.md)

| Must | Inhalt |
|------|--------|
| O1–O2 | Scorecard Assist; Delight-Persist pro Conversation |
| O3–O4 | Audit-Link UI; Latency-Hinweis Settings |
| O5 | Eval + Version `0.8.3` |

**Deep-Test:** durch — Restpunkte (Siezen/Recall/CJK) → Sprint 26 / `0.8.4`.

---

## Sprint 26 — Siezen & Recall Hotfix → **`0.8.4`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-26.md`](./sprints/sprint-26.md)  
**Quelle:** Deep-Test nach `0.8.3`

| Must | Inhalt |
|------|--------|
| P1–P2 | Broken-Siezen Heuristik + `soften_duzen` Verb-Nachzug |
| P3–P4 | Identitäts-Recall ein Name; CJK-Task ≠ Smalltalk-Canned |
| P5 | Eval + Version `0.8.4` |

**Deep-Test:** durch — Restpunkte → Sprint 27 / `0.8.5`; Option A Tools → `0.9.0+`.

---

## Sprint 27 — Persona & Continuity Hotfix → **`0.8.5`**

**Status:** READY FOR REVIEW (mitgeliefert in `0.9.0`)  
**Artefakt:** [`sprints/sprint-27.md`](./sprints/sprint-27.md)  
**Quelle:** Deep-Test nach `0.8.4` (`/tmp/deep_084.log`)

| Must | Inhalt |
|------|--------|
| F1–F2 | Master-Scrub + Residual-Duzen v3 |
| F3 | Clarify→Plan Continuity |
| F5 | Eval + Version `0.8.5` |

---

## Sprint 28 — Local Tools Core → **`0.9.0`** *(Option A)*

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-28.md`](./sprints/sprint-28.md)

| Must | Inhalt |
|------|--------|
| T1–T3 | Tool-Runtime + Notes + Todos (lokal, Confirm) |
| T4–T5 | Router/`/hilfe` |
| T6 | Eval + Version `0.9.0` |

---

## Sprint 29 — Tools Hotfix → **`0.9.1`**

**Status:** READY FOR REVIEW  
**Artefakt:** [`sprints/sprint-29.md`](./sprints/sprint-29.md)

False-Confirm-Guard, Memory↔Tool, Inject+Tool, Todo-Dedup, Kurz-Acks, Eval.

---

## Sprint 30 — Tools Polish & Continuity → **`0.9.2`**

**Status:** READY FOR REVIEW · [`sprints/sprint-30.md`](./sprints/sprint-30.md)  
Multi-Turn Tool-Flows, Listen-UX, Scorecard, UI-Chips.

---

## Sprint 31 — Memory Quality Hotfix → **`0.9.3`**

**Status:** PLANNED · [`sprints/sprint-31.md`](./sprints/sprint-31.md)  
Multi-Fact Write, Pref-Recall-Routing, Honesty.

---

## Sprint 32 — Assist Continuity & Siezen → **`0.9.4`**

**Status:** PLANNED · [`sprints/sprint-32.md`](./sprints/sprint-32.md)  
Clarify→Plan, Residual-Siezen, EN-Leak.

---

## Sprint 33 — Tools Hygiene & Confirm-UX → **`0.9.5`**

**Status:** PLANNED · [`sprints/sprint-33.md`](./sprints/sprint-33.md)  
Listen-Scope, UI-Confirm, Aufräumen.

---

## Weitere geplante Sprints (Richtung)

| Sprint | Zielrichtung | Version |
|--------|--------------|---------|
| 34–39 | NAS 24/7 Compose | **`0.10.0`–`0.10.5`** — **Parking** |
| 40–42 | Samsung-TV lokal (Tizen) | **`0.11.0`–`0.11.2`** |
| 43 | NAS native + Reverse-Proxy + Sideload-APK | **`0.12.0`** |
| — | TTS-Vorlesen | nach PO-Go |
| — | `1.0.0` MAJOR | nach `0.12`, Inhalt PO |

Detail Proxy/APK: [`13-lan-proxy.md`](./13-lan-proxy.md) · Sprints: [`sprints/README.md`](./sprints/README.md)

---

## Abnahmetest MVP (Checkliste)

- [ ] Kein Cloud-LLM im Antwortpfad
- [ ] „Hallo“ / „Wie geht’s?“ fühlt sich natürlich an
- [ ] Folgefrage bezieht sich auf vorherige Aussage
- [ ] Antwortlänge wirkt wie Chat, nicht wie Aufsatz
- [ ] Persona-Tabus werden eingehalten (laut `07`)
- [ ] Neustart des Chats (neues Gespräch) ist möglich

---

## Arbeitsbranch-Regel

Umsetzung erfolgt auf Feature-Branches nach Projektkonvention (`cursor/...`).  
Planungsänderungen an diesen Docs werden mitgezogen, wenn sich Entscheidungen ändern.
