# 02 — Architektur

## Leitentscheidung

**Design = on-device.**  
Jarvis denkt **auf dem Handy**. Cloud-LLMs sind für das Denken **nicht** vorgesehen. PC-Ollama und NAS sind entfallen.

| Aspekt | Entscheidung |
|--------|----------------|
| Gesprächsform | Text-Chat (Typ A: Chat-Mensch) |
| Denk-Engine | Lokales LLM in der APK |
| Laufzeit | Android-APK, llama.cpp WASM (wllama) |
| Modell | Qwen2.5 0.5B Instruct Q4 (~470 MB, First-Run) |
| Chat-Persistenz | IndexedDB auf dem Gerät |
| Modell-Cache | OPFS, Fallback IndexedDB — überlebt App-Neustart |
| Sicherheit | Kein Cloud-LLM; kein Server; kein Token |
| Stimme | Später: TTS liest denselben Text vor (PO) |
| Handy | Die App **ist** Jarvis; Sideload, kein Store |
| UI-Kanal | Web-UI in Capacitor |
| UI-Look | **Spotify dunkel** + **ChatGPT** (Layout/Buttons) |
| Chat-Organisation | Mehrere Chats + Liste + „Neues Gespräch“ |
| Version `0.13.1` | **aktuell** — On-Device Hotfix |
| Version `1.0.0` | nächster MAJOR (PO) |

Historisch (nicht mehr im Repo-Alltag): Ollama auf Windows/RTX 3060, FastAPI, NAS-Compose, NAS-Proxy. Siehe [`12-nas-apk.md`](./12-nas-apk.md).

## Logische Bausteine

```text
[Du — Handy]
        │
        │  on-device, kein Server
        ▼
[Chat-UI in der APK]
        │
        ▼
[Jarvis-Engine auf dem Handy]
   • Persona / Memory / Tools / Guards
   • wllama (llama.cpp WASM)
        │
        ▼
[IndexedDB + OPFS auf dem Gerät]
```

### Baustein-Erklärung

| Baustein | Einfach gesagt |
|----------|----------------|
| **Chat-UI** | Das Fenster, in dem du tippst und Antworten liest. |
| **Engine** | TypeScript auf dem Gerät: Persona, Memory, Tools, Guards, Prompt. |
| **Modell-Runtime** | wllama führt das GGUF lokal in der WebView aus. |
| **Kurzzeitgedächtnis** | Die letzten Nachrichten werden mitgeschickt. |
| **Langzeitgedächtnis** | Fakten in IndexedDB, über Chats hinweg. |
| **TTS (später)** | Wandelt Jarvis’ Text in gesprochene Sprache um — ohne das Denkmodell zu ersetzen. |

## Prinzipien

1. **Eine Denk-Quelle** — Lokal auf dem Handy. Keine heimliche Cloud-Fallback-KI.
2. **Persona sitzt in der Engine** — Nicht „hoffentlich antwortet das Modell nett“, sondern feste Regeln.
3. **Ausgabe ≠ Intelligenz** — TTS ist nur Stimme für vorhandenen Text.
4. **Kein Netz im Alltag** — Nur der einmalige Modell-Download braucht WLAN.
5. **Kein Server-Migrationspfad** — NAS/PC-Backend kommen nicht zurück, außer der PO entscheidet neu.

## Datenschutz & Sicherheit

- Chats, Memory, Todos, Notizen bleiben auf dem Gerät (IndexedDB).
- Kein Cloud-LLM fürs Denken.
- Keine unnötigen Drittanbieter-Telemetrie-Abhängigkeiten in der UI.
- Research-Netzpfad ist aus / geparkt.
- First-Run lädt nur die GGUF (Hugging Face), danach offline.

## Spätere Erweiterungen

| Erweiterung | Status |
|-------------|--------|
| TTS-Vorlesen | Phase Stimme — nur PO-Go |
| Samsung-TV | **geparkt** |
| Internet-Research | **geparkt** (widerspricht Offline) |
| Play Store / iOS | **Parking** |
