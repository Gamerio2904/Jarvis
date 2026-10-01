# Handy verbinden, Fläche öffnen

Plan nach [`plan-vorlage.md`](./plan-vorlage.md). Dieser Stand schreibt keinen App-Code, keine Version und kein APK. Gebaut wird erst, wenn jemand `Umsetzen` sagt.

## Bedingung

Plane ein neue sFeature. mach dazu deep research im Internet. Ich möchte mein hnady per befehl verbinden. darauf kann ich dann verschiuedene dinge darauf öffnen. akkes aus der ajrvis ap wie tischplatte auf ahupt bildschirm handy zeigt lage oder erweiterung zur tischlage.

Gelesen als: Das Handy wird per Satz verbunden. Danach öffnet ein Satz eine vorhandene Jarvis-Fläche darauf. Die Tischplatte liegt auf dem Hauptbildschirm. Das Handy zeigt die Lage oder die Erweiterung der offenen Tischplatte, die Tischlage.

## Rahmen dieses Projekts

Die Rahmen der Vorlage gelten. Dazu, enger:

1. Nur dasselbe WLAN. Ein Host nur `192.168…` oder `10…`, dieselbe Regel wie `frontend/src/engine/pc-host.ts`. Kein Relais über das Internet.
2. Kein Bildschirm-Mitschnitt, kein H.264, kein WebRTC-Bild. Die Fläche zeichnet die App selbst.
3. Die Flächen sind die vorhandenen: Tischplatte auf dem Startbildschirm, Lage, Tischlage als Stand dieser Tischplatte. Kein neues Bildmodell.
4. Der Satz allein ist kein Schlüssel. Verbinden braucht einen kurzen Code und eine Zustimmung der anderen Seite.
5. Fremder Quelltext bleibt draußen. Die Quellen unten sagen, was dort steht. Sie werden nicht kopiert.

## Quellen

Gesucht, weil die Bedingung Recherche im Internet verlangt.

| Name | Adresse | Was dort steht |
|---|---|---|
| Telemachus | https://github.com/VariableThe/telemachus | Android wird ein zweiter Monitor. QR mit Token, WLAN, Bild als H.264 oder HEVC. Die Funkstrecke ist nicht verschlüsselt und nur für ein vertrautes Netz gedacht. |
| LinGlide | https://github.com/BeckhamLabsLLC/LinGlide | Das Handy ist ein zweiter Linux-Monitor im Browser. PIN, Token, H.264 über WebSocket. |
| Deskreen | https://deskreen.com/ | Browser wird zweiter Schirm, WebRTC, auch nur im lokalen WLAN. |
| VibeLink | https://github.com/IceSeaOnly/vibe_link | Handy steuert einen Mac im LAN. QR und Token. Befehle sind feste Vorgaben auf dem Rechner, keine freie Shell. |
| TVCompanion | https://github.com/avnishkirnalli/TVCompanion | Zwei Android-Apps im selben WLAN. Fund per Netzsuche, Paar-Code, TCP-Befehle. Ein Bildstrom ist ein eigener, späterer Schritt. |
| NodePilot | https://github.com/Elgeryy1/NodePilot | Gleicher LAN-Weg. Sechs Ziffern, die andere Seite sagt Ja oder Nein. Der Rechner speichert nur einen Hash des Schlüssels. Fähigkeiten je Gerät, kein Cloud-Weg. |
| phoneMonitor | https://github.com/mabyes1/phoneMonitor | Das Handy ist wahlweise Bildschirm oder eine Tafel mit festen Karten. Sechs Ziffern, der Rechner erlaubt. Die Karten sind kein Pixel-Abbild. |
| LAN-browser | https://github.com/shubh2moon-hub/LAN-browser | Zwei Geräte teilen sich Tabs über ein lokales WebSocket. Kein Mitschnitt des ganzen Schirms. |
| Lynk | https://github.com/am-will/lynk | Das Handy paart sich per Token und QR mit einem Rechner, für Sprache und Chat. Nicht, um eine App-Fläche zu öffnen. |
| Ultron-PC-Host | `frontend/src/engine/pc-host.ts` | Das Handy darf `localhost`, `192.168…` und `10…`. Nicht `172`, nicht das offene Internet, kein Hostname. |
| Dock | `frontend/src/App.tsx` | Tisch öffnet die Tischplatte auf dem Startbildschirm. Lage ist die vorhandene Lage. Beides gibt es schon. |

## Anforderungen

A1. Ein Satz öffnet auf diesem Handy die Tischplatte auf dem Hauptbildschirm. Abnahme: `Tischplatte` und `Tischplatte auf den Hauptbildschirm` zeigen die vorhandene Tischplatte, der Startbildschirm bleibt die Fläche darunter. Gateway `go`.

