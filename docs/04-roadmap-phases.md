# 04 — Roadmap & Phasen

> **Aktuell:** Code **`2.19.0`** (Live-Qualität + Welt). `2.2.4` 1.5B bleibt SHOULD ([`30-next.md`](./30-next.md)). Sprints 46–48 auf `main` bleiben historisch (`0.13.2` Hang-Fix, `0.14.0`, `0.14.1` TV).

Die Phasen sind **sequentiell im Schwerpunkt**, dürfen aber Lernschleifen haben.  
Kein Kalenderversprechen — Fortschritt hängt von Hardware, Modellwahl und Persona-Abnahme ab.

## Überblick

```text
Phase 0  Persona & Regeln
    ↓
Phase 1  Local Smalltalk-MVP   (historisch PC)
    ↓
Phase 2  On-Device Handy       ← Alltag ab `0.13.0`
    ↓
Phase 3  24/7 NAS              ← Parking
    ↓
Phase 4  Realistisches Vorlesen (TTS)   ← nur auf PO-Kommando
    ↓
Phase 5+ Echter Assistent (Gedächtnis, Tools — teils schon in 0.4–0.9)
```

**Hinweis:** Ab `0.13.0` läuft Jarvis on-device auf dem Handy. NAS/Docker/PC-Ollama sind entfallen. **`0.14`:** bestehendes härten + TV live. **`1.0`–`1.33.0`:** Alltag auf dem Handy inkl. Suche mit Preisen. **`2.2.2`:** Sideload. **Als Nächstes Code `2.2.3`.** Welt-Reihe **PLAN** `2.3`–`2.19`: [`31-next.md`](./31-next.md). TTS ist geliefert (`1.5`+).

## Phase 0 — Persona & Qualitätsmaßstab

**Ziel:** Jarvis’ Charakter ist in Worten und Beispielen greifbar.

**Inhalt**
- Ton, Anrede, Humor, Tabus
- Anti-KI-Stilregeln
- 10–20 Beispiel-Smalltalks (Soll/Nicht-Soll)

**Exit-Kriterium**  
Du kannst sagen: „Jarvis klingt so: …“ und Beispiele in `07-persona.md` sind gefüllt.

**Scrum:** oft Teil von Sprint 0 / parallel zu technischem Spike.

---

## Phase 1 — Local Smalltalk-MVP

**Ziel:** Im Browser auf dem Entwicklungsrechner mit lokalem Modell smalltalken.

**Inhalt**
- Lokaler Modell-Host + gewähltes Modell
- Mini-Backend mit Persona + Kurzgedächtnis
- Einfache mobilfreundliche Chat-UI
- Nur Smalltalk — keine Tools/Stimme/Langzeitgedächtnis

**Exit-Kriterium**  
~10 Minuten Alltags-Smalltalk fühlen sich nach *deinem* Jarvis an.

**Sprint-Ziel-Beispiele**
- „Ollama läuft und antwortet roh“
- „Chat-UI spricht mit Backend + Persona“
- „Kurzgedächtnis hält 1 Gespräch konsistent“

---

## Phase 2 — Privat vom Handy (in `0.10.x` mit Phase 3)

**Ziel:** Vom Handy chatten — **Sideload-APK**, Modell on-device (`0.13.0`).

NAS-URL + Token (`0.10.x`) ist **superseded**.

**Inhalt** (geliefert in `0.10.2`–`0.10.5`)
- Owner-Token (kein Multi-User)
- Capacitor-APK um die bestehende Web-UI
- NAS-URL + Token in der App (First-Run)
- Optional später: Tailscale/VPN (Should, nicht Must)

**Exit-Kriterium**  
APK-Chat gegen NAS ist Alltag; ohne Token kein Zugriff.

**Nicht:** Play Store, iOS.

---

## Phase 3 — 24/7 auf NAS (in `0.10.x` mit Phase 2)

**Ziel:** Dauerbetrieb ohne dass der Laptop an sein muss.

**Inhalt** (geliefert in `0.10.0`–`0.10.1`)
- Docker Compose: Backend, Frontend-Static, Ollama
- Autostart, Volumes, Backup
- Modell an NAS-Ressourcen (`3b` ohne GPU, `7b` mit GPU)

**Exit-Kriterium**  
Reboot → Stack wieder da; Chat im Browser gegen NAS-IP.

**Version:** früher `1.0.0` — jetzt **`0.10.0`–`0.10.5`**. `1.0.0` ist frei für einen späteren MAJOR.

---

## Phase 4 — Realistisches Vorlesen (TTS)

**Voraussetzung:** Explizites Go vom PO.

**Ziel:** Denselben Text realistischer vorlesen lassen.

**Inhalt**
- TTS-Anbindung an bestehende Antworten
- Stimmwahl / Natürlichkeit
- Optional später: Spracheingabe (eigener Schnitt, nicht automatisch inkl.)

**Exit-Kriterium**  
Vorlesen fühlt sich zum etablierten Text-Charakter stimmig an.

---

## Phase 5+ — Assistenten-Fähigkeiten

