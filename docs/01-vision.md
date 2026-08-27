# 01 — Vision & Produktziele

> **Stand Code `3.18.1`:** On-Device-APK, 0,5B oder Gemini Opt-in, Haus-Tools, Lage. Live-Ton: **Siezen**. Nächste Pläne: [`35-next.md`](./35-next.md)–[`38-next.md`](./38-next.md). Kalender-Fenster: [`34-next.md`](./34-next.md) (`3.19.0` mergen).

## Vision

Jarvis ist dein **privater Personal Assistant**. Er soll sich im Alltag wie ein verlässlicher Chat-Gegenüber anfühlen — mit Charakter, nicht wie eine generische KI-Demo.

Er wird **nicht vermarktet** und ist **nicht für die Öffentlichkeit** gedacht. Privatsphäre und Kontrolle über die eigenen Daten haben Vorrang vor maximaler Modellleistung aus der Cloud.

## Produktprinzipien

1. **Privat by design** — Denken und Speichern möglichst nur auf eigener Hardware.
2. **Menschlich wirken, nicht Menschen imitieren** — Ziel ist ein realistisches Gefühl für dich, kein Deepfake-Mensch.
3. **Chat first** — Messenger-Gefühl. Stimme ist da (`1.5`+), Text bleibt Quelle.
4. **Charakter vor Features** — Ton fest (Siezen im Code), dann neue Alltags-Tools.
5. **Kern vor Breite** — Lieber ein ehrlicher Router als ein größeres Modell vortäuschen.
6. **UI-Qualität als Produktstandard** — Extrem hochwertige, smoothe Web-GUI. Referenz: **Spotify dunkel** (Farbe/Atmosphäre), **ChatGPT** (Chat-Layout/Buttons). Motion im MVP light, später GUI-Update.
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
| Versionierung | `0.1.0` = MVP; `0.13.0` = On-Device; `1.0.0` = späterer MAJOR |
| Stimme später | Realistisches Vorlesen derselben Antworten, auf dein Kommando. |
| Premium-Web-UI | Spotify-**Dunkel** + ChatGPT-Layout; Motion light → späteres GUI-Update |
| Versionierung | `0.1.0` = MVP; `0.10.x` = NAS+APK; `0.11.x` = Samsung-TV; `1.0.0` = späterer MAJOR |

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

## Erfolgskriterium jetzt (Planungsstand)

Die Planung ist so klar, dass Sprint 1 (lokaler Smalltalk) ohne Architektur-Umentscheidung starten kann.