A2. Ein Satz öffnet auf diesem Handy die Lage oder die Tischlage. Abnahme: `Zeig die Lage` öffnet die vorhandene Lage. `Tischlage` und `Erweitere die Tischlage` zeigen Titel, Auftrag und Sprints der offenen Tischplatte in der Lage. Liegt kein Tisch, sagt der Satz das, und die Lage geht nicht auf. Gateway `go`.

A3. `Verbinde das Handy` verbindet nur im erlaubten Netz und nur mit Code und Zustimmung. Abnahme: Ohne Gegenstelle sagt der Satz, dass kein zweites Gerät da ist. Ein Host außerhalb `192.168` oder `10` wird abgelehnt. Sechs Ziffern gelten nur, wenn die andere Seite zustimmt. Der gesprochene Satz ist nicht der Schlüssel. Gateway `go`.

A4. Nach der Verbindung öffnet ein Satz dieselbe Fläche auf dem anderen Handy. Abnahme: `Tischplatte auf dem anderen Handy`, `Zeig dort die Lage` und `Erweitere dort die Tischlage` setzen dort den Stand aus A1 oder A2, so wie er beim Öffnen liegt. Reißt die Verbindung, sagt das Handy das. Es zeichnet keinen fremden Bildschirm. Gateway `go`.

## Entscheidungen

E1. Kein Bildstrom. Grund: Telemachus, LinGlide, Deskreen und VibeLink schicken Pixel. Die Bedingung will Jarvis-Flächen, und die zeichnet die App schon. phoneMonitor trennt den Bildschirm von der Kartentafel. Dieser Plan nimmt die Tafel. Gateway `go`.

E2. Verbinden ist Satz plus sechs Ziffern plus Zustimmung, im Netz aus `pc-host.ts`. Grund: NodePilot und phoneMonitor lassen die andere Seite Ja sagen, weil ein Satz im Raum mitgehört wird. Der vorhandene PC-QR bleibt für den Rechner. Dieser Kanal trägt nur den Namen einer Fläche. Gateway `go`.

E3. Drei Flächen, dieselben Zustände wie der Dock. Tischplatte heißt Startbildschirm mit offener Tischplatte. Lage heißt die vorhandene Lage. Tischlage heißt der Stand dieser Tischplatte in der Lage, kein neuer Renderer. Gateway `go`.

E4. Zuerst gelten die Sätze auf dem Handy, das sie hört. `dort` und `auf dem anderen Handy` gelten erst nach A3. Grund: Die Wörter müssen wahr sein, bevor ein zweites Gerät da ist. Gateway `go`.

## Sprints

### S1 — Sätze auf diesem Handy

Ziel: Auf diesem Handy öffnen die drei Sätze die drei Flächen, und `Verbinde das Handy` ohne Gegenstelle sagt, dass kein zweites Gerät da ist.

Anforderungen: A1, A2.

Lieferumfang:

- S1-1. Die Sätze für Tischplatte, Lage und Tischlage an die vorhandenen Flächen hängen. Fertig, wenn die Abnahme von A1 und A2 im Chat gilt. Quelle: Dock in `frontend/src/App.tsx`.
- S1-2. `Verbinde das Handy` ohne Gegenstelle antwortet ehrlich. Fertig, wenn die Antwort kein Gerät erfindet. Quelle: leer.

Gateway `go`. Go, wenn A1 und A2 einen Satz haben und der ehrliche Satz fürs Verbinden steht. No-Go, wenn ein Satz eine Fläche zeichnet, die es nicht gibt. Abbruch: der Satz gehört schon zum PC-QR oder zum Kalender, dann bleibt er dort. Hängt an A1 und A2.

Prompt: Baue nur die Sätze auf diesem Handy. Tischplatte auf den Hauptbildschirm öffnet die vorhandene Tischplatte. Zeig die Lage öffnet die vorhandene Lage. Tischlage zeigt den Stand der offenen Tischplatte in der Lage; ohne Tisch sagt der Satz, dass keiner liegt. Verbinde das Handy ohne Gegenstelle sagt, dass kein zweites Gerät da ist. Kein Socket, kein Bildstrom, kein fremdes Paket. Abbruch, wenn der Satz schon zum PC-QR oder zum Kalender gehört.

### S2 — Code im WLAN

Ziel: Zwei Ultron-Geräte teilen einen Flächen-Schlüssel im erlaubten Netz. Sechs Ziffern, die andere Seite stimmt zu, andere Hosts fallen durch.

Anforderungen: A3.

Lieferumfang:

- S2-1. Sechs Ziffern, kurz gültig, Zustimmung auf der anderen Seite, Schlüssel nur als Hash. Fertig, wenn ein falscher Code und ein Nein keine Fläche öffnen. Quelle: NodePilot, https://github.com/Elgeryy1/NodePilot
- S2-2. Host-Prüfung wie beim PC. Fertig, wenn `172` und eine öffentliche Adresse denselben Ablehnsatz bekommen wie der PC. Quelle: `frontend/src/engine/pc-host.ts`

