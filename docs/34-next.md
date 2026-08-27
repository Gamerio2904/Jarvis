# 34 — Stimme, Kalender, Debug **CODE**

PO 2026-08-27: Reel [lukebuildsai](https://www.instagram.com/reel/Dcgcg5rRdKT/) plus Kalender-Screenshots, Sprachmodus-Bug, Debug in der App.

App-Code: **`3.19.0`**. Sideload zuletzt **`3.18.1`**, bis neu gebaut.

## Reel — was die KI dort tut

Caption: Agent findet ein Problem, behebt es, stört nur wenn er Zustimmung braucht — auch beim Fahren per Anruf.

| Funktion im Video | Bei uns |
|-------------------|---------|
| Selbst finden + selbst machen | **ja, Haus** — Timer, Erinnerung, Steckdose, Kalender ohne Rückfrage |
| Nur stören wenn Zustimmung | **ja** — Anruf/SMS/Löschen nachfragen |
| Anruf am Steuer | **teilweise** — `Ruf mich in …`, Stimme im Fahrmodus. Kein Retell-Mitarbeiter |
| Business-Agent, Content-Team, fremde Hotline | **Won’t** |

## Screenshots Kalender

Jahr-Übersicht mit Punkten. Chat: heute / diese Woche / nächste 3 Tage = **Tage-Fenster**, nicht die nächsten 3 Termine. `erstell einen Termin für den 5.9. 2026, 15:00 Uhr Zahnarzt` schreibt in den Kalender. Ton bleibt Siezen.

## Stimme

Ein Sprachmodus = **ein Gespräch**. `activeIdRef`, nicht jedes Mal `createConversation`. Sätze weiter streamen (Charon wenn Gemini an, sonst Android). 0,5B bleibt schwach im Plaudern — flüssig sprechen ≠ besser denken. Keine Fake-Stimmklone.

## Debug

Einstellungen → **Debug**. Kategorie (Uhr, CarPlay, Smalltalk, Kalender, …). Start: Prompt, warten, nächster. Chat herunterladen.

## Emulator + PC auf einem Bildschirm

| Wer | Was |
|-----|-----|
| Ihr Windows-PC | Emulator + `JarvisPC.bat` nebeneinander. Emulator: Host `10.0.2.2`, Port 18790, Token |
| Diese Cloud-VM | Linux. Echte WinForms-`JarvisPC` **nein**. Web-UI + Node-Stub `desktop/jarvis-pc.mjs` **ja** |

## Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`3.19.0`** | Sprachmodus ein Thread, Kalender Jahr/Fenster/erstell, Debug in Settings | **CODE** |

## Won’t

Eigenes OS. Retell/Twilio. 0,5B als Stimmenklone. Play Store. iOS.
