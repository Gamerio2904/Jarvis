# 17 — Nächste Versionen (`1.1`–`1.5`)

PO 2026-08-15: Erinnerungen, Ort/Wetter, Kalender-GUI, Sound-Fix, Research-Quellen, danach **Sprachmodus** wie ChatGPT. Wake-Word extra klären.

Kein Alles-in-einem-Wurf. Jede Stufe ist sideloadbar.

## Reihenfolge

| Version | Inhalt | Warum getrennt |
|---------|--------|----------------|
| **`1.1.0`** | UI-Sound wirklich hörbar · Research-Quellen unter der Antwort + Audit | Zwei Bugs aus dem Handtest; kein neues Feature-Risiko |
| **`1.2.0`** | Erinnerungen mit Uhrzeit (Chat + Notification) | Braucht Android-Rechte, eigenen Speicher |
| **`1.3.0`** | Ort + Wetter („heute hier“) | Braucht Standort-Recht + Research |
| **`1.4.0`** | Kalender mit eigener GUI (lokal, kein Google-Login) | Eigene Screens, ICS/manuell |
| **`1.5.0`** | **Riesenupdate:** Sprachmodus (Gespräch, kein Diktat-File) + Homescreen-Shortcut | Mikrofon, TTS, Deep-Link |

Optional danach: Wake-Word nur bei **eingeschaltetem** Handy (Screen darf aus sein). Nicht in `1.5` zwingend.

## Wake-Word bei „Handy aus“

| Zustand | Möglich? |
|---------|----------|
| Akku aus / Gerät komplett aus | **Nein.** Kein Mikrofon, kein Prozess. |
| Screen aus, Handy an (Standby) | **Eingeschränkt ja.** Native Vordergrund-Dienst + Hotword, Akku, OEM killt oft Background-Mics. Nie so zuverlässig wie Alexa/Google. |
| App offen / Sperrbildschirm mit Kachel | **Ja.** Das ist der realistische Weg. |

ChatGPT-Sprachmodus ist **kein** Wake-Word. Tippen → sprechen → Jarvis antwortet mit Stimme → Sie sprechen weiter. Keine Aufnahme-Datei, die man hinterher abspielt.

Homescreen-Shortcut `1.5`: Icon „Jarvis hören“ öffnet direkt den Sprachmodus (Deep-Link), ohne durch den Textchat zu wühlen.

## Won’t in dieser Reihe

Play Store, Mail, Alexa, Fire TV, iOS, Cloud-Kalender-OAuth, Jarvis bei **ausgeschaltetem** Gerät.

## Abnahme je Stufe

Sideload `Jarvis.apk`, versionName stimmt, eine klare Probe (unten in den Sprints).
