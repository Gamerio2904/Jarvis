# Raum auf der Tischplatte

Die Hülle ist [`plan-vorlage.md`](./plan-vorlage.md). Eine Vorlage, so viele Sprints wie Tore. Der Ablauf liegt im Code **`18.24.7`**. Test: [`TEST-18.24.6.md`](./TEST-18.24.6.md). Seit `18.24.7` startet auch `den Raum scannen`. `Scan beenden`, `Bennede den Scan` und der Knopf `Beende den Scan` beenden ihn, wie `Beende den Scan`.

Gelesen am 1. Oktober 2026. Eine Adresse unten ist eine Fundstelle. Was dort nicht steht, bleibt eine Lücke.

## Bedingung

Auf der Tischplatte sagt man „Scanner den Raum“ oder „Scanne den Raum“. Der Tisch wird durchsichtig, als schaue man mit der Kamera durch das Handy. Man scannt den Raum. „Beende den Scan“ zeigt den Raum als 3D-Anzeige auf dem Tisch. Danach gelten „Entferne alles aus dem Raum“ und „Tausche Bett mit Schreibtisch“.

„Scanne das Objekt“ oder „Scanne den Apfel“ macht den Tisch wieder durchsichtig und scannt nur das, was vor der Kamera steht. Das gesprochene Nomen ist der Name des Modells. „Beende den Scan“ stellt den Tisch-Hintergrund zurück und legt dieses eine 3D-Modell darauf. Es lässt sich bewegen, drehen, vergrößern und verkleinern.

## Rahmenpunkte dieses Projekts

Die acht Punkte der Vorlage gelten. Dazu:

