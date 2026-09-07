# Jarvis PC — was Sie am Rechner tun

Das Handy denkt. Der PC ist nur ein Werkzeug **oder ein Fenster**. **Das Fenster `JarvisPC.bat` muss offen bleiben**, solange Jarvis den Rechner steuern soll.

| Schicht | Port | Rolle |
|---------|------|--------|
| **Werkzeug** | `:18790` | Screenshot, Klick, Launch. Unverändert. |
| **Fenster** | Handy `:18791` | Verlauf lesen, Zeile senden. Knopf **Jarvis-Fenster** öffnet `jarvis-window.html`. |

Ohne laufendes Handy-Hirn: „Handy nicht im WLAN / Presence aus“ — kein Fake-Chat. Kein zweites Gedächtnis auf Disk.

## Einmal einrichten — QR

1. Im Jarvis-Ordner `desktop\JarvisPC.bat` **doppelklicken**. Ein Fenster „Jarvis PC“ bleibt stehen. Die schwarze Konsole darf zu, das **graue Fenster** nicht.
2. Im grauen Fenster **QR-Code öffnen**. Es geht ein weißes Quadrat im Browser auf.
3. Handy: Jarvis → Einstellungen → **Geräte** → **QR scannen**. Kamera auf den Code. Fertig wenn das Handy „PC-App erreicht“ sagt **und** im PC-Fenster kurz „Handy …“ / „Anfrage von …“ steht.
4. Windows: WLAN-Profil **Privat**. Beim gelben Firewall-Hinweis **Zulassen**, oder im Jarvis-PC-Fenster **Firewall erlauben**.
5. Handy und PC im **gleichen WLAN**, nicht Gäste-WLAN, nicht Mobilfunk.

Ohne Kamera: IP (192.168… oder 10…), Port `18790` und Token aus dem grauen Fenster von Hand eintragen, dann **PC testen**.

## Testen (Chat)

- `PC QR scannen` — öffnet den Scanner
- `PC testen`
- `PC live` / `Live aus` (LAN-Einzelbilder; WebRTC nur wenn der Peer steht)
- `Was siehst du auf dem PC` (Screenshot; Vorlesen braucht Gemini; lokal geplant [`docs/41-next.md`](../docs/41-next.md))
- `klick Mitte` / `Maus nach rechts`
- `Zeig Ordner Downloads`
- `FIFA starten` (nur wenn im Startmenü)
- `Welche Route nimmt google.de` (`tracert` am PC)

Löschen von Ordnern erst nach **Ja**. Unbekannte Programme (nicht FIFA) erst nach **Ja**. Klick heißt „gesendet“, nicht „ausgeführt“ — den Schirm beweist JPEG nicht. Live ist LAN-JPEG, kein erfundener WebRTC-Peer.

## Wenn es „PC nicht erreicht / BAT starten“ sagt, obwohl das Fenster offen ist

Dann kommt das Handy nicht durch — nicht weil die BAT „falsch ausgefüllt“ ist (die Felder sind auf dem **Handy**).

| Check | Richtig |
|-------|---------|
| QR / IP | **QR-Code öffnen** oder die **empfohlene** IP im PC-Fenster, meist `192.168…` oder `10…`. **Nicht** `172…` (WSL) und nicht Internet. |
| Schalter | Einstellungen → PC → **an** (Scan schaltet an) |
| Gleiches Netz | PC-WLAN = Handy-WLAN, kein VPN auf einem der beiden |
| Firewall | „Firewall erlauben“ im Fenster, oder Windows-Abfrage zulassen |
| Port | 18790, nicht in die IP-Zeile (`192.168.0.10:18790` gehört nicht ins IP-Feld) |
| Fenster | „Jarvis PC“ nicht minimiert-beendet; nach Ruhezustand BAT neu starten |

Im PC-Fenster: bei einem Test muss **„Anfrage von …“** erscheinen. Bleibt dort „Warte auf das Handy“, ist IP oder Firewall falsch — Token dann egal.

## Won’t

Kein NAS, kein Python-Backend, kein erfundener Bildschirm wenn die App zu ist.

