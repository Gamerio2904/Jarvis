# TEST 18.10 — TV-Wahrheit, Hören, Mund, Observe

Nach Execute von [`76-next.md`](./76-next.md). App-Code **`18.10.0`**,
versionCode `181000`. Sideload bleibt **`18.9.8`**, bis die APK `18.10.0`
gebaut ist. Planname war `18.5` — nicht als `18.5.0` installieren.

Gerät-PO der neuen APK erst nach Sideload `18.10.0`.

## 1. Version

Einstellungen / Hilfe nennt **`18.10.0`**. Nicht `18.5.0`, nicht unter `18.9.8`.

## 2. Fernseher an — beobachtet

Einstellungen → Fernseher an, suchen, koppeln. TV aus, gleiches WLAN.

`Fernseher an`

Erwartung: entweder **„Fernseher ist an.“** nach Poll, oder ehrlich
**„Magic-Packet ist raus, der TV antwortet nicht“** plus WOL-Hinweis.
Kein dritter Fall „gesendet“ als Erfolg.

## 3. Hören

`fanseher an` / `Mach den Fernseher an` → Parser **tv**, nicht Film.
Flugmodus: Android-STT allein. Mit Groq-Key: undeutlich darf die zweite Bahn
nachbessern, Timeout 1,5 s lässt Google stehen.

## 4. Mund

Sprachmodus: „Wie wird das Wetter?“ — erstes Wort über Edge (Conrad/Katja),
nicht 3 s Stille auf Algieba. Ein Befehl = ein Satz. Erklärung = 2–3 Sätze.

## 5. Working Memory

Nach „Fernseher an“: `Was war zuletzt am Fernseher?` / `Woran haben wir am
Fernseher zuletzt gedreht?` trifft die Zeile (`tv: an, beobachtet 200` oder
`tv: wol ohne Antwort`). Kein erfundener HDMI-Film.

## 6. Knowledge-Allowlist

Film/Watchliste/Kalender dürfen Packs sehen. `Fernseher an` startet kein
Pack-Essay und keinen Research-Agenten.

## 7. Settings-Copy

Fernseher-Karte nennt **Power On with Mobile**, gleiches WLAN, Ethernet-WoL.
Piper/Kokoro „fehlt“, nicht als fertig anbieten.
