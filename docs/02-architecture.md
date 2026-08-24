# 02 — Architektur

> **Live `2.2.2`:** Denken on-device (wllama 0,5B) **oder** Gemini Opt-in. Kein Ollama, kein NAS. Fähigkeiten und Router: [`00-now.md`](./00-now.md). Die Tabelle darunter ist die **MVP-Entscheidung** (`0.1`) — historisch, wo sie Ollama/NAS/Desktop-VRAM nennt.

## Live-Stack (`2.2.2`)

```text
[Handy — Sideload-APK]
        │
        ▼
[Chat-UI Capacitor/React]
        │
        ▼
[Engine TypeScript]
   • Router chat.ts · Persona · Memory · Tools
   • wllama 0,5B  oder  Gemini Opt-in
        │
        ▼
[IndexedDB + GGUF auf dem Gerät]
```

PC: `desktop/JarvisPC.bat` im WLAN. TV/Steckdosen/Ventilator: native Plugins in der APK.

## Leitentscheidung

**Design = Variante 3 (lokal).**  
Jarvis denkt auf deiner Hardware. Cloud-LLMs sind für das Denken **nicht** Default (Gemini nur Opt-in).

### MVP-Entscheidungen (historisch, Sprint 1)

| Aspekt | Entscheidung |
|--------|----------------|
| Gesprächsform | Text-Chat (Typ A: Chat-Mensch) |
| Denk-Engine | Lokales LLM |
| Modell-Host MVP | **Ollama** (Default, solange keine klar bessere Alternative) |
| Laufzeit MVP | Entwicklungsrechner: **Windows, 16 GB RAM, NVIDIA RTX 3060** |
| Qualitäts-/Speed-Priorität | **Qualität > Rohgeschwindigkeit**; so schnell wie möglich, Speed-Feintuning später |
| Chat-Persistenz MVP | **Gespräche zwischen Sessions speichern** |
| Sicherheit MVP (vorerst) | Kein Cloud-LLM + Zugang nur für dich; At-rest-Encryption noch nicht fest (erstmal zurückgestellt) |
| Laufzeit `0.13.x` | Android-APK, llama.cpp WASM on-device |
| Stimme | **Code `1.5`+:** TTS liest denselben Text (Gemini-Stimme opt-in) |
| Handy | Die App **ist** Jarvis; Sideload, kein Store |
| UI-Kanal | Web-UI in Capacitor; kein Telegram |
| UI-Look | **Spotify dunkel** + **ChatGPT**-Layout |
| UI-Motion | **Code `1.13.0`** |
| Version `0.1.0` | MVP |
| Version `0.13.0` | On-Device Handy — **gilt** |
| Version `2.2.2` | Live — [`00-now.md`](./00-now.md) |

Die Zeilen Ollama / Desktop-VRAM / NAS-`0.10` oben sind **abgelöst**.

## Prinzipien

1. **Eine Denk-Quelle** — Lokal, außer Gemini bewusst an.
2. **Persona sitzt in der Engine** — feste Regeln, nicht Hoffnung.
3. **Ausgabe ≠ Intelligenz** — TTS spricht vorhandenen Text.
4. **Daten bleiben auf dem Gerät** — IndexedDB, kein Store-Account.

## Datenschutz & Sicherheit

- Chats bleiben auf dem Gerät (IndexedDB).
- Denken lokal, außer Gemini Opt-in (dann geht Chat zu Google).
- Keine Store-Accounts, keine Telemetrie.

Offene Restfragen: [`08-open-questions.md`](./08-open-questions.md). NAS-Compose und Ollama sind **historisch**.
