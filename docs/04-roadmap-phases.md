# 04 — Roadmap & Phasen

Die Phasen sind **sequentiell im Schwerpunkt**, dürfen aber Lernschleifen haben.  
Kein Kalenderversprechen — Fortschritt hängt von Hardware, Modellwahl und Persona-Abnahme ab.

## Überblick

```text
Phase 0  Persona & Regeln
    ↓
Phase 1  Local Smalltalk-MVP   ← erster Bau-Schwerpunkt
    ↓
Phase 2  Privat vom Handy nutzbar
    ↓
Phase 3  24/7 auf NAS
    ↓
Phase 4  Realistisches Vorlesen (TTS)   ← nur auf PO-Kommando
    ↓
Phase 5+ Echter Assistent (stärkeres Gedächtnis, Tools)
```

**Hinweis:** Phase 2+ (Handy/Netz, NAS, TTS) wird **bewusst später** im Detail geplant — Roadmap-Richtung bleibt, Feinschnitt auf PO-Kommando.

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

## Phase 2 — Privat vom Handy

**Ziel:** Zuverlässig vom Handy im eigenen Setup chatten — ohne Native App.

**Inhalt**
- Erreichbarkeit im eigenen Netz / VPN (z.B. Tailscale o.Ä.)
- Auth (nur du)
- Stabilerer Start der Dienste

**Exit-Kriterium**  
Handy-Chat mit lokalem Jarvis ist Alltagstauglich-genug.

---

## Phase 3 — 24/7 auf NAS

**Ziel:** Dauerbetrieb ohne dass der Laptop an sein muss.

**Inhalt**
- Stack-Umzug (idealerweise containerisiert)
- Autostart, Backup von Config/Chats
- Modellgröße an NAS-Ressourcen anpassen

**Exit-Kriterium**  
Jarvis ist dauerhaft erreichbar; Ausfall/Neustart ist handhabbar.

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
- Assist Hotfix (Normalize/Duzen/Soft-Gate) → **`0.8.1`** (Sprint 23, geplant)
- Edge & Reply Polish → **`0.8.2`** (Sprint 24, geplant)
- Assist Ops & Carry-over → **`0.8.3`** (Sprint 25, geplant)
- Optional nächstes MINOR (Tools/stärkeres Assist) → **`0.9.0`** (nur nach PO)
- Tools (Kalender, Notizen, …) / Native App nur falls nötig

**Hinweis Research:** „100 % verlässlich“ heißt Engineering-DoD (Quellen, Opt-in, kein Raten) — nicht epistemische Allwissenheit.
---

## Abhängigkeiten (wichtig)

| Willst du … | Brauchst du zuerst … |
|-------------|----------------------|
| TTS | Stabilen Text-Charakter (Phase 1+) |
| NAS 24/7 | Laufenden Stack auf dem PC (Phase 1) |
| Handy-Alltag | Auth + Netz-Härte (Phase 2) |
| Tools | Klare Persona + zuverlässigen Betrieb |

## Sparring-Korrekturen in der Roadmap

- Handy-App und NAS sind **nicht** Phase-1-Arbeit.
- Lokales Modell kann Smalltalk schwächen → Persona/Stil und ggf. Modellwechsel sind Teil von Phase 1, keine „spätere Politur“.
- Stimme ersetzt keine gute Text-Persona.
