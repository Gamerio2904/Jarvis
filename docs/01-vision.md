# 01 — Vision & Produktziele

## Vision

Jarvis ist dein **privater Personal Assistant**. Er soll sich im Alltag wie ein verlässlicher Chat-Gegenüber anfühlen — mit Charakter, nicht wie eine generische KI-Demo.

Er wird **nicht vermarktet** und ist **nicht für die Öffentlichkeit** gedacht. Privatsphäre und Kontrolle über die eigenen Daten haben Vorrang vor maximaler Modellleistung aus der Cloud.

## Produktprinzipien

1. **Privat by design** — Denken und Speichern möglichst nur auf eigener Hardware.
2. **Menschlich wirken, nicht Menschen imitieren** — Ziel ist ein realistisches Gefühl für dich, kein Deepfake-Mensch.
3. **Chat first** — Architektur-Gefühl Typ A (Messenger-Freund). Stimme kommt später als Vorlesen des Textes.
4. **Charakter vor Features** — Erst Smalltalk & Persona, dann Assistenten-Fähigkeiten.
5. **Kern vor Breite** — Lieber ein stabiler lokaler Chat als früh Kalender, Tools und App-Store.
6. **UI-Qualität als Produktstandard** — Extrem hochwertige, smoothe Web-GUI. Referenz: **Spotify dunkel** (Farbe/Atmosphäre), **ChatGPT** (Chat-Layout/Buttons). Motion im MVP light, später GUI-Update.
7. **Versionierung** — Jedes Sprint-Ziel und jeder Nachzieher ist einer Version zugeordnet (`09-versioning.md`).
8. **Lebendigkeit** — Kein Template-Bot: Antworten variieren, Kontext nutzen; Stil-Beispiele nur als grobe Vorgabe.

## Ziele (Outcome)

| Ziel | Bedeutung |
|------|-----------|
| Alltags-Smalltalk | Jarvis führt natürliche Kurzgespräche (Hallo, Wie geht’s, …). |
| Charakterfestigkeit | Gleicher Ton über Tage; erkennbar „dein“ Jarvis (Kumpel + frech, „Master“, nur Deutsch). |
| Lokale Kontrolle | Kein Cloud-LLM als Denk-Engine. |
| Handy-Nutzbarkeit | Am Ende vom Handy aus nutzbar (zuerst Browser/Netz, nicht zwingend Native App). |
| 24/7 später | Dauerbetrieb auf NAS/Mini-Server, wenn der Stack steht. |
| Stimme später | Realistisches Vorlesen derselben Antworten, auf dein Kommando. |
| Premium-Web-UI | Spotify-**Dunkel** + ChatGPT-Layout; Motion light → späteres GUI-Update |
| Versionierung | `0.1.0` = MVP; `1.0.0` = NAS; Patches als `x.y.z` Zwischenversionen |

## Nicht-Ziele (aktuell)

- Öffentliche Nutzer, Marketing, Multi-User-Accounts
- Native App als MVP
- Cloud-LLM als primäre Intelligenz
- Tools (Mail, Kalender, Smart Home, Web-Agent) im MVP
- Langzeitgedächtnis / „kennt mein ganzes Leben“ im MVP
- Stimme/TTS im MVP
- Perfekte Menschen-Imitation
- Chat-Löschen im Sprint 1 (kommt später)

## Erfolgskriterium Gesamtprodukt (langfristig)

Du nutzt Jarvis regelmäßig vom Handy aus für Gespräch & später Hilfe — mit dem Gefühl: *das ist meiner*, und die Daten bleiben in deinem Bereich.

## Erfolgskriterium jetzt (Planungsstand)

Die Planung ist so klar, dass Sprint 1 (lokaler Smalltalk) ohne Architektur-Umentscheidung starten kann.
