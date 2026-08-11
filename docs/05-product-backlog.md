# 05 — Product Backlog

Priorisiertes Backlog. IDs stabil halten; Status aktualisieren.

**Status-Legende:** `idea` · `ready` · `in_sprint` · `done` · `parked`

**MoSCoW:** Must / Should / Could / Won’t (für aktuellen Horizont)

---

## Epics

| ID | Epic | Phase | Kurzbeschreibung |
|----|------|-------|------------------|
| E0 | Persona & Gesprächsqualität | 0–1 | Charakter, Stil, Abnahmekriterien Smalltalk |
| E1 | Local Runtime | 1 | Modell-Host + Modell lokal betreiben |
| E2 | Jarvis Core Chat | 1 | Backend, Persona-Injection, Kurzgedächtnis, API |
| E3 | Chat UI | 1–2 | Einfache Web-UI, mobil nutzbar |
| E4 | Private Access | 2 | Handy-Zugang, Auth, Netz |
| E5 | Always-On Ops | 3 | NAS, Autostart, Backup |
| E6 | Voice Out | 4 | TTS-Vorlesen |
| E7 | Assistant Capabilities | 5+ | Gedächtnis, Tools (später) |

---

## User Stories

### E0 — Persona & Gesprächsqualität

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S0.1 | Als PO will ich Ton, Tabus und Anti-KI-Regeln schriftlich haben, damit Antworten steuerbar sind. | Must | done | `07-persona.md` Kern gesetzt (Runde 1) |
| S0.2 | Als PO will ich Soll/Nicht-Soll-Stilanker (nicht feste Strings), damit Abnahme und Variation klappen. | Must | done | `07` Beispiele als grobe Vorgabe + Anti-Template |
| S0.3 | Als Nutzer will ich kurze Messenger-artige Antworten, keine Essays. | Must | idea | Durchschnittlich kurz; keine Listen-Manie |
| S0.4 | Als Nutzer will ich, dass Jarvis gelegentlich Rückfragen stellt, ohne jedes Mal zu „coachen“. | Should | idea | Rückfragen dosiert in Tests |
| S0.5 | Als Nutzer will ich, dass Jarvis mich „Master“/„Sir“ nennt — selten, situativ, Sie/ohne Du. | Must | ready | Regeln in `07` gesetzt |

### E1 — Local Runtime

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S1.1 | Als Dev will ich einen lokalen Modell-Host installiert haben, damit Inference ohne Cloud läuft. | Must | idea | Host antwortet auf Testprompt lokal |
| S1.2 | Als Dev will ich ein für Smalltalk geeignetes Modell wählen, das auf der Hardware läuft. | Must | idea | Latenz & Qualität vom PO ok für MVP |
| S1.3 | Als Nutzer will ich erkennen, wenn das Modell nicht erreichbar ist (klare Fehlermeldung). | Should | idea | UI/Backend zeigt verständlichen Fehler |

### E2 — Jarvis Core Chat

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S2.1 | Als Nutzer will ich Nachrichten senden und Jarvis-Antworten erhalten. | Must | idea | Request/Response-Pfad funktioniert |
| S2.2 | Als Nutzer will ich, dass jede Antwort die Jarvis-Persona nutzt. | Must | idea | System-Prompt/Regeln aktiv |
| S2.3 | Als Nutzer will ich, dass Jarvis die letzten Nachrichten im Gespräch kennt. | Must | idea | Kontext der letzten N Turns sichtbar im Verhalten |
| S2.4 | Als PO will ich Persona-Text ändern können, ohne Code-Umweg zu brauchen (Config-Datei reicht). | Should | idea | Persona aus Datei/Config geladen |
| S2.5 | Als Nutzer will ich Chatverläufe zwischen Sessions wiedersehen. | Must | idea | Persistenz laut Q11 |
| S2.6 | Als Nutzer will ich gespeicherte Chats löschen können. | Should | idea | hängt an Q12 |

