# 18 — Nächste Versionen (`1.7`–`1.11`)

PO 2026-08-15: Timer der **klingelt** (Bildschirm aus, Akku an), wiederkehrende Erinnerungen, Wetter-Nachfragen, Homescreen-Widget, Wake-Word.

Kein Alles-in-einem-Wurf. Jede Stufe ist sideloadbar. Reihenfolge ist fest: erst Alarm-Infrastruktur, dann alles was darauf aufbaut.

## Was „Handy aus“ hier heißt

| Zustand | Timer klingelt? | Wake-Word? |
|---------|-----------------|------------|
| Akku leer / Gerät komplett aus | **Nein.** Kein Prozess, kein Lautsprecher. | **Nein.** |
| Bildschirm aus, Akku drin, Standby | **Ja — Ziel von `1.7`.** Wecker weckt das Gerät. | **Eingeschränkt** (`1.11`): Vordergrund-Dienst + Mikro, Akku, OEM killt oft. |
| App offen oder Sperrbildschirm | Ja | Ja, am zuverlässigsten |

„Klingeln bei Bildschirm aus“ ist ein **Wecker**, kein Dauer-Zuhören.  
„Jarvis“ sagen bei Bildschirm aus ist **Wake-Word** — extra Version, extra Akku, extra Rechte.

Erinnerungen aus `1.2` zeigen heute nur eine stille/hohe Notification. Das reicht nicht als Küchenwecker.

## Reihenfolge

| Version | Inhalt | Warum getrennt |
|---------|--------|----------------|
| **`1.7.0`** | **Timer + Klingeln** — **CODE** | Wecker, Bildschirm aus |
| **`1.8.0`** | **Wiederkehrend** — **CODE** | Serie nach dem Klingeln |
| **`1.9.0`** | **Wetter-Nachfragen** — **CODE** | „und morgen?“ |
| **`1.10.0`** | **Homescreen-Widget** — **CODE** | Timer + Wetterzeile |
| **`1.11.0`** | **Wake-Word** — **CODE** | Opt-in, Handy an |
| **`1.12.0`** | **Wecker + eigener Ton** — **CODE** | Einmal oder täglich, Tonwahl |

Sprints: [`sprint-57`](./sprints/sprint-57.md) … [`sprint-61`](./sprints/sprint-61.md).

## Abnahme je Stufe

Sideload `Jarvis.apk`, versionName stimmt, eine klare Probe im Sprint.

## Won’t in dieser Reihe

Gerät komplett aus, Play Store, iOS, Google-Kalender-OAuth, Alexa-Qualität beim Wake-Word, Tracking im Hintergrund außer dem sichtbaren Wake-Word-Dienst.
