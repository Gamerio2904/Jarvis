# 02 — Architektur

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
| Laufzeit später | NAS / Mini-Server (24/7) |
| Stimme | Später: TTS liest denselben Text vor |
| Handy | Zuerst Web-UI im eigenen Netz; Native App kein MVP |
| UI-Kanal | **Nur Web-App** (kein Telegram o.Ä.) |
| UI-Look | **Spotify dunkel** (Schwarz/Grün) + **ChatGPT** (Layout/Buttons/Chat-Struktur) |
| UI-Motion | MVP: **Light**; später eigenes **GUI-Update** mit spürbar premium Motion |
| Chat-Organisation | **Zielbild:** mehrere Chats + Liste + „Neues Gespräch“ (ChatGPT-ähnlich) |
| Kontext / Erinnern | **MVP:** In-Chat inkl. Wiederöffnen. **Später:** maximal gutes Gedächtnis & Kontextverständnis |
| Backend | Dev entscheidet pragmatisch |
| Modellklasse MVP | **Ausgewogen** |
| VRAM-Annahme | **~12 GB** (Desktop-Standard) |
| Version `0.1.0` | = **MVP** (Sprint-1-Abnahme) |
| Version `1.0.0` | = **NAS / 24/7** |

## Logische Bausteine

```text
[Du — Handy/Browser]
        │
        │  später: eigenes Netz / VPN + Auth
        ▼
[Chat-UI]  ← mobilfreundliche Web-Oberfläche
        │
        ▼
[Jarvis-Backend (bei dir)]
   • Persona / System-Prompt
   • Stil-Regeln (Anti-KI-Sprech)
   • Kurzzeitgedächtnis (letzte N Nachrichten)
   • (später) TTS-Anbindung
        │
        ▼
[Lokaler Modell-Host]
   Ollama auf Windows-PC (RTX 3060) → später NAS
        │
        ▼
[Lokale Persistenz]
   Chat-Verläufe zwischen Sessions
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
5. **Migration einkalkulieren** — Was auf dem PC läuft, soll später auf NAS umziehbar sein (Container/Compose anstreben).

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
| Handy im eigenen Netz + VPN | Phase 2 |
| NAS 24/7 | Phase 3 |
| TTS-Vorlesen | Phase 4 |
| Langzeitgedächtnis, Tools | Phase 5+ |
