# 01 — Vision & Produktziele

> **Jetzt:** Code **`6.90.0`**. Sideload **`6.90.0`**. **Hirn:** Gemini (Key) Hauptweg → Groq Backup → 0,5B letzter Fallback. Parser wählen Tools. Körper, Globus, Debug, Hausstand-Export **CODE**. Globus-Briefing `6.90` **CODE**. Live-Ton: **Siezen**. LocateAnything-Gewichte nach 3060-GO [`41-next.md`](./41-next.md).

## Vision

Jarvis ist dein **privater Personal Assistant**. Er soll sich im Alltag wie ein verlässlicher Chat-Gegenüber anfühlen — mit Charakter, nicht wie eine generische KI-Demo.

Er wird **nicht vermarktet** und ist **nicht für die Öffentlichkeit** gedacht. Privatsphäre und Kontrolle über die eigenen Daten haben Vorrang vor maximaler Modellleistung aus einer fremden Cloud ohne deinen Key.

## Produktprinzipien

1. **Privat by design** — Speicher, Tools, Keys nur auf dem Gerät. Denken über **deinen** Gemini-Key (Hauptweg), sonst Groq, zuletzt 0,5B. Kein Key in der APK.
2. **Menschlich wirken, nicht Menschen imitieren** — Ziel ist ein realistisches Gefühl für dich, kein Deepfake-Mensch.
3. **Chat first** — Messenger-Gefühl. Stimme ist da (`1.5`+), Text bleibt Quelle.
4. **Charakter vor Features** — Ton fest (Siezen im Code), dann neue Alltags-Tools.
5. **Kern vor Breite** — Lieber ein ehrlicher Router als ein größeres Modell vortäuschen. 0,5B nie als Claude verkaufen.
6. **UI-Qualität als Produktstandard** — Extrem hochwertige, smoothe Web-GUI. Referenz: **Spotify dunkel** (Farbe/Atmosphäre), **ChatGPT** (Chat-Layout/Buttons). Motion im MVP light, später GUI-Update.
7. **Versionierung** — Jedes Sprint-Ziel und jeder Nachzieher ist einer Version zugeordnet (`09-versioning.md`).
8. **Lebendigkeit** — Kein Template-Bot: Antworten variieren, Kontext nutzen; Stil-Beispiele nur als grobe Vorgabe.

## Ziele (Outcome)

| Ziel | Bedeutung |
|------|-----------|
| Alltags-Smalltalk | Jarvis führt natürliche Kurzgespräche (Hallo, Wie geht’s, …). |
| Charakterfestigkeit | Gleicher Ton über Tage; erkennbar „dein“ Jarvis (Understatement, „Master“, nur Deutsch, Siezen). |
| Lokale Kontrolle | Tools und Speicher on-device. Cloud-Hirn nur mit **deinem** Key. |
| Handy-Nutzbarkeit | Sideload-APK `6.90.0`. Overlay Gemini zuerst. |
| 24/7 | Handy selbst; kein NAS-LLM. |
| Versionierung | `0.1.0` = MVP; `0.13.0` = On-Device; `6.50` = Gemini Hauptweg; `6.90.0` = aktueller Sideload |
| Stimme | Realistisches Vorlesen derselben Antworten, auf dein Kommando (Algieba). |
| Premium-Web-UI | Spotify-**Dunkel** + ChatGPT-Layout; Bühne `6.50`+ |

## Nicht-Ziele (aktuell)

- Öffentliche Nutzer, Marketing, Multi-User-Accounts
- Play Store, iOS
- 0,5B oder Groq als ChatGPT/Claude verkaufen
- Größeres On-Device-Modell (1,5B/3B)
- Gemini-Key in der APK einbacken
- Google-Kalender-OAuth
- Gerät komplett aus: kein Timer, kein Wake-Word, kein „zuhause“
- Perfekte Menschen-Imitation

## Erfolgskriterium Gesamtprodukt

Du nutzt Jarvis regelmäßig vom Handy aus für Gespräch & Hilfe — mit dem Gefühl: *das ist meiner*. Daten und Keys bleiben in deinem Bereich. Smalltalk läuft über Gemini, sobald der Key da ist.

## Erfolgskriterium jetzt (Code `6.90.0`)

Sideload steht. Overlay fordert den Gemini-Key zuerst. Parser treffen Geräte. 0,5B ist nur Backup.
