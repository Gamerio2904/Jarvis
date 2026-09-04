# 02 — Architektur

> **Jetzt:** Code **`13.31.0`**. Sideload **`13.31.0`**. **Hirn:** Gemini (Key) Hauptweg → Groq Backup → 0,5B letzter Fallback. Parser zuerst. Cloud-Prompt: Persona vorn (Cache), Memory am User-Turn [`52-research-latency-quality.md`](./52-research-latency-quality.md). Stabilität V1–V9 [`51-phase0-audit.md`](./51-phase0-audit.md). Screenshot-Fixes [`53-next.md`](./53-next.md). Rest final [`54-next.md`](./54-next.md) **CODE**. Alltag-Router [`50-next.md`](./50-next.md) **CODE**. Memory-10 [`56-next.md`](./56-next.md) **CODE**. Intensiv [`57-next.md`](./57-next.md) **CODE**. Fachwissen [`58-next.md`](./58-next.md) **CODE** `11.60.0`. Flächen [`59-next.md`](./59-next.md) **CODE** `12.70.0`. Gerät-PO [`55-next.md`](./55-next.md).

## Leitentscheidung

**Gerät = Handy.** Jarvis denkt auf dem Telefon. Der PC ist Werkzeug (`JarvisPC.bat`), kein zweites Hirn. Capability-Levels (`9.2`): der Agent wirbt, was er kann. Unbekanntes Starten erst nach Ja. JPEG ist kein Klick-Beweis. Live (`9.3`): LAN-Einzelbilder; WebRTC nur wenn der Peer steht. Kein TURN. Hardening (`9.9`): PC nur LAN, Keys nicht im Chat.

**Denk-Kaskade (`6.50`+, Overlay `6.53` in `6.60`):**

1. **Gemini** — sobald Toggle + API-Key in Einstellungen → Cloud (`geminiReady`)
2. **Groq** — eigener Key, wenn Gemini fehlt oder tot
3. **0,5B Qwen** (wllama) — letzter Fallback, nie als Claude verkaufen
4. sonst ehrlich: Tools ohne Modell, Overlay „Fertig — Tools ohne Modell“

Parser wählen Geräte. Das Hirn formuliert, erfindet keine Tool-Zahlen.

| Aspekt | Entscheidung |
|--------|----------------|
| Gesprächsform | Text-Chat (Typ A: Chat-Mensch) |
| Denk-Engine **jetzt** | Gemini Hauptweg, Groq Backup, 0,5B zuletzt |
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
| Version `6.50.0` | = Gemini Hauptweg + Bühne |
| Version `9.9.0` | = aktueller App-Code und Sideload (V1–V9) |
| Version `6.60.0` | = voriger Sideload (Split, Overlay, Parser) |

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
   • pickBrain: Gemini → Groq → 0,5B
        │
        ▼
[IndexedDB + localStorage auf dem Gerät]
```

### Baustein-Erklärung (für Amateure)

| Baustein | Einfach gesagt |
|----------|----------------|
| **Chat-UI** | Das Fenster, in dem du tippst und Antworten liest. |
| **Parser / Register** | Wählen das Gerät (Timer, Kugel, SMS, …), nicht das LLM. |
| **Hirn** | Gemini mit Key, sonst Groq, sonst 0,5B. Formuliert, wählt keine Tools. |
| **Kurzzeitgedächtnis** | Die letzten Nachrichten werden mitgeschickt, damit Jarvis dem Gespräch folgen kann. |
| **TTS** | Wandelt Jarvis’ Text in gesprochene Sprache um — ohne das Denkmodell zu ersetzen. |

## Prinzipien

1. **Eine Denk-Quelle pro Turn** — `pickBrain`, keine heimliche zweite KI. Reihenfolge bewusst: Gemini zuerst.
2. **Persona sitzt in der Engine** — Nicht „hoffentlich antwortet das Modell nett“, sondern feste Regeln.
3. **Ausgabe ≠ Intelligenz** — TTS ist nur Stimme für vorhandenen Text.
4. **Netzwerk hart machen** — Fernzugriff erst mit Auth; PC-Token im WLAN.
5. **Keys lokal** — Gemini/Groq-Keys in `localStorage`, Hausstand-Export vor Deinstall.

## Datenschutz & Sicherheit (Architektur-Regeln)

- Chats, Memory, Keys bleiben auf dem Gerät.
- Cloud-Hirn nur mit **deinem** Key (Gemini Hauptweg, Groq Backup). Kein Key in der APK.
- 0,5B geht nicht ins Netz; Gemini/Groq-Chat schon — Overlay und Banner sagen das.
- Keine unnötigen Drittanbieter-Telemetrie-Abhängigkeiten in der UI.
- MVP speichert nur, was für Smalltalk und Haus-Tools nötig ist.

## Bewusst offene Technikdetails

Geklärt in späteren Docs; Rest in `08-open-questions.md`:

- LocateAnything-Gewichte am PC (`4.77` 3060-GO)
- Debug-Hintergrund-Service `5.12`
- At-rest-Encryption

Historische Sprint-1-Offenheiten (Ollama, NAS-Host) sind **superseded**.
