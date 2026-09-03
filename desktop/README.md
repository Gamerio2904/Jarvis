# Jarvis PC — was Sie am Rechner tun

Das Handy denkt. Der PC ist nur ein Werkzeug **oder ein Fenster**. **Das Fenster `JarvisPC.bat` muss offen bleiben**, solange Jarvis den Rechner steuern soll.

| Schicht | Port | Rolle |
|---------|------|--------|
| **Werkzeug** | `:18790` | Screenshot, Klick, Launch. Unverändert. |
| **Fenster** | Handy `:18791` | Verlauf lesen, Zeile senden. Knopf **Jarvis-Fenster** öffnet `jarvis-window.html`. |

Ohne laufendes Handy-Hirn: „Handy nicht im WLAN / Presence aus“ — kein Fake-Chat. Kein zweites Gedächtnis auf Disk.

## Einmal einrichten

1. Im Jarvis-Ordner `desktop\JarvisPC.bat` **doppelklicken**. Ein Fenster „Jarvis PC“ bleibt stehen. Die schwarze Konsole darf zu, das **graue Fenster** nicht.
2. Im Fenster steht **IP (WLAN/LAN)** — die mit `192.168.…` oder `10.…`. **Nicht** `172.…` (oft WSL/Hyper-V) und nicht `127.0.0.1`.
3. **Token** daneben kopieren (ein Klick).
4. Windows: WLAN-Profil **Privat** (nicht Öffentlich). Beim gelben Firewall-Hinweis **Zulassen**. Oder im Jarvis-PC-Fenster **Firewall erlauben**.
5. Handy und PC im **gleichen WLAN**, nicht Gäste-WLAN, nicht Mobilfunk.
6. Handy: Jarvis → Einstellungen → **PC**
   - Schalter **PC-Steuerung an**
   - IP einfügen (nur die Zahl, ohne `http://`, ohne Port)
   - Port `18790` lassen
   - Token einfügen
   - **PC testen**

Fertig wenn das Handy sagt „PC-App erreicht“ **und** im PC-Fenster kurz „Handy …“ steht.

## Testen (Chat)

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
| Richtige IP | Die **empfohlene** im PC-Fenster, meist `192.168…` oder `10…`. **Nicht** `172…` (WSL) und nicht Internet. |
| Schalter | Einstellungen → PC → **an** |
| Gleiches Netz | PC-WLAN = Handy-WLAN, kein VPN auf einem der beiden |
| Firewall | „Firewall erlauben“ im Fenster, oder Windows-Abfrage zulassen |
| Port | 18790, nicht in die IP-Zeile (`192.168.0.10:18790` gehört nicht ins IP-Feld) |
| Fenster | „Jarvis PC“ nicht minimiert-beendet; nach Ruhezustand BAT neu starten |

Im PC-Fenster: bei einem Test muss **„Anfrage von …“** erscheinen. Bleibt dort „Warte auf das Handy“, ist IP oder Firewall falsch — Token dann egal.

## Won’t

Kein NAS, kein Python-Backend, kein erfundener Bildschirm wenn die App zu ist.
