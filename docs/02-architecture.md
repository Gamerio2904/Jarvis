# 02 — Architektur

> **Live `1.15.0`:** Denken on-device (wllama 0,5B) **oder** Gemini Opt-in. Kein Ollama, kein NAS. Stimme, Timer, Wetter, Kalender, Personenorte, Maps-Route. Weiter: [`19-next.md`](./19-next.md).

## Leitentscheidung

**Design = Variante 3 (lokal).**  
Jarvis denkt auf deiner Hardware. Cloud-LLMs sind für das Denken **nicht** vorgesehen.

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
| UI-Look | **Spotify dunkel** (Schwarz/Grün) + **ChatGPT** (Layout/Buttons/Chat-Struktur) |
| UI-Motion | **Code `1.13.0`:** Chrome fest, Chat scrollt, Motion; `prefers-reduced-motion` |
| Chat-Organisation | **Zielbild:** mehrere Chats + Liste + „Neues Gespräch“ (ChatGPT-ähnlich) |
| Kontext / Erinnern | **MVP:** In-Chat inkl. Wiederöffnen. **Später:** maximal gutes Gedächtnis & Kontextverständnis |
| Backend | Dev entscheidet pragmatisch |
| Modellklasse MVP | **Ausgewogen** |
| VRAM-Annahme | **~12 GB** (Desktop-Standard) |
| Version `0.1.0` | = **MVP** (Sprint-1-Abnahme) |
| Version `0.10.0` | = NAS Core (Compose) — **Parking** |
| Version `0.11.0` | = Samsung-TV |
| Version `0.13.0` | = **On-Device Handy** |
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
| **Backend** | Kleines Programm, das Nachrichten annimmt, Persona anwendet und ans Modell schickt. |
| **Modell-Host** | Dienst, der das KI-Modell lokal ausführt. |
| **Kurzzeitgedächtnis** | Die letzten Nachrichten werden mitgeschickt, damit Jarvis dem Gespräch folgen kann. |
| **TTS (später)** | Wandelt Jarvis’ Text in gesprochene Sprache um — ohne das Denkmodell zu ersetzen. |

## Prinzipien

1. **Eine Denk-Quelle** — Lokal. Keine heimliche Cloud-Fallback-KI ohne bewusste Entscheidung.
2. **Persona sitzt im Backend** — Nicht „hoffentlich antwortet das Modell nett“, sondern feste Regeln.
3. **Ausgabe ≠ Intelligenz** — TTS ist nur Stimme für vorhandenen Text.
4. **Netzwerk hart machen** — Fernzugriff erst mit Auth; kein ungeschützt offener Port als Default.
5. **Migration einkalkulieren** — PC-Dev und NAS-Alltag teilen dasselbe Backend; Proxy statt Compose.

## Datenschutz & Sicherheit (Architektur-Regeln)

- Chats und Persona-Dateien bleiben lokal.
- Kein Cloud-LLM fürs Denken.
- Keine unnötigen Drittanbieter-Telemetrie-Abhängigkeiten in der UI.
- Fernzugriff: Authentifizierung Pflicht.
- MVP speichert nur, was für Smalltalk nötig ist.

## Bewusst offene Technikdetails

Noch **nicht** final festgelegt (siehe `08-open-questions.md`):

- konkretes lokales Modell
- exakter Modell-Host
- Hardware-Grenzen (RAM/GPU/NAS)
- Persistenzformat (SQLite, Dateien, …)
- Auth-Verfahren für Fernzugriff

Diese Details werden vor/im Sprint 1 entschieden, ohne die Gesamtarchitektur zu ändern.

## Spätere Erweiterungen (nicht MVP)

| Erweiterung | Phase |
|-------------|-------|
| Handy APK + Owner-Token | Phase 2 → `0.10.2`–`0.10.5` |
| NAS 24/7 Compose | Phase 3 → `0.10.0`–`0.10.1` |
| TTS-Vorlesen | Phase 4 |
| Langzeitgedächtnis, Tools | Phase 5+ |
