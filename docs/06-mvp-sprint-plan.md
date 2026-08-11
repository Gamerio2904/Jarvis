# 06 — MVP & Sprint-Plan

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
| Versionierung | **Done** | `0.1.0`=MVP, `1.0.0`=NAS (`09`) |

**Increment Sprint 0:** Entscheidbare Planung; Sprint 1 freigegeben.

**Retro (3 Bullets)** — siehe `sprints/sprint-00.md`.

---

## Sprint 1 — Local Smalltalk MVP — **NEXT**

**Status:** Bereit zum Start (PO-Go)  
**Ziel-Version:** `0.1.0`  
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

## Sprint 2+ (nur Richtung, nicht committed)

| Sprint-Idee | Zielrichtung | Version (Beispiel) |
|-------------|--------------|---------------------|
| Sprint 2 | Gesprächsqualität; Chat-Liste härten; UI polieren | `0.2.0` |
| GUI-Update | Premium-Motion (nach Light-MVP) | eigenes MINOR |
| Später | Phase 2 Handy/VPN — **erst wenn PO Phase 2 plant** | TBD |
| Später | NAS / TTS nach explizitem PO-Go | TBD |

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