Gateway `go`. Go, wenn Code, Zustimmung und Host-Regel je eine Abnahme haben. No-Go, wenn der Satz selbst der Schlüssel wäre. Abbruch: keine Gegenstelle, oder der Host ist nicht erlaubt. Dann bleibt S1, und es entsteht kein Kanal. Hängt an S1 und A3.

Prompt: Baue die Paarung, nicht die Flächen. Sechs Ziffern, kurze Gültigkeit, die andere Seite sagt Ja. Den Schlüssel nur als Hash halten. Host nur 192.168 oder 10, sonst derselbe Ablehnsatz wie beim PC. Kein Bild, keine Netzsuche, kein fremdes Paket. Abbruch ohne Gegenstelle oder bei falschem Host: kein Kanal.

### S3 — Fläche auf dem anderen Handy

Ziel: Nach der Verbindung setzt ein Satz auf dem anderen Handy den Stand der Tischplatte, der Lage oder der Tischlage. Ein Riss wird gesagt.

Anforderungen: A4.

Lieferumfang:

- S3-1. Ein kleiner Befehl mit dem Namen der Fläche und dem Stand beim Öffnen. Fertig, wenn die drei Dort-Sätze aus A4 auf dem anderen Handy dieselbe Fläche zeigen wie auf diesem. Quelle: phoneMonitor, https://github.com/mabyes1/phoneMonitor
- S3-2. Beim Riss ein Satz, keine erfundene Fläche. Fertig, wenn das andere Handy nach dem Riss nicht weiter so tut, als kämen neue Stände. Quelle: leer.

Gateway `go`. Go, wenn der Stand ein Schnappschuss beim Öffnen ist und der Riss einen Satz hat. No-Go, wenn der Kanal Pixel oder jeden Fingerzug trägt. Abbruch: die Verbindung fehlt. Dann gilt der Satz nur auf dem Handy, das ihn hört, und sagt, dass das andere nicht da ist. Hängt an S2 und A4.

Prompt: Schick nach der Paarung nur den Namen der Fläche und den Stand beim Öffnen. Tischplatte, Lage, Tischlage. Das andere Handy setzt dafür die vorhandenen Zustände. Kein Bildstrom, kein Mitgehen jedes Fingerzugs. Reißt der Kanal, sagt das Handy das und lässt die letzte Fläche liegen, ohne neue Stände zu erfinden.

## PSP

P1. Sätze auf diesem Handy. Paket P1-1: Sätze an Tisch, Lage und Tischlage hängen. Ergebnis: A1 und A2. Fertig, wenn der Chat die drei Flächen trifft. Abbruch, wenn der Satz schon einem anderen Parser gehört. Hängt an nichts.

P2. Code im WLAN. Paket P2-1: Code, Zustimmung, Host-Regel. Ergebnis: A3. Fertig, wenn falscher Code, Nein und fremder Host nichts öffnen. Abbruch ohne Gegenstelle. Hängt an P1.

P3. Fläche auf dem anderen Handy. Paket P3-1: Schnappschuss der Fläche. Ergebnis: A4. Fertig, wenn die drei Dort-Sätze dort ankommen und ein Riss gesagt wird. Abbruch, wenn die Verbindung fehlt. Hängt an P2.

## Risiken

R1. Wer im Raum steht, kann sechs Ziffern hören. Deshalb Zustimmung und kurze Gültigkeit. Quelle: NodePilot.

R2. Ein Bildstrom bräuchte Aufnahme-Recht und ein fremdes Verfahren. Deshalb ist er nicht im Plan. Quelle: Telemachus, Deskreen.

R3. Zwei Handys im Raum. Ohne `dort` gilt der Satz für das Handy, das ihn hört. Eine Auswahl fehlt, siehe L2.

## Schnittstellen

Vorhanden: Dock Tisch und Lage, Host-Regel des PC. Neu: die Sätze aus A1 bis A4 und ein Kanal, der nur einen Flächennamen und einen Stand trägt.

## Lücken

L1. Ob ein Finger auf der Tischplatte sofort auf dem anderen Handy mitgeht. Diese Sprints nehmen den Stand beim Öffnen. Das Mitgehen ist nicht entschieden.

L2. Mehr als ein verbundenes Handy. Es gibt keine Wahlfläche. `dort` meint das eine verbundene Gerät. Ein zweites bleibt unbenannt.

L3. Fund im Netz ohne Code, wie die Netzsuche in TVCompanion. Diese Sprints sagen oder zeigen den Code. Die Suche kommt nicht dazu.

## Projekt

Gateway `go`. Go, weil A1 bis A4, E1 bis E4 und S1 bis S3 je Abnahme und Abbruch haben und L1 bis L3 benannt sind. No-Go, wenn ein Sprint einen Bildstrom, einen öffentlichen Host oder fremden Quelltext will.
