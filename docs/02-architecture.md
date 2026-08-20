# 02 — Architektur

> **Live `2.2.2`:** Gemini-Opt-in, TV, Alltag. Nächste Reihe [`31-next.md`](./31-next.md) (`2.3`–`2.19`). Zeilen zu `0.13.3`/`0.13.4` und „TV Parking“ unten sind ein Parallel-Entwurf ([`14-on-device-iq.md`](./14-on-device-iq.md)), nicht die aktuelle Lieferung. `14` in der Tabelle von [`README.md`](./README.md) ist TV.

## Leitentscheidung

**Design = Variante 3 (lokal).**  
Jarvis denkt auf deiner Hardware. Cloud-LLMs sind für das Denken **nicht** vorgesehen.

| Aspekt | Entscheidung |
|--------|----------------|
| Gesprächsform | Text-Chat (Typ A: Chat-Mensch) |
| Denk-Engine | Lokales LLM |
| Modell-Host MVP | **historisch Ollama** (PC). Ab `0.13.0`: **wllama / llama.cpp WASM** on-device |
| Laufzeit MVP | historisch Windows + RTX 3060. Alltag: **Android-APK** |
| Qualitäts-/Speed-Priorität | **Qualität zuerst**; Tempo ohne Prompt-/Sampling-Schnitt (`0.13.2`) |
| Laufzeit `0.13.x` | Android-APK, llama.cpp WASM; Default Qwen2.5-0.5B Q4; optional 1.5B in `0.13.4` |
| Chat-Persistenz MVP | **Gespräche zwischen Sessions speichern** |
| Sicherheit MVP (vorerst) | Kein Cloud-LLM + Zugang nur für dich; At-rest-Encryption noch nicht fest (erstmal zurückgestellt) |
| Stimme | **Code `1.5`+:** TTS liest denselben Text (Gemini-Stimme opt-in) |
| Handy | Die App **ist** Jarvis; Sideload, kein Store |
| UI-Kanal | Web-UI in Capacitor; kein Telegram |
| UI-Look | **Spotify dunkel** (Schwarz/Grün) + **ChatGPT** (Layout/Buttons/Chat-Struktur) |
| UI-Motion | **Code `1.13.0`:** Chrome fest, Chat scrollt, Motion; `prefers-reduced-motion` |
| Chat-Organisation | **Zielbild:** mehrere Chats + Liste + „Neues Gespräch“ (ChatGPT-ähnlich) |
| Kontext / Erinnern | In-Chat + Langzeitgedächtnis (`0.4.x`); Honesty-Nachzug `0.13.3` |
| Engine | TypeScript in der APK (kein FastAPI) |
| Modellklasse Alltag | Qwen2.5-0.5B Q4; optional 1.5B (`0.13.4`) |
| Version `0.1.0` | = **MVP** (Sprint-1-Abnahme) |
| Version `0.10.0` | = NAS Core — **Parking** |
| Version `0.11.0` | = Samsung-TV — **Parking** |
| Version `0.13.0` | = **On-Device Handy** |
| Version `0.13.2`–`0.13.4` | Latenz → Qualität → optionale Intelligenz ([`14`](./14-on-device-iq.md)) |
| Version `0.14.0` | native llama.cpp (PO) |
| Version `1.0.0` | = nächster MAJOR (PO) |

## Logische Bausteine

```text
[Du — Handy]
        │
        │  `0.13.x`: on-device, kein Server
        ▼
[Chat-UI in der APK]
        │
        ▼
[Jarvis-Engine auf dem Handy]
   • Persona / Memory / Tools / Guards
   • wllama (llama.cpp WASM)
        │
        ▼
[IndexedDB auf dem Gerät]
```

### Baustein-Erklärung (für Amateure)

| Baustein | Einfach gesagt |
|----------|----------------|
| **Chat-UI** | Das Fenster, in dem du tippst und Antworten liest. |
| **Engine** | Persona, Memory, Tools, Guards — läuft in der App. |
| **Modell** | llama.cpp WASM (wllama) auf dem Handy. |
| **Kurzzeitgedächtnis** | Die letzten Nachrichten werden mitgeschickt, damit Jarvis dem Gespräch folgen kann. |
| **TTS (später)** | Wandelt Jarvis’ Text in gesprochene Sprache um — ohne das Denkmodell zu ersetzen. |

## Prinzipien

1. **Eine Denk-Quelle** — Lokal. Keine heimliche Cloud-Fallback-KI ohne bewusste Entscheidung.
2. **Persona sitzt in der Engine** — Nicht „hoffentlich antwortet das Modell nett“, sondern feste Regeln.
3. **Ausgabe ≠ Intelligenz** — TTS ist nur Stimme für vorhandenen Text.
4. **Kein Server im Alltag** — `0.13.x` braucht kein LAN, kein Token, kein NAS-Port.
5. **On-device Alltag** — Denken in der APK. NAS/PC-Ollama sind Parking.

## Datenschutz & Sicherheit (Architektur-Regeln)

- Chats und Persona bleiben auf dem Gerät (IndexedDB).
- Kein Cloud-LLM fürs Denken.
- Keine unnötigen Drittanbieter-Telemetrie-Abhängigkeiten in der UI.
- Fernzugriff entfällt in `0.13.x` (kein Server).
- Speichern nur, was für Chat/Memory/Tools nötig ist.

## Bewusst offene Technikdetails

Fest in `0.13.x`: Modell Qwen2.5-0.5B Q4, Host wllama, Persistenz IndexedDB/OPFS.  
Offen (PO): natives llama.cpp `0.14.0`, TTS, optional 1.5B-Abnahme.

## Spätere Erweiterungen (nicht Alltag jetzt)

| Erweiterung | Phase / Version |
|-------------|-----------------|
| On-Device Latenz / Qualität / 1.5B | `0.13.2`–`0.13.4` |
| Native llama.cpp | `0.14.0` (PO) |
| TTS-Vorlesen | Phase 4 (PO) |
| NAS / Samsung-TV | Parking |
