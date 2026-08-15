# 17 — Nächste Versionen (`1.1`–`1.6`)

PO 2026-08-15: Erinnerungen, Ort/Wetter, Kalender-GUI, Sound-Fix, Research-Quellen, danach **Sprachmodus** wie ChatGPT. Wake-Word extra klären.

Kein Alles-in-einem-Wurf. Jede Stufe ist sideloadbar.

## Reihenfolge

| Version | Inhalt | Warum getrennt |
|---------|--------|----------------|
| **`1.1.0`** | UI-Sound wirklich hörbar · Research-Quellen unter der Antwort + Audit | Zwei Bugs aus dem Handtest; kein neues Feature-Risiko |
| **`1.2.0`** | Erinnerungen mit Uhrzeit (Chat + Notification) — **CODE** | Braucht Android-Rechte, eigenen Speicher |
| **`1.3.0`** | Ort + Wetter („heute hier“) — **CODE** | Standort einmal, Open-Meteo, kein Raten |
| **`1.4.0`** | Kalender mit eigener GUI (lokal, kein Google-Login) — **CODE** | Monat + Chat, Daten auf dem Handy |
| **`1.5.0`** | **Riesenupdate:** Sprachmodus + Homescreen-Shortcut — **CODE** | Gespräch, kein Mitschnitt |
| **`1.5.3`** | Stimme flüssig (ganze Sätze, Betonung) — **CODE** | 1.5.2 war abgehakt, weil Mini-Schnipsel |
| **`1.6.0`** | Wetter als Lage + Tipp — **CODE** | 1.3 hat nur „18 °C, wolkig“ vorgelesen |

## Danach — Vorschlag

Eine Stufe nach der anderen, sideloadbar. Nicht alles auf einmal.

| Version | Inhalt | Warum |
|---------|--------|--------|
| **`1.7`** | **Morgenlage:** Wetter + nächste Termine + fällige Erinnerungen in einer Antwort | Das nutzt man morgens wirklich |
| **`1.8`** | **Timer:** „in 8 Minuten Nudeln“ als Kurz-Alarm, nicht nur Kalender-Erinnerung | Küche, Wäsche, Pause |
| **`1.9`** | **Wiederkehrend:** jeden Montag Steuer, jeden Morgen Tabletten | 1.2 kann nur einmalig |
| **`1.10`** | Wetter-Nachfragen: „und morgen?“, „und in Berlin?“ ohne die Frage neu zu stellen | Gespräch, nicht Kommandos |
| Optional | Homescreen-Widget (nächster Termin + kurzes Wetter) | Sichtbar ohne die App zu öffnen |
| Optional | Pollen / Luftqualität (Open-Meteo, kein Raten) | Passt zu Wetter, Allergiker |
| Optional | Größeres Offline-Modell (1.5B) | Klüger ohne Gemini, langsamer, mehr Speicher |
| Optional | Wake-Word nur bei **angeschaltetem** Handy | Nie bei Akku aus |

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
