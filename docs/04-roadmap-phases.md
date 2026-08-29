# 04 — Roadmap & Phasen

Kein Kalenderversprechen. **Aktueller Ist-Stand:** On-Device `0.13.1` auf dem Handy, offline nach dem Modell-Download. Details: [`13-on-device.md`](./13-on-device.md).

## Überblick

```text
Phase 0  Persona & Regeln                 DONE
    ↓
Phase 1  Local Smalltalk (historisch PC)  HISTORISCH — portiert nach 0.13.x
    ↓
Phase 2  Handy on-device, offline         AKTUELL (0.13.1)
    ↓
Phase 3  NAS 24/7                         SUPERSEDED — entfällt
    ↓
Phase 4  TTS-Vorlesen                     nur auf PO-Kommando
    ↓
Phase 5+ Extra-Assistent                  TV / Research-Netz / Store = Parking
```

**Hinweis:** Ab `0.13.0` läuft Jarvis on-device auf dem Handy. NAS/Docker/PC-Ollama sind entfallen. **Jetzt:** Code **`6.60.0`**, Sideload **`6.60.0`**. **Hirn:** Gemini Hauptweg → Groq Backup → 0,5B zuletzt. Weltlage [`35-next.md`](./35-next.md), Alltagskette [`36-next.md`](./36-next.md), Stimme [`37-next.md`](./37-next.md), Hausstand [`38-next.md`](./38-next.md) (Export vor Deinstall), Gesichter + Tablet [`39-next.md`](./39-next.md), Körper [`40-next.md`](./40-next.md), Globus [`43-next.md`](./43-next.md)/[`45-next.md`](./45-next.md), Debug-Lauf [`44-next.md`](./44-next.md) — alles **CODE**. TTS `1.5`+.

## Phase 0 — Persona & Qualitätsmaßstab

**Ziel:** Jarvis’ Charakter ist in Worten und Beispielen greifbar.

**Inhalt:** Ton, Anrede, Humor, Tabus, Anti-KI-Stil, Soll/Nicht-Soll in `07-persona.md`.

## Phase 1 — Local Smalltalk — **HISTORISCH**

Gebaut als Browser + Ollama auf dem Dev-PC (`0.1.0`–`0.9.5`). Der Stack ist **entfernt**. Chat, Persona, Memory, Tools und UI leben in der On-Device-Engine weiter.

## Phase 2 — Handy on-device — **AKTUELL**

**Ziel:** Jarvis denkt auf dem Telefon. Einmal Modell laden, danach offline.

**Inhalt** (geliefert in `0.13.0`–`0.13.1`)
- Capacitor-APK mit TypeScript-Engine
- wllama / Qwen2.5 0.5B Q4
- IndexedDB (Chats, Memory, Todos, Notizen)
- First-Run-Download, Cache überlebt App-Neustart

**Exit-Kriterium**  
Sideload, einmal laden, schließen/öffnen ohne Download, Chat ohne Server.

**Nicht:** Play Store, iOS, NAS-URL, Owner-Token.

## Phase 3 — NAS 24/7 — **SUPERSEDED**

Compose, Proxy, FastAPI, Ollama-auf-NAS: **entfallen**. DS218 kann kein LLM. Historie: [`12-nas-apk.md`](./12-nas-apk.md).

## Phase 4 — Realistisches Vorlesen (TTS)

**Voraussetzung:** Explizites Go vom PO.

**Ziel:** Denselben Text realistischer vorlesen lassen. Stimme ersetzt keine Text-Persona.

## Phase 5+ — Extra

| Thema | Status |
|-------|--------|
| Memory / Tools / Settings | **in `0.13.x`** (schlanker als der alte PC-Stack) |
| Internet-Research (`0.6.x`) | **geparkt** — App ist offline |
| Samsung-TV (`0.11.x`) | **geparkt** |
| Mail / Fire TV / Alexa / Play Store | **Parking** |

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
- Memory Quality Hotfix → **`0.9.3`** (Sprint 31, geplant)
- Assist Continuity & Siezen → **`0.9.4`** (Sprint 32, geplant)
- Tools Hygiene & Confirm-UX → **`0.9.5`** (Sprint 33, geplant)
- NAS Compose 24/7 → **`0.10.0`** (Sprint 34)
- NAS Auth + APK Sideload → **`0.10.2`–`0.10.5`** (Sprints 36–39) — [`12`](./12-nas-apk.md)
- Samsung-TV lokal → **`0.11.0`–`0.11.2`** (Sprints 40–42)
- Mail / Fire TV / Alexa / Play Store — **Parking**
- Tools (Kalender/Mail) — Kalender **ist** in `1.4`+; Mail bleibt Parking
- Alltag `1.14`–`1.24` — **CODE** [`19-next.md`](./19-next.md) · [`20-next.md`](./20-next.md)
- Intelligenz `3.0.0` — **CODE** [`32-intelligence.md`](./32-intelligence.md)
- Welt `3.1`–`3.17` — **CODE** in `3.0.0` [`31-next.md`](./31-next.md)
- Lage / Härten `3.18.0` — **CODE** [`33-next.md`](./33-next.md)
- GUI Premium `3.18.1` — **CODE** [`sprints/sprint-108.md`](./sprints/sprint-108.md)
- Stimme/Kalender `3.19.0` — **CODE** [`34-next.md`](./34-next.md)
- Weltlage `4.0` — **CODE** [`35-next.md`](./35-next.md)
- Alltagskette `4.19` — **CODE** [`36-next.md`](./36-next.md)
- Film-TTS / Steuer `4.33` — **CODE** [`37-next.md`](./37-next.md)
- Hausstand `4.46` — **CODE** [`38-next.md`](./38-next.md)
- Jarvis/Friday + Tablet `4.53` — **CODE** [`39-next.md`](./39-next.md)
- Körper intern `4.66` — **CODE** in `5.11` [`40-next.md`](./40-next.md)
- Debug-Lauf `5.11` — **CODE** [`44-next.md`](./44-next.md)
- Bühne & Hirn `6.0` — **PLAN** [`45-next.md`](./45-next.md)
- Agentic Recall `6.60` — **PLAN** [`46-next.md`](./46-next.md)

**Hinweis Research:** „100 % verlässlich“ heißt Engineering-DoD (Quellen, Opt-in, kein Raten) — nicht epistemische Allwissenheit.
---

## Abhängigkeiten (wichtig)

| Willst du … | Brauchst du zuerst … |
|-------------|----------------------|
| TTS | Stabilen Text-Charakter + PO-Go |
| NAS 24/7 | Neue PO-Entscheidung (aktuell: nein) |
| Handy-Alltag | Sideload `0.13.1` — **ist der Alltag** |
| Research im Netz | Widerspricht Offline — nur nach PO-Go |
