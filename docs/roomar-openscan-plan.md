# Plan: RoomAR und OpenScan in Jarvis

Stand der Quellen: 1. Oktober 2026. Das hier ist der Plan. Es ändert keinen Parser, keine Version und kein APK.

Satz: Jarvis führt den RoomAR-Ablauf auf dem Handy und den OpenScan3-Ablauf am gekoppelten Raspberry Pi, Schritt für Schritt wie in den Projekten, und speichert beides im Hausstand.

## Welche Projekte

**RoomAR** ist die Android-App [colbehr/RoomAR](https://github.com/colbehr/RoomAR). Paket und Namespace heißen `com.colbehr.roomar`. Kotlin, Jetpack Compose, SceneView `arsceneview:1.2.3`, Gson, `de.javagl:obj:0.4.0`. `minSdk` 31, `compileSdk` 34, Portrait. Im Repository liegt keine `LICENSE`.

[kuroaman/Roomar](https://github.com/kuroaman/Roomar) heißt genauso, ist aber ein statischer Seitenexport (`index.html`, `post/`, `tags/`) ohne README und ohne Lizenz. Der Plan folgt der Android-App, weil der Paketname `roomar` ist und sie Räume erfasst.

**OpenScan** ist die Firmware [OpenScan-org/OpenScan3](https://github.com/OpenScan-org/OpenScan3), Zweig `develop`, Lizenz GPL-3.0. Sie steuert die offenen Scanner von [openscan.eu](https://www.openscan.eu): Raspberry Pi, Kameras, Rotor, Drehteller, Licht. Architektur: [`docs/ARCHITECTURE.md`](https://github.com/OpenScan-org/OpenScan3/blob/develop/docs/ARCHITECTURE.md). Vorgänger [OpenScan2](https://github.com/OpenScan-org/OpenScan2) ist ebenfalls GPL-3.0. Die Cloud-Verarbeitung liegt in [OpenScanCloud](https://github.com/OpenScan-org/OpenScanCloud). Hardware-Dateien: [OpenScan-Design](https://github.com/OpenScan-org/OpenScan-Design), [OpenScan-PCB](https://github.com/OpenScan-org/OpenScan-PCB), Doku [OpenScan-Doc](https://github.com/OpenScan-org/OpenScan-Doc).

## Grenze, bevor jemand Quelltext übernimmt

Der Ablauf ist 1:1. Der Quelltext der beiden Repos kommt nicht in dieses Repository.

- RoomAR hat keine Lizenzdatei. Kotlin, Compose-Screens, `arrow.glb`, Icons und der Heroicons-Hinweis bleiben dort. Jarvis baut dasselbe Verhalten neu.
- OpenScan3 ist GPL-3.0. Python aus `openscan_firmware/` wird nicht in die App kopiert und nicht als Bibliothek eingebunden. Die Firmware läuft weiter auf dem Pi. Jarvis ist der Client von `/latest`.
- Motoren, Endstopps, GPIO, gPhoto2, Picamera2 und `openscan-updater` bleiben auf dem Pi. Das Handy hat keinen Rotor. Ein Scan ohne gekoppeltes Gerät wird nicht erfunden.
- Heroicons in RoomAR stehen unter MIT (Copyright 2020 Refactoring UI Inc.). Wenn Jarvis dieselben Icons nutzt, bleibt der MIT-Hinweis in den Einstellungen.

Abbruch: ein Pull, der Dateien aus RoomAR oder OpenScan3 eincheckt.

## Wege

1. **Raum auf dem Handy.** Sieben Screens, dasselbe Datenmodell, derselbe Export. Quelle: RoomAR.
2. **Objekt auf dem Pi.** Projekt, Scan, Pfad, Foto, Pause, Cloud, Download. Quelle: OpenScan3. Jarvis spricht nur die API.
3. **Hausstand.** Beide Arten liegen als eigene Schlüssel im bestehenden Export, damit ein Gerätwechsel die Räume und die Pi-Projekte mitnimmt.

## Recherche

Gelesen, nicht geraten:

| Quelle | Was daraus in den Plan kam |
|---|---|
| [RoomAR README](https://github.com/colbehr/RoomAR/blob/master/README.md) | AR-Ecken, Export, SceneView, Kotlin |
| `NavGraph.kt`, `Screen.kt` | sieben Routen, Start `home_screen` |
| `ARScreen.kt` | Depth, Hit-Test, Anker, Fertig ab drei Punkten, `x:z` |
| `PointData.kt`, `FileManager.kt` | Punkt `x/y`, JSON, OBJ mit `y = 0`, MD5-Dateiname |
| `DataConfirmScreen.kt`, `ExportScreen.kt`, `HomeScreen.kt`, `SettingsScreen.kt` | Name, 2D-Bild, zwei Exportarten, Suche, Welcome |
| `app/build.gradle.kts`, `AndroidManifest.xml` | SDK 31, FileProvider, keine eigene CAMERA-Zeile im Manifest |
| [OpenScan3 ARCHITECTURE.md](https://github.com/OpenScan-org/OpenScan3/blob/develop/docs/ARCHITECTURE.md) | FastAPI, Router, Controller, Tasks, `/versions`, `/latest` |
| `models/project.py`, `models/scan.py`, `config/scan.py` | Namensregeln, Scan-Felder, Pfad-Defaults |
| `controllers/services/scans.py`, `tasks/core/scan_task.py` | start, pause, resume, cancel, Motor, Foto |
| `controllers/services/cloud.py` | ZIP nur JPEG, Upload, Download |
| [OpenScan-Doc](https://openscan-org.github.io/OpenScan-Doc/) | Module: Firmware, Design, PCB, Cloud |

Offen, bis jemand die Geräte in der Hand hat: welches Handy ARCore wirklich trägt, welche OpenScan-Version auf dem Pi läuft (`/versions`), und ob die Cloud einen eigenen Account braucht. Die Firmware-Doku nennt den Cloud-Controller, nicht die Kontodaten.

## Ablauf RoomAR, 1:1

Start ist `home_screen`. Die Activity sperrt Portrait und stellt die Orientierung beim Verlassen wieder her.

### Home

- Dateien nur aus dem internen App-Ordner. Jede `.json` wird zu `PointData`.
- Liste: Name, Antippen öffnet die Ansicht, Export-Knopf öffnet die Export-Ansicht.
- Suche filtert den Namen, Großschreibung egal.
- Zahnrad öffnet Einstellungen.
- Plus öffnet den AR-Screen.
- Beim ersten Start ein Willkommen. Flag `PREFS` / `firstRun`. Der Dialog lässt sich in den Einstellungen zurücksetzen.

### AR

- SceneView `ARScene`.
- Depth `AUTOMATIC`, wenn die Session das kann, sonst `DISABLED`.
- Instant Placement `LOCAL_Y_UP`. Licht `ENVIRONMENTAL_HDR`.
- Tippen setzt einen Anker, wenn der Hit gültig ist. Depth-Punkte und reine Punkte zählen nicht.
- Am Anker ein Pfeil, 0,1 m, höchstens 50 Instanzen. Die Bounding-Box ist unsichtbar, bis jemand den Knoten schiebt.
- Oben rechts „Done“. Unter drei Punkten passiert nichts.
- Die Punkte werden `x:z` kommasepariert. Die Höhe `y` fällt weg. Der Boden ist die Fläche.

### Bestätigen

- Name ist das Datum `yyyy-MM-dd`, tippbar, Umbenennen im Dialog.
- 2D-Grafik der Punkte.
- „Restart“ geht zum AR zurück.
- „Next“ geht zum Export, Name URL-kodiert.

### Export

Zwei Haken, beide anwählbar:

- `TwoD`: JSON `{ name, pointsString, points: [{x,y}] }`.
- `ThreeD`: OBJ. Jeder Punkt wird Vertex `(x, 0, y)`, Normale `(0, 0, 1)`, ein Face über alle Vertices.

Dateiname ist der MD5 des JSON plus `.json` oder `.obj`. Teilen über `FileProvider` (`com.colbehr.roomar.fileprovider` dort; in Jarvis die eigene Authority). Beide Haken: JSON und OBJ in einem Share. Nur einer: nur diese Datei. Ohne Haken: kein Teilen.

### Ansicht

Gespeicherte Datei wieder öffnen: Grundriss oder Export, mit demselben Punktstring, Namen und Dateinamen in der Route.

### Einstellungen

Zurück. Links auf `https://github.com/colbehr` und `https://colbehr.com`. LinkedIn ist im Quelltext auskommentiert und kommt nicht in Jarvis. Text zur GitHub-Mitarbeit. „Reset Welcome Dialog“ setzt `firstRun` und sagt „Done“. „App Icon License“ zeigt den MIT-Text von Heroicons. Jarvis zeigt den Hinweis nur, wenn es diese Icons wirklich nutzt.

Das Manifest im Repo fordert `CAMERA` nicht selbst an. SceneView kann das per Merge tun. Jarvis schreibt die Kamerafreigabe ausdrücklich, sonst bleibt der AR-Screen stumm.

## Ablauf OpenScan3, 1:1

Jarvis wird nicht zur Firmware. Die Firmware bleibt der FastAPI-Server auf dem Pi. Jarvis nutzt `/latest` und liest `/versions`, damit eine gepinnte `/vX.Y` möglich ist, wenn `/latest` die Felder bricht.

Router, die der Client kennt, weil sie im Baum `openscan_firmware/routers/` liegen: `projects`, `cameras`, `motors`, `lights`, `gpio`, `triggers`, `tasks`, `cloud`, `focus_stacking`, `device`, `firmware`, `external_trigger_runs`, `websocket`. `system_update` und `system_repair` bleiben unangetastet. Die rufen `sudo /usr/bin/openscan-updater`.

### Projekt

Felder aus `Project`: `name`, `path`, `created`, `scans`, `description`, `uploaded`, `cloud_project_name`, `downloaded`.

Namensregeln aus dem Validator, unverändert:

- NFC, nicht leer, höchstens 150 Zeichen.
- Nicht mit Leerzeichen oder Punkt beginnen oder enden.
- Verboten: `/ \ : * ? " < > |` und Steuerzeichen.
- Windows-Reservenamen verboten: `CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`.
- Erlaubt: Buchstaben, Ziffern, Leerzeichen, `_ - . '`.

### Scan

Ein Scan gehört zu einem Projekt und hat einen Index. Status spiegelt den Task: pending, running, paused, completed, cancelled, error, interrupted. Felder: Kamera-Name, Kamera-Settings, `current_step`, `system_message`, Dauer, Byte-Größen, relative Fotopfade, `task_id`, Stacking-Status.

Defaults aus `ScanSetting`, solange niemand am Pi etwas anderes speichert:

- Pfad `fibonacci`, 130 Punkte, Bild `jpeg`.
- Theta 12° bis 125°, Phi 0° bis 360°.
- Pfad optimieren, Algorithmus `nearest_neighbor`.
- `focus_stacks` 1, Pause vor dem Foto 0 ms, Fokusbereich 10 bis 15 Dioptrien.
- Bei mehr als einem Stack: Fokuswerte gleichmäßig zwischen Min und Max. Autofokus gilt dann nicht.

`start_scan` legt einen `scan_task` an. Läuft schon einer, kommt kein zweiter. Completed, cancelled, error und interrupted dürfen neu starten. Interrupted setzt bei `start_from_step` fort. Die Kamera im Request muss `camera_name` des Scans sein.

Die Schleife in `scan_task`:

1. Pfad erzeugen. Rotor und Drehteller liefern `steps_per_rotation` für die Optimierung.
2. Ab `current_step` weiter, wenn fortgesetzt wird.
3. Pro Punkt: Abbruch prüfen, Pause abwarten, `move_to_point`, Foto, bei Fehler loggen und den Status auf error, Dauer addieren, `current_step` erhöhen.
4. Erstes Vorschaubild als Projekt-Thumbnail.
5. Metadaten pro Foto: Step, Polar, daraus Kartesisch, Projekt, Scan-Index, optional Stack-Index.

Fokus-Stacking ist ein eigener Task, nicht ein stiller Zusatz im Foto. Die Cloud nimmt nur `.jpg` und `.jpeg`. PNG, DNG und RAW gehen nicht in den ZIP.

Cloud, wenn Zugangsdaten auf dem Pi liegen: ZIP, Upload in Teilen, Verarbeitung starten, Modell laden, `uploaded` und `downloaded` setzen. Timeout im Controller: 60 Sekunden. Jarvis zeigt Fortschritt aus Task und Websocket. Jarvis speichert das Cloud-Geheimnis nicht ein zweites Mal, solange der Pi es schon hat.

## Was Jarvis dafür schon hat

Hausstand exportiert und importiert JSON. Portfolio hält Projektdateien. Der PC-Client spricht ein Gerät im WLAN an. Die Kamera am Handy macht Fotos für das Auge, keinen Raum-Anker. Es gibt kein ARCore, keinen FileProvider für OBJ, keinen OpenScan-Client.

Die Fläche bleibt die bestehende App. RoomAR-Screens werden eigene Routen, keine zweite Launcher-App. Die Paket-ID `local.jarvis.app` bleibt. Eine neue Application-ID würde das Update auf dem Handy als fremde App behandeln.

## Sprints

Die Reihenfolge ist der Quelltext. Ein Sprint ändert das Verhalten erst, wenn sein Abnahmesatz grün ist.

### R1 — Raum-Daten

`Point` ist `x` und `y` in der Fläche. `PointData` ist Name, Punktstring, Punktliste. Speichern unter MD5(JSON). Lesen aller `.json` aus dem internen Ordner. Ungültiges JSON wird übersprungen, die Liste bleibt.

Abnahme: drei Punkte ergeben eine Datei, die Suche findet den Namen, ein kaputtes JSON wirft die anderen nicht weg.

### R2 — AR-Ecken

Portrait. Depth wie oben. Tippen setzt den Pfeil. Unter drei Punkten bleibt „Fertig“ stumm. Ab drei geht es zur Bestätigung mit `x:z`.

Abnahme: auf einem Gerät mit ARCore entstehen drei Anker, die 2D-Grafik zeigt dasselbe Polygon. Ohne ARCore sagt der Screen, dass die Kamera den Boden nicht hält, und legt keine Punkte an.

### R3 — Name, Ansicht, Export

Datum als Name, Umbenennen, Restart, Next. Export 2D, 3D oder beides. OBJ mit Höhe 0 und einer Fläche. Share über den FileProvider der App.

Abnahme: die geteilte OBJ öffnet in einem Viewer als flaches Polygon mit derselben Eckenzahl. JSON und OBJ tragen denselben Hash-Stamm.

### R4 — Home und Einstellungen

Liste, Suche, Plus, Zahnrad, Willkommen einmal, Reset setzt es zurück. GitHub- und Website-Link von RoomAR nur als Quellenhinweis, nicht als Jarvis-Marke.

Abnahme: zweiter Start zeigt den Dialog nicht. Reset zeigt ihn wieder.

### O1 — Pi finden

Jarvis merkt sich Host und Port des Pi. Erster Ruf ist `GET /versions`. Danach `/latest`. Ein fremdes JSON ist kein Scanner.

Abnahme: ein erreichbarer OpenScan3-Pi zeigt Version und `/latest`. Ein anderer Host zeigt den Fehler und legt kein Projekt an.

### O2 — Projekte und Scans lesen

Projektliste mit den Feldern aus `Project`. Anlegen nur, wenn der Name den Validator besteht. Jarvis schickt den Namen, der Pi prüft. Die Fehltexte des Pi bleiben sichtbar.

Abnahme: `CON`, ein leerer Name und ein Name mit `:` kommen als Ablehnung zurück. Ein gültiger Name erscheint in der Liste.

### O3 — Scan fahren

Start, Pause, Weiter, Abbruch über den Task. Fortschritt ist `current_step` gegen die Punktzahl. Die Kamera muss passen. Exclusive: ein laufender Scan blockiert den nächsten Start.

Abnahme: Abbruch mitten im Lauf setzt den Status auf cancelled und lässt `current_step` stehen. Ein zweiter Start auf einem laufenden Scan liefert den bestehenden Task, keinen neuen.

### O4 — Fotos und Cloud

Fotoliste mit Polar und Kartesisch. Thumbnail. Cloud-Knopf nur, wenn der Pi die Cloud konfiguriert hat. Upload und Download zeigen Bytezahlen. JPEG-only: ein Hinweis, wenn der Scan RAW ist und die Cloud ihn nicht nimmt.

Abnahme: nach einem kurzen Scan zeigt Jarvis die Fotopfade, die der Pi meldet. Ohne Cloud-Konfiguration gibt es keinen Upload-Knopf, der so tut, als liefe er.

### H1 — Hausstand

Zwei Schlüssel: `room_scans` (die RoomAR-JSON-Dateien) und `openscan_links` (Host, Port, Projektnamen, nicht die Fotos und nicht das Cloud-Geheimnis). Fotos bleiben auf dem Pi. Der Import zählt die Schlüssel, sonst gilt derselbe Fehler wie beim leeren Hausstand.

Abnahme: Export, Datei auf ein zweites Profil, Import zeigt die Raumzahl und die Pi-Projekte. Die Vorschau ist nicht 0.

### H2 — Sprache

Befehle erst, wenn die Screens stehen. „Raum scannen“ öffnet R2. „Ecke“ ist der Tipp, solange der AR-Screen offen ist. „Fertig“ ist Done. „Scan starten“, „Scan Pause“, „Scan weiter“, „Scan abbrechen“ gehen an O3 des gekoppelten Pi. „Freitag“ und Kalender bleiben Kalender. Ein Satz ohne gekoppelten Pi sagt, dass kein Scanner da ist, und erfindet keinen Lauf.

Abnahme: die Gold-Sätze für Kalender und Gesicht bleiben. Die neuen Sätze landen in einer eigenen Erwartungsliste, nicht in der alten Gold-Liste.

## PSP

Arbeitspakete. Ergebnis ist ein Eintrag im Plan oder, später, ein Verhalten. Kein Paket kopiert fremden Quelltext.

| Id | Arbeit | Ergebnis | Hängt an | Fertig, wenn | Abbruch |
|---|---|---|---|---|---|
| P1-1 | RoomAR-Modell | `Point`, `PointData`, Hash-Datei | — | R1-Abnahme | Lizenzdatei taucht auf und widerspricht dem Neubau |
| P1-2 | AR-Session | Depth, Hit, Anker, drei-Punkte-Tor | P1-1 | R2-Abnahme | Gerät ohne ARCore legt Punkte an |
| P1-3 | Export | JSON, OBJ, Share | P1-1 | R3-Abnahme | OBJ hat Höhe ungleich 0 |
| P1-4 | Home | Liste, Suche, Welcome | P1-1 | R4-Abnahme | Dialog jedes Mal |
| P2-1 | Client `/versions` und `/latest` | Host-Paarung | — | O1-Abnahme | Update-Route wird mit angeboten |
| P2-2 | Projekte | Namensregeln sichtbar | P2-1 | O2-Abnahme | Jarvis lockert die 150-Zeichen-Regel |
| P2-3 | Scan-Task | start, pause, resume, cancel | P2-2 | O3-Abnahme | Zweiter Task bei laufendem Scan |
| P2-4 | Cloud | JPEG-ZIP, Flags | P2-3 | O4-Abnahme | RAW wird hochgeladen |
| P3-1 | Hausstand | `room_scans`, `openscan_links` | P1-4, P2-2 | H1-Abnahme | Fotos oder Geheimnis im Export |
| P3-2 | Parser | eigene Erwartungen | P1-2, P2-3 | H2-Abnahme | Kalender-Freitag wird zum Scan |

P4 gibt es nicht. Die Firmware, die Platine und die Druckteile bleiben die Upstream-Repos.

## Abnahme des ganzen Plans

Ein Raum mit mindestens drei Ecken liegt als JSON und als flaches OBJ vor und übersteht einen Hausstand-Umzug. Ein OpenScan3-Pi lässt sich koppeln, ein Scan starten und abbrechen, und der Schrittzähler bleibt der des Pi. Die Cloud läuft nur, wenn der Pi sie kennt. Keine Datei aus den beiden Upstream-Repos liegt in diesem Baum.

## Risiken

| Id | Risiko | Folge | Was dann gilt |
|---|---|---|---|
| R1 | RoomAR ohne Lizenz | Nachbau ist die einzige saubere Bahn | Kein Kopieren, auch nicht „nur die eine Datei“ |
| R2 | GPL-3.0 | Ein Firmware-Import würde die App mitziehen | Client bleibt HTTP und Websocket |
| R3 | ARCore fehlt am Gerät | Der AR-Screen ist leer | Ehrlicher Satz, kein geratenes Polygon |
| R4 | `/latest` ändert Felder | Der Client liest daneben | Pin auf die Version aus `/versions` |
| R5 | Cloud-Konto unbekannt | Upload-Knopf ohne Ziel | Knopf bleibt aus, bis der Pi die Konfiguration meldet |
| R6 | Hausstand wird groß | Fotos würden den Export sprengen | Nur Metadaten und Punkt-JSON |

## Schnittstellen

| Seite | Gegenstelle | Vertrag |
|---|---|---|
| Room-Screen | ARCore über SceneView-Äquivalent | Hit auf Fläche, Anker, `x` und `z` |
| Datei | interner App-Ordner, FileProvider | MD5-Name, Share |
| Hausstand | bestehender JSON-Import | Schlüssel `room_scans`, `openscan_links`, Zähler in der Vorschau |
| Pi | OpenScan3 `/latest` | Projekte, Scans, Tasks, Websocket |
| Pi | `/versions` | Pin, wenn `/latest` bricht |
| Cloud | nur über den Pi | JPEG, Flags `uploaded` / `downloaded` |
| Sprache | bestehender Parser | neue Sätze in eigener Liste |

## Lücken

- Welches Handy ARCore hat. Ohne Gerät bleibt R2 ein Satz, kein Beweis.
- Die genaue `/vX.Y` auf dem Pi. Der Plan pinnt erst, wenn `/versions` gelesen ist.
- OpenScanCloud-Account. Der Controller setzt Zugangsdaten voraus. Die Doku nennt sie hier nicht.
- Ob Jarvis `minSdk` unter 31 liegt. RoomAR verlangt 31. Der AR-Weg gilt dann nur auf diesen Geräten, der Rest der App bleibt.
- Kamerafreigabe. Das RoomAR-Manifest im Repo zeigt sie nicht. Jarvis muss sie selbst erklären und abfragen.
- Stimme und Ultron-Fläche. Die Screens folgen dem RoomAR-Ablauf. Die Schrift und die Platten der App bleiben. Kein zweites Material-Design daneben.
