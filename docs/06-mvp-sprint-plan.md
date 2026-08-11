# 06 — MVP & Sprint-Plan

## MVP v0.1 — Definition

**Name:** Local Smalltalk Jarvis  
**Phase:** 1 (mit Phase-0-Persona als Eingang)

### In Scope

- Lokales LLM über **Ollama** (kein Cloud-Denken)
- Backend mit Jarvis-Persona + Gesprächskontext (letzte N Turns)
- **Persistente** Chats; Zielrichtung **mehrere Chats + Liste + Neues Gespräch** (MVP darf schlank/bedingt sein, aber ausbaufähig)
- Web-Chat-UI: **Spotify-Farben** + **ChatGPT-artiges Layout**; Motion **light**
- Smalltalk-**Qualität** als Abnahmekriterium

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
4. nicht generisch-ChatGPT-haft.

**Misserfolg früh erkennen**

| Symptom | Typische Reaktion |
|---------|-------------------|
| Steife/templatehafte Antworten | Persona/Stil schärfen; anderes Modell testen |
| Zu langsam | erst Qualität halten; später quantisieren/kleineres Modell (PO: Speed nachrangig) |
| Kontextvergesslichkeit | Kurzgedächtnis N erhöhen / Prompt-Struktur fixen |

---

## Sprint 0 — Planning & Spikes (aktuell)

**Sprint-Ziel:** Planung steht; Blocker für Sprint 1 sind benannt und so weit geklärt, dass Bau starten kann.

| Item | Typ | Done wenn |
|------|-----|-----------|
| Planungsdokumente | Done | `docs/` vollständig & verlinkt |
| Offene Fragen klären | PO-Workshop | Minimal-Set in `08` (Q21, Q32) |
| Persona-Kern | Done | `07` gesetzt |
| Hardware-Kurzcheck | Fast done | Win/16GB/3060; VRAM-Bestätigung Q32 |
| Stack-Richtung | Done grob | Ollama + ausgewogenes Modell + Web-UI; Backend pragmatisch |
| UI-Anspruch | Prinzip gesetzt | Premium/smooth über Gesamtprojekt (`01`, `02`) |

**Increment Sprint 0:** Entscheidbare Planung + klaffende Lücken geschlossen oder bewusst terminiert.

---

## Sprint 1 — Vorschlag (nach Klärung der Blocker)

**Sprint-Ziel (Entwurf):**  
„Ich kann im Browser lokal mit Jarvis smalltalken — Persona an, Kurzgedächtnis an, ohne Cloud-LLM.“

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

| Sprint-Idee | Zielrichtung |
|-------------|--------------|
| Sprint 2 | Gesprächsqualität härten; UI mobil; Robustheit |
| Sprint 3 | Phase-2-Vorbereitung: Auth-Konzept + privater Zugriff |
| Später | NAS / TTS nach explizitem PO-Go |

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