**Ziel:** Nutzen über Smalltalk hinaus — erst wenn Betrieb + Charakter sitzen.

**Geplant (siehe Detail-Docs)**
- Langzeitgedächtnis, Summary, Kontextkompression → **`0.4.0`** (Sprint 8, [`10`](./10-intelligence-capabilities.md))
- Memory Must-Fixes → **`0.4.1`** (Sprint 9)
- Memory Polish → **`0.4.2`** (Sprint 10)
- Memory Hotfix → **`0.4.3`** (Sprint 11, prio)
- Intent-Router inkl. Memory-Intent, Model-Routing, Scores → **`0.5.0`** (Sprint 12)
- Router Hotfix → **`0.5.1`** (Sprint 13, Review; in `0.5.2`)
- Router Polish (Should) → **`0.5.2`** (Sprint 14, Review)
- Verlässliche Internet-Research (opt-in, zitiert) → **`0.6.0`** (Sprint 15, Review)
- Research Hotfix → **`0.6.1`** (Sprint 16, Review; in `0.7.0`)
- Research Polish (Should) → **`0.6.2`** (Sprint 17, Review; in `0.7.0`)
- Delight + flaches Settings → **`0.7.0`** (Sprint 18, Review)
- Quality Hotfix (Guards/Settings/Research/Inject) → **`0.7.1`** (Sprint 19, Review)
- Reply Quality Polish (Canned/Recall/CJK) → **`0.7.2`** (Sprint 20, READY — in `0.8.0`)
- Delight & Session Polish (Mood/Eggs/UX/Latenz) → **`0.7.3`** (Sprint 21, READY — in `0.8.0`)
- Assist Clarity (Clarify, `/hilfe`, Stream/UX) → **`0.8.0`** (Sprint 22, READY FOR REVIEW; Deep-Test durch)
- Assist Hotfix (Normalize/Duzen/Soft-Gate) → **`0.8.1`** (Sprint 23, READY — in `0.8.3`)
- Edge & Reply Polish → **`0.8.2`** (Sprint 24, READY — in `0.8.3`)
- Assist Ops & Carry-over → **`0.8.3`** (Sprint 25, READY FOR REVIEW)
- Siezen & Recall Hotfix → **`0.8.4`** (Sprint 26, READY FOR REVIEW)
- Persona & Continuity Hotfix → **`0.8.5`** (Sprint 27, READY — in `0.9.0`)
- Local Tools Core (Option A) → **`0.9.0`** (Sprint 28, READY FOR REVIEW)
- Tools Hotfix → **`0.9.1`** (Sprint 29, READY FOR REVIEW)
- Tools Polish & Continuity → **`0.9.2`** (Sprint 30, READY FOR REVIEW)
- Memory Quality Hotfix → **`0.9.3`** (Sprint 31) — **Parking**; Honesty in `2.2.3`
- Assist Continuity & Siezen → **`0.9.4`** (Sprint 32) — **Parking**; Siezen-Scrub in `2.2.3`
- Tools Hygiene & Confirm-UX → **`0.9.5`** (Sprint 33) — **Parking**
- NAS Compose / APK-gegen-NAS → **`0.10.x`** — **Parking**
- Samsung-TV lokal → **`0.11.x`** historisch; **live in `0.14.1`**
- On-Device Handy → **`0.13.0`–`0.13.1`** (Sprints 44–45, CODE)
- Chat-Hang / Stream → **`0.13.2`** (Sprint 46, CODE) — in `2.2.2`
- Live-Qualität → **`2.2.3`** (Sprint 105, **IN SPRINT**) — früher intern `0.13.3`
- Optional 1.5B → **`2.2.4`** (Sprint 106, SHOULD)
- Native llama.cpp → PO
- Mail / Fire TV / Alexa / Play Store — **Parking**
- Tools (Kalender/Mail) — Kalender **ist** in `1.4`+; Mail bleibt Parking
- Alltag `1.14`–`1.15` — **CODE**; `1.16`–`1.20` — **PLANNED** [`19-next.md`](./19-next.md); Extra `1.21`–`1.24` — **PLANNED** [`20-next.md`](./20-next.md)

**Hinweis Research:** „100 % verlässlich“ heißt Engineering-DoD (Quellen, Opt-in, kein Raten) — nicht epistemische Allwissenheit.
---

## Abhängigkeiten (wichtig)

| Willst du … | Brauchst du zuerst … |
|-------------|----------------------|
| TTS | Stabilen Text-Charakter (Phase 1+) |
| NAS 24/7 | Laufenden Stack auf dem PC (Phase 1) |
| Handy-Alltag | On-Device APK (`0.13.x`) |
| Tools | Klare Persona + lokale Engine |

## Sparring-Korrekturen in der Roadmap

- Alltag ist die APK (`2.2.x`), nicht NAS.
- Live-Qualität `2.2.3`; optionales 1.5B `2.2.4`.
- Tempo `0.13.2` Stream/Threads ist in `2.2.2` drin.
- Stimme ersetzt keine gute Text-Persona.
