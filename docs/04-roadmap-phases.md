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
Phase 5+ Echter Assistent (Gedächtnis, Tools)
```

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

**Kandidaten (Backlog, nicht zugesagt)**
- bewusstes Langzeitgedächtnis
- Tools (Kalender, Notizen, …)
- Native App nur falls Web+VPN nicht reicht

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
