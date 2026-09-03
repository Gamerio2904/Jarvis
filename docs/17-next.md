# 17 — Nächste Versionen (`1.1`–`1.6`)

PO 2026-08-15: Erinnerungen, Ort/Wetter, Kalender-GUI, Sound-Fix, Research-Quellen, danach **Sprachmodus** wie ChatGPT. Wake-Word extra klären.

> Historisch `1.1`–`1.6` **CODE**. **Jetzt:** Code **`9.10.0`**. Sideload **`9.10.0`**. Hirn Gemini zuerst.

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

## Danach

`1.7`–`1.13.2` sind **CODE** — [`18-next.md`](./18-next.md).  
Als Nächstes `1.14`–`1.20` — [`19-next.md`](./19-next.md).

Kurz `1.7`–`1.11` (historisch):

| Version | Inhalt | Status |
|---------|--------|--------|
| **`1.7.0`** | Timer + Klingeln (Bildschirm aus, Akku an) | **CODE** |
| **`1.8.0`** | Wiederkehrende Erinnerungen | **CODE** |
| **`1.9.0`** | Wetter-Nachfragen („und morgen?“) | **CODE** |
| **`1.10.0`** | Homescreen-Widget | **CODE** |
| **`1.11.0`** | Wake-Word (Handy an, Screen darf aus) | **CODE** |

Morgenlage, Pollen, größeres Offline-Modell: später, nicht in dieser Reihe.

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
