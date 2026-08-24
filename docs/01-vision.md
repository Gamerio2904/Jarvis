# 01 — Vision & Produktziele

> **Stand Code `2.29.0`:** On-Device-APK. Live-Fähigkeiten: [`00-now.md`](./00-now.md). Ton: **Siezen**, kurz. Geliefert: [`31-next.md`](./31-next.md), [`32-next.md`](./32-next.md) (Kaufmodus, nicht Einkaufsliste), [`33-next.md`](./33-next.md).

## Vision

Jarvis ist dein **privater Personal Assistant**. Er soll sich im Alltag wie ein verlässlicher Chat-Gegenüber anfühlen — mit Charakter, nicht wie eine generische KI-Demo.

Er wird **nicht vermarktet** und ist **nicht für die Öffentlichkeit** gedacht. Privatsphäre und Kontrolle über die eigenen Daten haben Vorrang vor maximaler Modellleistung aus der Cloud.

## Produktprinzipien

1. **Privat by design** — Denken und Speichern möglichst nur auf eigener Hardware.
2. **Menschlich wirken, nicht Menschen imitieren** — Ziel ist ein realistisches Gefühl für dich, kein Deepfake-Mensch.
3. **Chat first** — Messenger-Gefühl. Stimme ist da (`1.5`+), Text bleibt Quelle.
4. **Charakter vor Features** — Ton fest (Siezen im Code), dann neue Alltags-Tools.
5. **Kern vor Breite** — Lieber ein ehrlicher Router als ein größeres Modell vortäuschen.
6. **UI-Qualität als Produktstandard** — Spotify dunkel + ChatGPT-Layout. Motion geliefert (`1.13`).
7. **Versionierung** — Jedes Sprint-Ziel und jeder Nachzieher ist einer Version zugeordnet (`09-versioning.md`).
8. **Lebendigkeit** — Kein Template-Bot: Antworten variieren, Kontext nutzen; Stil-Beispiele nur als grobe Vorgabe.

## Ziele (Outcome)

| Ziel | Bedeutung |
|------|-----------|
| Alltags-Smalltalk | Jarvis führt natürliche Kurzgespräche (Hallo, Wie geht’s, …). |
| Charakterfestigkeit | Gleicher Ton über Tage; erkennbar „dein“ Jarvis (Kumpel + frech, „Master“, nur Deutsch). |
| Lokale Kontrolle | Kein Cloud-LLM als Denk-Engine. |
| Handy-Nutzbarkeit | Sideload-APK, Modell on-device (`0.13.0`). |
| 24/7 | Handy selbst; kein NAS-LLM. |
| Versionierung | `0.1.0` MVP · `0.13` On-Device · `2.0` Haus-AI · Live `2.29.0` — [`09-versioning.md`](./09-versioning.md) |
| Stimme | TTS liest denselben Text (`1.5`+). |
| Premium-Web-UI | Spotify-**Dunkel** + ChatGPT-Layout; Motion geliefert (`1.13`). |

## Nicht-Ziele (aktuell)

- Öffentliche Nutzer, Marketing, Multi-User-Accounts
- Play Store, iOS
- Cloud-LLM als **Default** (Gemini nur Opt-in; Chat geht dann zu Google)
- ChatGPT-Qualität mit dem lokalen 0,5B
- Google-Kalender-OAuth
- Gerät komplett aus: kein Timer, kein Wake-Word, kein „zuhause“
- Perfekte Menschen-Imitation

## Erfolgskriterium Gesamtprodukt (langfristig)

Du nutzt Jarvis regelmäßig vom Handy aus für Gespräch & später Hilfe — mit dem Gefühl: *das ist meiner*, und die Daten bleiben in deinem Bereich.

## Erfolgskriterium jetzt

Sideload `2.29.0` im Alltag. Parking: Mail, Alexa, Play Store, iOS, Apple CarPlay.