### E3 — Chat UI

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S3.1 | Als Nutzer will ich eine einfache Chat-Oberfläche im Browser. | Must | idea | Senden/Empfangen sichtbar |
| S3.2 | Als Nutzer will ich die UI auf dem Handy-Browser bedienen können. | Must | idea | Nutzbar auf schmalem Viewport |
| S3.3 | Als Nutzer will ich sehen, dass Jarvis „gerade schreibt“ / lädt. | Could | idea | Loading-Indikator vorhanden |
| S3.4 | Als Nutzer will ich langfristig eine extrem smoothe, moderne Premium-Web-UI. | Should (Gesamtprojekt) | idea | Spotify-Farben + ChatGPT-Layout |
| S3.5 | Als Nutzer will ich mehrere Chats, eine Liste und „Neues Gespräch“. | Must (Zielbild) | idea | MVP darf schlank sein, Architektur ausbaufähig |
| S3.6 | Als Nutzer will ich später ein GUI-Update mit premium Motion. | Should (später) | parked | Nach Light-MVP eigenes MINOR |
| S2.7 | Als Nutzer will ich, dass Jarvis Gesprächskontext versteht und später stärker erinnert. | Must (gestuft) | idea | MVP: In-Chat-Kontext; Ausbau später (Q35) |

### E4 — Private Access

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S4.1 | Als Nutzer will ich vom Handy im privaten Setup auf Jarvis zugreifen. | Must (Phase 2) | parked | Erreichbar laut gewähltem Netz-Setup |
| S4.2 | Als Nutzer will ich, dass Fremde ohne Zugang nicht chatten können. | Must (Phase 2) | parked | Auth greift |
| S4.3 | Als Nutzer will ich keine ungeschützt öffentlichen Ports als Default. | Must (Phase 2) | parked | Doku/Setup folgt Härte-Regel |

### E5 — Always-On Ops

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S5.1 | Als Nutzer will ich Jarvis 24/7 auf NAS/Mini-Server. | Must (Phase 3) | parked | Dienst überlebt Reboot |
| S5.2 | Als Nutzer will ich Config/Chats backupbar haben. | Should (Phase 3) | parked | Backup-Pfad dokumentiert/automatisiert |

### E6 — Voice Out

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S6.1 | Als Nutzer will ich Jarvis’ Textantwort vorlesen lassen. | Won’t (jetzt) | parked | TTS auf PO-Kommando; gleicher Text |
| S6.2 | Als Nutzer will ich eine Stimme, die zum Charakter passt. | Won’t (jetzt) | parked | PO-Abnahme Stimme |

### E7 — Assistant Capabilities (Won’t im aktuellen Horizont)

| ID | Story | MoSCoW | Status |
|----|-------|--------|--------|
| S7.1 | Langzeitgedächtnis über Sessions | Won’t | parked |
| S7.2 | Kalender/Mail/Smart-Home-Tools | Won’t | parked |
| S7.3 | Native Store-App | Won’t | parked |

---

## Aktuelle Prioritätsreihenfolge (Pull-Reihenfolge)

1. S0.1 / S0.5 (Persona — Kern done) → S0.2 (Beispiele)
2. S1.1 → S1.2 (Runtime + ausgewogenes Modell; nach Q32-Bestätigung)
3. S2.1 → S2.2 → S2.3 → S2.5 (Core + Persistenz)
4. S3.1 → S3.2 (Web-UI; von Anfang an Richtung Premium denkbar, Feinschliff über Sprints)
5. S0.3 / S0.4 (Qualitätsfeinschliff)
6. Danach Phase-2-Stories; S2.6 Löschen später

## Parking Lot (Ideen, nicht geplant)

- Mehrere Jarvis-„Stimmungen“ / Modi
- Export der Chat-History
- Komplett offline ohne jegliche Modell-Downloads nach Initial-Setup (Policy später)