1. Durchblick und eingefrorene 3D-Anzeige folgen [ARCore Depth Lab](https://github.com/googlesamples/arcore-depth-lab), Apache-2.0. Die Probe `ScreenSpaceDepthMesh` hält die Tiefen-Mesh live und friert sie mit Freeze ein. Das ist Unity. Jarvis übernimmt den Ablauf, nicht das Unity-Projekt.
2. [V-Serghei/3Dify](https://github.com/V-Serghei/3Dify) zeigt denselben Ablauf auf Android: ARCore-Tiefe, Punktwolke, OBJ, eingebauter Viewer. Im Repo liegt keine Lizenzdatei. Kein Kotlin, kein C++ und kein PCL-Paket daraus.
3. Bett, Schreibtisch, Entfernen und Tausch folgen [roomform](https://github.com/johnathanchiu/roomform), Apache-2.0. `scene.json` trägt Objekte mit `cls`. Der Editor kennt `in-place`, `moved`, `removed`. Die Klassenliste in `pointlabel.py` enthält `bed` und `desk`. `wall` und `floor` gehören zur Hülle, nicht zu den Möbeln.
4. Der Klassifikator von roomform läuft bei ihnen auf Modal, nicht auf dem Handy. Ohne Klasse auf dem Gerät ist „Bett“ und „Schreibtisch“ ein No-Go, keine geratene Fläche.
5. [SpatialLM](https://github.com/johnathanchiu/roomform) und UniDet3D stehen in der roomform-Tabelle als CC BY-NC 4.0. Die kommen nicht in die App. [Open3Dmap](https://github.com/x4dqn/Open3Dmap) ist CC BY-NC 4.0 und scannt draußen. Ebenfalls nicht.
6. [Splatman](https://github.com/HunterColes/Splatman), MIT, scannt offline mit ARCore und zeigt eine 3D-Ansicht. Er nennt keine Möbel. Er ist nicht der Tausch.
7. [RoomAR](https://github.com/colbehr/RoomAR) setzt Ecken und schreibt ein flaches OBJ. Keine Lizenzdatei, keine Möbel, kein Durchblick der Tischplatte. [OpenScan3](https://github.com/OpenScan-org/OpenScan3) ist GPL-3.0 und dreht ein Objekt auf einem Teller. Beide sind nicht das Vorbild für diesen Satz. Ihr Quelltext bleibt draussen.
8. ARCore hat keine RoomPlan-API. Das steht in [google-ar/arcore-android-sdk#1772](https://github.com/google-ar/arcore-android-sdk/issues/1772). Die App baut die Kette selbst: Kamera, Tiefe, Mesh, dann Klassen.
9. Die Tiefe gibt es nicht auf jedem ARCore-Gerät. Ohne Tiefe legt der Scan keine 3D-Anzeige an.
10. Paket-ID bleibt `local.jarvis.app`. `Freitag` bleibt Kalender. Hausstand trägt die Mesh, `scene.json` und das Objekt-Modell mit seinem gesprochenen Namen. Das Video des Durchblicks und ein Cloud-Geheimnis bleiben draussen.
11. Das Ding vor der Kamera folgt dem [ARCore Raw Depth Codelab](https://codelabs.developers.google.com/codelabs/arcore-rawdepthapi), Repo [googlecodelabs/arcore-rawdepthapi](https://github.com/googlecodelabs/arcore-rawdepthapi), Apache-2.0. `filterUsingPlanes` wirft Punkte weg, die auf einer Fläche liegen, und lässt die übrigen als Objekt stehen. „Apfel“ wird nicht erkannt. Der gesprochene Name wird nur an das Modell geschrieben.
12. Anzeige und Griff auf dem Tisch folgen [`<model-viewer>`](https://github.com/google/model-viewer), Apache-2.0. `camera-controls` dreht, zoomt und schiebt. Das Format ist glTF oder GLB. Der AR-Knopf von model-viewer bleibt aus. Nach dem Scan ist der Tisch-Hintergrund wieder da.
13. OpenScan Mini scannt kleine Dinge auf einem Teller. Die Firmware ist GPL-3.0 und bleibt auf dem Pi. Der Apfel in diesem Satz entsteht auf dem Handy, nicht auf dem Teller.

## Anforderungen

| ID | Satz | Abnahme | Gateway |
|---|---|---|---|
| A1 | „Scanner den Raum“ und „Scanne den Raum“ öffnen auf der Tischplatte die Kamera, der Tisch ist durchsichtig | Die Fläche zeigt das Kamerabild, nicht die Tafelstücke | offen |
| A2 | Solange der Scan läuft, sammelt das Gerät Tiefenbilder | Ein Gerät mit Depth API hält mehr als ein Bild | offen |
| A3 | „Beende den Scan“ stoppt die Kamera und zeigt den Raum als 3D auf dem Tisch | Die Anzeige ist die eingefrorene Mesh, nicht mehr das Live-Bild | offen |
| A4 | „Entferne alles aus dem Raum“ nimmt die Möbel aus der Anzeige, Wände und Boden bleiben | Nach dem Satz ist kein Objekt mit `cls` ausser `wall` und `floor` sichtbar, die Hülle ist da | nogo |
| A5 | „Tausche Bett mit Schreibtisch“ vertauscht die Lage der beiden gefundenen Kästen | Beide `cls` waren da, danach sitzt das Bett an der alten Schreibtisch-Stelle und umgekehrt | nogo |
| A6 | „Scanne das Objekt“ und „Scanne den Apfel“ öffnen denselben Durchblick und merken das Nomen als Namen | Die Kamera ist offen, der Name ist das gesprochene Nomen, kein Klassifikator | offen |
| A7 | Der Objekt-Scan behält nur das, was vor der Kamera und nicht auf der Fläche liegt | Nach „Beende den Scan“ ist ein Modell da, dessen Punkte nicht die Tischfläche sind | offen |
| A8 | Danach ist der Tisch-Hintergrund zurück, das Modell liegt darauf und lässt sich bewegen, drehen, vergrößern und verkleinern | Ziehen dreht, Ziehen mit zwei Fingern bewegt, Auf- und Zuziehen ändert die Größe | offen |

A1 bis A3 und A6 bis A8 bleiben offen, bis ein Gerät mit Depth API den Durchblick und die Punkte gehalten hat. A4 und A5 sind No-Go, solange die Szene keine Klassen trägt. Ein Go davor wäre falsch.

## Entscheidungen

| ID | Schnitt | Grund | Gateway |
|---|---|---|---|
| E1 | Vorbild für Durchblick und „Beende den Scan“ ist Depth Lab Freeze, der Android-Ablauf daneben ist 3Dify nur als Verhalten | Depth Lab ist Apache-2.0 und friert die Tiefen-Mesh ein. 3Dify hat keine Lizenzdatei | go |
| E2 | Vorbild für Möbel und die zwei Sätze danach ist roomform `scene.json` plus `poseState` | Die Klassenliste nennt `bed` und `desk`. Der Editor kennt `removed` und `moved` | go |
| E3 | „Alles“ heißt die Möbel, nicht Wände und Boden | roomform setzt `EXCLUDE = {wall, floor}`. Sonst ist nach dem Satz kein Raum mehr da | go |
| E4 | „Tausche“ vertauscht die beiden gescannten Kästen. Es stellt kein Katalog-Modell hin | Interior-Design-AR und DARI stellen neue Möbel auf eine Fläche. Sie erkennen das Bett im Scan nicht, und Interior-Design-AR hat keine Lizenzdatei | go |
| E5 | RoomAR und OpenScan bleiben aussen | Ecken und Drehteller tragen diesen Satz nicht | go |
| E6 | Splatman ist nicht der Tausch | MIT und offline, aber ohne `bed` und `desk` | go |
| E7 | Das Objekt vor der Kamera ist die Raw-Depth-Punktwolke nach `filterUsingPlanes`, der Name ist das Nomen | Der Codelab ist Apache-2.0 und lässt nicht-ebene Punkte stehen. Eine Apfel-Erkennung steht dort nicht | go |
| E8 | Griff und Anzeige auf dem Tisch ist model-viewer mit `camera-controls`, ohne AR-Knopf | Apache-2.0, glTF/GLB, der Seitenhintergrund bleibt der Tisch | go |
| E9 | OpenScan Mini ist nicht der Apfel auf dem Handy | GPL-3.0, Teller und Pi. Der Satz scannt das, was vor der Linse steht | go |

## Sprints

Dieselbe Hülle. `quelle` leer heißt: die Fundstelle steht oben, eine zweite Suche ist nicht gelaufen.

### Sprint 1 — Durchblick

Ziel: „Scanner den Raum“ und „Scanne den Raum“ öffnen die Kamera auf der Tischplatte. Anforderungen: A1. Hängt an: —. Gateway: offen. Go, wenn das Kamerabild die Tafel verdeckt und die Tafelstücke nicht mehr bedienbar sind. No-Go, wenn die Kamerafreigabe fehlt. Abbruch: der Satz fällt in einen anderen Parser, Kalender und Freitag bleiben, was sie sind.

Lieferumfang: S1-1 Die Tischplatte wird zur Kamerafläche. Fertig, wenn ein Tippen die Tafel nicht schiebt.

### Sprint 2 — Tiefe

Ziel: Der laufende Durchblick sammelt Tiefenbilder. Anforderungen: A2. Hängt an: S1. Gateway: offen. Go, wenn ein Depth-Gerät mehr als ein Tiefenbild hält. No-Go, wenn das Gerät keine Depth API hat. Abbruch: ohne Tiefe entsteht keine Mesh, und der Satz sagt das.

Lieferumfang: S2-1 Tiefenbilder nur während der Scan offen ist. Fertig, wenn „Beende den Scan“ ohne vorherigen Scan keine leere Mesh anlegt.

### Sprint 3 — Anzeige

Ziel: „Beende den Scan“ friert die Mesh ein und zeigt sie auf dem Tisch. Anforderungen: A3. Hängt an: S2. Gateway: offen. Go, wenn die 3D-Anzeige die Mesh aus diesem Scan ist und das Live-Bild weg ist. No-Go, solange kein Gerät die Mesh gehalten hat. Abbruch: die Anzeige erfindet Möbel, die der Scan nicht hat.

Lieferumfang: S3-1 Eine 3D-Anzeige auf der Tischplatte, drehbar. Fertig, wenn sie nach dem Satz sichtbar ist und der Durchblick zu ist.

### Sprint 4 — Leeren

Ziel: „Entferne alles aus dem Raum“ setzt jedes Möbel auf `removed`, Wände und Boden bleiben. Anforderungen: A4. Hängt an: S3 und eine Szene mit Klassen. Gateway: nogo. Go, wenn danach nur die Hülle sichtbar ist. No-Go, solange kein `cls` da ist. Abbruch: der Satz löscht die Mesh komplett.

Lieferumfang: S4-1 Objekte außer `wall` und `floor` verschwinden aus der Anzeige. Fertig, wenn ein zweites „Entferne alles“ nichts weiter löscht.

### Sprint 5 — Tausch

Ziel: „Tausche Bett mit Schreibtisch“ vertauscht die Lage, wenn beide Klassen in der Szene stehen. Anforderungen: A5. Hängt an: S3 und Klassen. Gateway: nogo. Go, wenn `bed` und `desk` je mindestens einen Kasten haben und die Lagen danach vertauscht sind. No-Go, wenn eine Klasse fehlt: der Satz nennt die fehlende Klasse und lässt die Anzeige. Abbruch: ein Katalog-Modell erscheint, das der Scan nicht hatte.

Lieferumfang: S5-1 Pose-Tausch der beiden Kästen. Fertig, wenn die 3D-Anzeige dieselben zwei Kästen an den vertauschten Stellen zeigt.

### Sprint 6 — Objekt

Ziel: „Scanne das Objekt“ und „Scanne den Apfel“ öffnen den Durchblick und setzen den Namen. Anforderungen: A6. Hängt an: S1. Gateway: offen. Go, wenn die Kamera offen ist und der Name „Apfel“ oder „Objekt“ lautet, je nach Satz. No-Go, wenn die Freigabe fehlt. Abbruch: ein Klassifikator rät die Sorte.

Lieferumfang: S6-1 Dieselbe Kamerafläche wie der Raum, anderes Ziel. Fertig, wenn der Raum-Scan nicht mitläuft.

### Sprint 7 — Davor

Ziel: Die Tiefe behält das Ding vor der Linse und wirft die Fläche darunter weg. Anforderungen: A7. Hängt an: S2 und S6. Gateway: offen. Go, wenn die übrig gebliebenen Punkte nicht auf der AR-Fläche liegen. No-Go ohne Depth API. Abbruch: die ganze Raum-Mesh wird als Apfel gespeichert.

Lieferumfang: S7-1 `filterUsingPlanes` und die Konfidenz aus dem Raw-Depth-Codelab, neu gebaut. Fertig, wenn ein Scan ohne „Beende den Scan“ noch kein Modell ablegt.

### Sprint 8 — Zurück

Ziel: „Beende den Scan“ nach einem Objekt-Scan stellt den Tisch-Hintergrund her und zeigt nur dieses Modell. Anforderungen: A7. Hängt an: S7. Gateway: offen. Go, wenn das Live-Bild weg ist und der Name am Modell steht. No-Go, solange kein Gerät die Punkte gehalten hat. Abbruch: der Raum aus Sprint 3 ersetzt den Apfel.

Lieferumfang: S8-1 Ein Modell, Name aus dem Satz. Fertig, wenn die Tafelstücke wieder da sind und das Modell darauf liegt.

### Sprint 9 — Griff

Ziel: Das Modell auf dem Tisch lässt sich bewegen, drehen, vergrößern und verkleinern. Anforderungen: A8. Hängt an: S8. Gateway: offen. Go, wenn Ziehen dreht, zwei Finger schieben und das Aufziehen die Größe ändert. No-Go, wenn der AR-Knopf die Tafel verlässt. Abbruch: der Griff wirkt auf die Raum-Mesh von Sprint 3, während der Apfel gezeigt wird.

Lieferumfang: S9-1 model-viewer mit `camera-controls`, ohne AR. Fertig, wenn die drei Gesten an dem einen Modell hängen.

## PSP

| Id | Arbeit | Ergebnis | Hängt an | Fertig, wenn | Abbruch |
|---|---|---|---|---|---|
| P1-1 | Kamerafläche auf der Tafel | A1 | — | Der Tisch zeigt die Kamera | Freigabe fehlt |
| P2-1 | Tiefe nur bei offenem Scan | A2 | P1-1 | Mehr als ein Tiefenbild, oder der ehrliche Satz ohne Depth API | Mesh ohne Tiefe |
| P3-1 | Freeze und 3D-Anzeige | A3 | P2-1 | Mesh auf dem Tisch, Live-Bild zu | Erfundene Möbel |
| P4-1 | Möbel auf `removed` | A4 | P3-1, Klassen | Hülle bleibt | Mesh weg |
| P5-1 | Pose-Tausch `bed` und `desk` | A5 | P3-1, beide Klassen | Lagen vertauscht, oder die fehlende Klasse genannt | Katalog-Modell |
| P6-1 | Objekt-Satz öffnet die Kamera und setzt den Namen | A6 | P1-1 | Name ist das Nomen | Klassifikator |
| P7-1 | Fläche weg, Ding davor behalten | A7 | P2-1, P6-1 | Punkte nicht auf der AR-Fläche | Raum-Mesh als Apfel |
| P8-1 | Tisch zurück, ein Modell | A7 | P7-1 | Live-Bild weg, Name steht | Raum ersetzt den Apfel |
| P9-1 | Drehen, schieben, Größe | A8 | P8-1 | Drei Gesten an diesem Modell | AR-Knopf oder fremde Mesh |

## Risiken

| Id | Risiko | Folge | Was dann gilt |
|---|---|---|---|
| R1 | 3Dify ohne Lizenz | Der Android-Code darf nicht rein | Nur der Ablauf, Depth Lab bleibt die lizenzierte Fundstelle |
| R2 | Klassen nur auf Modal | Bett und Schreibtisch gibt es auf dem Handy nicht | A4 und A5 bleiben nogo |
| R3 | CC BY-NC | SpatialLM, UniDet3D, Open3Dmap | Nicht einbinden |
| R4 | Depth API fehlt am Gerät | Keine Mesh | Ehrlicher Satz, keine geratene Geometrie |
| R5 | GPL und fehlende RoomAR-Lizenz | Quelltext aus OpenScan3 oder RoomAR | Nicht kopieren |
| R6 | model-viewer lädt glTF/GLB, der Raw-Depth-Schritt liefert Punkte | Eine geschlossene GLB ohne das unlizenzierte PCL aus 3Dify fehlt | Anzeige ist die Tiefen-Mesh des Dings, L4 bleibt offen |

## Schnittstellen

| Seite | Gegenstelle | Vertrag |
|---|---|---|
| Tischplatte | Kamera und ARCore Depth | Durchblick, dann Freeze |
| Anzeige | Mesh dieses Scans | OBJ oder gleichwertig, keine zweite Geometrie |
| Szene | `scene.json` | `cls`, Lage, `poseState` |
| Hausstand | bestehender JSON-Import | Mesh und Szene, kein Durchblick-Video |
| Sprache | bestehender Parser | Raum-Sätze, Objekt-Sätze, Freitag bleibt Kalender |
| Objekt | model-viewer | glTF/GLB, `camera-controls`, kein AR-Knopf |

## Lücken

| Id | Name | Satz |
|---|---|---|
| L1 | Gerät | Kein Depth-Gerät hat den Durchblick und die Mesh in dieser Planung gehalten. A1 bis A3 bleiben offen. |
| L2 | Klassen auf dem Handy | roomform klassifiziert auf Modal. Eine Quelle, die `bed` und `desk` auf dem Gerät liefert und nicht CC BY-NC ist, fehlt. |
| L3 | Katalog | „Tausche“ ist der Pose-Tausch der gescannten Kästen. Ein neues Schreibtisch-Modell aus einem Katalog ist nicht entschieden. |
| L4 | Geschlossenes GLB | Raw Depth liefert Punkte. model-viewer will glTF oder GLB. Eine lizenzierte Umformung zur geschlossenen Oberfläche auf dem Handy fehlt. Bis dahin zeigt Sprint 8 die Tiefen-Mesh. |
| L5 | Apfel | Niemand hat auf einem Depth-Gerät geprüft, dass die Punkte der Apfel sind und nicht der Raum dahinter. A6 bis A8 bleiben offen. |

## Projekt-Gateway

No-Go für den Bau von Leeren, Tausch und für eine geschlossene GLB. Go für den Plan als Plan: die Bedingung steht, die Vorbilder sind benannt, die Lücken heißen L1 bis L5. `Umsetzen` baut S1 bis S3 und S6 bis S9 erst, wenn ein Gerät die offenen Gates auf Go setzt. S4 und S5 bleiben liegen, bis L2 eine Quelle hat. S8 zeigt bis L4 die Tiefen-Mesh, nicht eine erfundene geschlossene Schale.
