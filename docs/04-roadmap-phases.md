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

## Phase 0 — Persona & Qualitätsmaßstab — **DONE**

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

## Abhängigkeiten

| Willst du … | Brauchst du zuerst … |
|-------------|----------------------|
| TTS | Stabilen Text-Charakter + PO-Go |
| NAS 24/7 | Neue PO-Entscheidung (aktuell: nein) |
| Handy-Alltag | Sideload `0.13.1` — **ist der Alltag** |
| Research im Netz | Widerspricht Offline — nur nach PO-Go |
