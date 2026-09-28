# 02 — Architektur

> **Jetzt:** Code **`18.14.2`**. Sideload **`18.14.2`**, versionCode `181402`. **Hirn:** Groq primär (`brain_primary`) → Gemini Spezialist → 0,5B. Parser zuerst, Director ein Agent pro Zug, 63 Domänen. Cloud-Prompt: Persona vorn (Cache), Memory am User-Turn. Agenten-Ist [`66-agents-ist.md`](./66-agents-ist.md). Test [`TEST-18.14.md`](./TEST-18.14.md).

## Leitentscheidung

**Gerät = Handy.** Jarvis denkt auf dem Telefon. Der PC ist Werkzeug (`JarvisPC.bat`), kein zweites Hirn. Capability-Levels (`9.2`): der Agent wirbt, was er kann. Unbekanntes Starten erst nach Ja. JPEG ist kein Klick-Beweis. Live (`9.3`): LAN-Einzelbilder; WebRTC nur wenn der Peer steht. Kein TURN. Hardening (`9.9`): PC nur LAN, Keys nicht im Chat.

**Denk-Kaskade (live `brain_v2`, Default `brain_primary: groq`):**

1. **Groq** — Smalltalk und Formulierung, sobald Key da
2. **Gemini** — Spezialist: Vision, Deep Research / Grounding (`brain-orchestrator.ts`)
3. **0,5B Qwen** (wllama) — letzter Fallback, nie als Claude/GPT verkaufen
4. sonst ehrlich: Tools ohne Modell, Overlay „Fertig — Tools ohne Modell“

Historisch `6.50`–`13.44`: Gemini Hauptweg. Rollback `brain_v2: false` stellt das wieder her — **nicht der Live-Default**.

Parser und Director wählen Geräte. Das Hirn formuliert, erfindet keine Tool-Zahlen. Ein Zug = ein Domänen-Agent; kein LLM-Schwarm.

| Aspekt | Entscheidung |
|--------|----------------|
| Gesprächsform | Text-Chat (Typ A: Chat-Mensch) |
| Denk-Engine **jetzt** | Groq primär, Gemini Spezialist, 0,5B zuletzt |
| Denk-Engine historisch Sprint 1 | Lokales LLM über **Ollama** — entfallen ab `0.13` |
| Modell-Host lokal | wllama / llama.cpp WASM, Qwen2.5-0.5B-Instruct Q4 (~470 MB) |
| Laufzeit MVP | Entwicklungsrechner: **Windows, 16 GB RAM, NVIDIA RTX 3060** |
| Qualitäts-/Speed-Priorität | **Qualität > Rohgeschwindigkeit**; so schnell wie möglich, Speed-Feintuning später |
| Chat-Persistenz MVP | **Gespräche zwischen Sessions speichern** |
| Sicherheit | Keys nur auf dem Gerät; kein Key in der APK; At-rest-Encryption zurückgestellt |
| Laufzeit `0.13.x`+ | Android-APK, llama.cpp WASM on-device |
| Stimme | **Code `1.5`+:** TTS liest denselben Text (Gemini-Stimme Algieba) |
| Handy | Die App **ist** Jarvis; Sideload, kein Store |
| UI-Kanal | Web-UI in Capacitor; kein Telegram |
| UI-Look | **Spotify dunkel** (Schwarz/Grün) + **ChatGPT** (Layout/Buttons/Chat-Struktur) |
| UI-Motion | **Code `1.13.0`:** Chrome fest, Chat scrollt; Bühne `6.50` 30 fps |
| Chat-Organisation | mehrere Chats + Liste + „Neues Gespräch“ |
| Kontext / Erinnern | In-Chat inkl. Wiederöffnen; Memory-Tools on-device |
| Backend | On-Device TypeScript; kein Server |
| Version `0.1.0` | = **MVP** (Sprint-1-Abnahme) |
| Version `0.13.0` | = **On-Device Handy** |
| Version `6.50.0` | = Gemini Hauptweg + Bühne (historisch) |
| Version `15.1.0` | = Groq primär (Dual Brain) |
| Version `18.14.2` | = aktueller App-Code und Sideload |
| Version `6.60.0` | = Split, Overlay, Parser (historischer Sideload) |

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
   • Persona / Memory / Tools / Guards / Parser
   • primaryChatModel: Groq → Gemini Spezialist → 0,5B
        │
        ▼
[IndexedDB + localStorage auf dem Gerät]
```

### Baustein-Erklärung (für Amateure)

| Baustein | Einfach gesagt |
|----------|----------------|
| **Chat-UI** | Das Fenster, in dem du tippst und Antworten liest. |
| **Parser / Register** | Wählen das Gerät (Timer, Kugel, SMS, …), nicht das LLM. |
| **Hirn** | Groq mit Key, Gemini für Sehen/Deep, sonst 0,5B. Formuliert, wählt keine Tools. |
| **Kurzzeitgedächtnis** | Die letzten Nachrichten werden mitgeschickt, damit Jarvis dem Gespräch folgen kann. |
| **TTS** | Wandelt Jarvis’ Text in gesprochene Sprache um — ohne das Denkmodell zu ersetzen. |

## Prinzipien

1. **Eine Denk-Quelle pro Turn** — `primaryChatModel` / ein Brain-Slot, keine heimliche zweite KI. Default: Groq zuerst.
2. **Persona sitzt in der Engine** — Nicht „hoffentlich antwortet das Modell nett“, sondern feste Regeln.
3. **Ausgabe ≠ Intelligenz** — TTS ist nur Stimme für vorhandenen Text.
4. **Netzwerk hart machen** — Fernzugriff erst mit Auth; PC-Token im WLAN.
5. **Keys lokal** — Gemini/Groq-Keys in `localStorage`, Hausstand-Export vor Deinstall.

## Datenschutz & Sicherheit (Architektur-Regeln)

- Chats, Memory, Keys bleiben auf dem Gerät.
- Cloud-Hirn nur mit **deinem** Key (Groq primär, Gemini Spezialist). Kein Key in der APK.
- 0,5B geht nicht ins Netz; Gemini/Groq-Chat schon — Overlay und Banner sagen das.
- Keine unnötigen Drittanbieter-Telemetrie-Abhängigkeiten in der UI.
- MVP speichert nur, was für Smalltalk und Haus-Tools nötig ist.

## Bewusst offene Technikdetails

Geklärt in späteren Docs; Rest in `08-open-questions.md`:

- LocateAnything-Gewichte am PC (`4.77` 3060-GO)
- Debug-Hintergrund-Service `5.12`
- At-rest-Encryption

Historische Sprint-1-Offenheiten (Ollama, NAS-Host) sind **superseded**.
