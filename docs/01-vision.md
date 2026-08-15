# 01 — Vision & Produktziele

## Vision

Jarvis ist dein **privater Personal Assistant**. Er soll sich im Alltag wie ein verlässlicher Chat-Gegenüber anfühlen — mit Charakter, nicht wie eine generische KI-Demo.

Er wird **nicht vermarktet** und ist **nicht für die Öffentlichkeit** gedacht. Privatsphäre und Kontrolle über die eigenen Daten haben Vorrang vor maximaler Modellleistung aus der Cloud.

## Produktprinzipien

1. **Privat by design** — Denken und Speichern nur auf dem eigenen Handy.
2. **Offline im Alltag** — Nach dem einmaligen Modell-Download kein Server, keine NAS, kein Cloud-LLM.
3. **Menschlich wirken, nicht Menschen imitieren** — Ziel ist ein realistisches Gefühl für dich, kein Deepfake-Mensch.
4. **Chat first** — Architektur-Gefühl Typ A (Messenger-Freund). Stimme kommt später als Vorlesen des Textes (PO-Kommando).
5. **Charakter vor Features** — Erst Smalltalk & Persona, dann Assistenten-Fähigkeiten.
6. **Kern vor Breite** — Lieber ein stabiler lokaler Chat als früh Kalender, Smart Home und App-Store.
7. **UI-Qualität als Produktstandard** — Extrem hochwertige, smoothe GUI. Referenz: **Spotify dunkel** (Farbe/Atmosphäre), **ChatGPT** (Chat-Layout/Buttons).
8. **Versionierung** — Jedes Sprint-Ziel und jeder Nachzieher ist einer Version zugeordnet (`09-versioning.md`).
9. **Lebendigkeit** — Kein Template-Bot: Antworten variieren, Kontext nutzen; Stil-Beispiele nur als grobe Vorgabe.

## Ziele (Outcome)

| Ziel | Bedeutung |
|------|-----------|
| Alltags-Smalltalk | Jarvis führt natürliche Kurzgespräche (Hallo, Wie geht’s, …). |
| Charakterfestigkeit | Gleicher Ton über Tage; erkennbar „dein“ Jarvis (Kumpel + frech, nur Deutsch, Siezen). |
| Lokale Kontrolle | Kein Cloud-LLM als Denk-Engine. |
| Handy-Nutzbarkeit | Sideload-APK, Modell on-device (`0.13.1`). |
| Offline | Nach First-Run-Download kein Netz nötig. |
| 24/7 | Das Handy selbst — kein NAS-LLM, kein PC-Ollama. |
| Versionierung | `0.1.0` = MVP (historisch); `0.13.1` = On-Device aktuell; `1.0.0` = späterer MAJOR (PO) |
| Stimme später | Realistisches Vorlesen derselben Antworten, auf dein Kommando. |
| Premium-UI | Spotify-**Dunkel** + ChatGPT-Layout |

## Nicht-Ziele (aktuell)

- Öffentliche Nutzer, Marketing, Multi-User-Accounts
- Native Store-App / Play Store / iOS
- Cloud-LLM als primäre Intelligenz
- NAS, Docker, Python-Backend, Ollama, LAN-Proxy
- Internet-Research (App ist offline)
- Samsung-TV / Fire TV / Alexa / Mail / Kalender-OAuth
- Stimme/TTS ohne PO-Go
- Perfekte Menschen-Imitation
- 7b-Qualität wie auf der alten RTX 3060

## Erfolgskriterium Gesamtprodukt

Du nutzt Jarvis regelmäßig **vom Handy, offline**, für Gespräch & lokale Hilfe — mit dem Gefühl: *das ist meiner*, und die Daten bleiben auf dem Gerät.

## Erfolgskriterium jetzt

Sideload `0.13.1`: Modell einmal laden, App schließen/öffnen ohne erneuten Download, Chat + merken + Todos ohne Server. Details: [`13-on-device.md`](./13-on-device.md).
