# Tablet als Hausstand-Server und automatische Synchronisierung

Plan nach [`plan-vorlage.md`](./plan-vorlage.md). Die manuelle Geräte-Kopplung
und QR-Übertragung aus [`handy-flaeche-plan.md`](./handy-flaeche-plan.md) sind
vorhanden. Ein dauerhaft laufender Tablet-Server, automatische Wiederverbindung
und Hausstand-Synchronisierung sind noch nicht gebaut. Die Sprints sind Planung,
keine Aussage über bereits gelieferte Funktionen. Umsetzung erst nach
`Umsetzen`.

## Bedingung

Ein Tablet soll Jarvis im selben lokalen WLAN dauerhaft als Hausstand-Server
bereitstellen. Das Handy soll sich nach einer einmaligen bestätigten Kopplung
automatisch verbinden und Änderungen am Hausstand abgleichen.

## Gelesene Bedingung

Das Tablet ist der lokale Server, das Handy der verbundene Client. Nach einer
einmaligen sicheren Kopplung finden und verbinden sich die Geräte im Heimnetz
selbst wieder, auch nach einem App-Neustart oder einem WLAN-Abbruch. Jarvis
erkennt Änderungen und vergleicht beide Hausstände. Vor dem Ersetzen eines
abweichenden Hausstands fragt Jarvis; erst ein bestätigtes Ja ersetzt den
älteren Stand als Ganzes. Nein lässt beide Geräte unverändert.

## Rahmen dieses Projekts

1. Kommunikation ausschließlich im selben lokalen WLAN, auf erlaubten
   `192.168…`- oder `10…`-Adressen. Kein Internet-Relay, Cloud-Sync oder
   öffentlicher Server.
2. Das Tablet ist der gewählte Server. Ein anderes Gerät wird nicht still
   Server oder Quelle.
3. Dauerbetrieb ist durch einen vom Nutzer eingeschalteten Android-
   Vordergrunddienst mit sichtbarer Benachrichtigung umgesetzt. Android kann
   ihn bei Force-Stop, Ausschalten oder herstellerspezifischer
   Energiesparregel dennoch beenden; Jarvis verspricht keine unerreichbare
   100%-Verfügbarkeit.
4. Nach Android-Neustart darf der Server nur wieder starten, wenn der Nutzer
   Dauerbetrieb ausdrücklich aktiviert hat und Android den Start erlaubt.
   Jarvis zeigt den tatsächlichen Serverstatus und Fehler an.
5. Der Hausstand umfasst dieselben Daten wie der bestehende Hausstand-Export,
   einschließlich Zugangsschlüsseln. Er wird nur an das bestätigte Handy
   übertragen und nie unverschlüsselt ins Internet gesendet.
6. Synchronisierung ersetzt nicht still. Bei unterschiedlichen oder nicht
   eindeutig geordneten Ständen fragt Jarvis. Nur Ja überschreibt den älteren
   Stand als Ganzes; Nein schreibt nichts. Ein Mischen von Einträgen ist nicht
   Teil dieses Plans.
7. Bei gleichem Stand gibt es keine Nachfrage und keinen Transfer. Bei
   unklarer Aktualität oder gleichzeitig geänderten Ständen wird nicht
   geraten und nicht geschrieben.
8. Planung allein ändert keinen Code, keine Version und kein APK.

## Quellen

Keine neue Web-Recherche beauftragt. Vorhandene lokale Schnittstellen:

| Quelle | Vorhandener Stand |
|---|---|
| [`handy-flaeche-plan.md`](./handy-flaeche-plan.md) | Bestätigte LAN-Kopplung zweier App-Fenster |
| `frontend/src/native/haus.ts` | Native QR-Angebots-, Pull- und Push-Schnittstelle |
| `frontend/native/haus/JarvisHausPlugin.java` | Temporärer WLAN-Endpunkt für die manuelle Hausstand-Übertragung |
| `frontend/src/engine/backup.ts` | Hausstand-Export und vollständiges Ersetzen beim Import |
| `frontend/src/native/presence.ts` | Vorhandenes LAN-Server-Muster mit Token und Start/Stop |
| `frontend/native/fenster/JarvisFensterService.java` | Vorhandenes Android-Vordergrunddienst-Muster |

## Anforderungen

A1. Das Tablet kann den Hausstand-Server ausdrücklich einschalten und
   ausschalten. Abnahme: Eine sichtbare Android-Benachrichtigung zeigt an, ob
   der Server läuft; Ausschalten beendet den Server und seine Netzannahme.
   Gateway `offen`.

A2. Der Server kann nach einem Android-Neustart wieder starten, wenn der Nutzer
   Dauerbetrieb aktiviert hat. Abnahme: Nach Neustart wird der Serverstatus
   korrekt angezeigt; bei verweigertem Start wird der Fehler sichtbar und
   Jarvis behauptet nicht, erreichbar zu sein. Gateway `offen`.

A3. Ein einmal bestätigtes Handy findet den Tablet-Server automatisch wieder.
   Abnahme: Gleiches WLAN, App-Neustart und kurzer WLAN-Abbruch stellen die
   Verbindung ohne erneuten QR-Scan her; unbekannte Geräte werden abgewiesen.
   Gateway `offen`.

A4. Beide Geräte zeigen ihren Verbindungs- und Synchronisationsstatus.
   Abnahme: Keine Verbindung, Server aus, ausstehende Bestätigung und
   erfolgreicher Abgleich sind unterscheidbar und verständlich angezeigt.
   Gateway `offen`.

A5. Jarvis vergleicht nach Kopplung und bei Änderungen beide vollständigen
   Hausstände. Abnahme: Gleiche Stände bleiben ruhig; vor einer Entscheidung
   wird kein Gerät verändert. Gateway `offen`.

A6. Bei einem eindeutig neueren Stand fragt Jarvis vor dem Ersetzen. Abnahme:
   Ja ersetzt ausschließlich auf dem älteren Gerät den gesamten Stand; Nein
   lässt beide unverändert. Die Frage erscheint nicht wiederholt, solange
   dieser Abgleich entschieden ist. Gateway `offen`.

A7. Bei gleichzeitig geänderten, gleich alten oder anderweitig nicht eindeutig
   geordneten Ständen stoppt Jarvis sicher. Abnahme: Keine automatische
   Überschreibung; beide Stände bleiben erhalten und die Unklarheit wird
   angezeigt. Gateway `offen`.

A8. Abgebrochene oder fehlerhafte Übertragung beschädigt keinen Hausstand.
   Abnahme: Der empfangende Stand wird erst nach vollständigem Empfang,
   Validierung und bestätigtem Abschluss atomar ersetzt; bei Abbruch bleibt
   der vorherige Stand lesbar. Gateway `offen`.

## Entscheidungen

E1. Tablet-Server und Handy-Client werden vom Nutzer einmalig festgelegt.
   Grund: Zwei gleichzeitig schreibende Server hätten keinen eindeutigen
   Gewinner. Gateway `go`.

E2. Der Android-Vordergrunddienst braucht eine sichtbare Benachrichtigung und
   eine bewusste Aktivierung. Grund: Betriebssystem und Nutzer müssen erkennen
   und kontrollieren können, dass das Tablet im Heimnetz erreichbar ist.
   Gateway `go`.

E3. Vorhandene Kopplung und Token sind die Vertrauensbasis; automatische
   Geräteerkennung allein autorisiert keinen Datentransfer. Grund: Die
   Hausstand-Datei enthält private Informationen und Schlüssel. Gateway `go`.

E4. Unterschiedliche Hausstände werden nicht zusammengeführt. Ein Ja ersetzt
   den älteren vollständig; bei unklarem Gewinner wird nicht geschrieben.
   Grund: Dieses Verhalten ist im bisherigen Hausstand-Sync-Plan festgelegt.
   Gateway `go`.

E5. Änderungen werden automatisch erkannt und abgeglichen, aber ein
   verlustbehaftetes Ersetzen benötigt weiterhin ein Ja. Grund: Ein lokaler
   Vergleich kann nicht entscheiden, ob ein nur auf einem Gerät vorhandener
   Eintrag entbehrlich ist. Gateway `go`.

## Sprints

### S1 — Tablet-Server kontrolliert dauerhaft betreiben

Ziel: Das Tablet kann den Hausstand-Server bewusst starten und stoppen, ohne
einen erfolgreichen Betrieb vorzutäuschen.

Anforderungen: A1, A2.

Lieferumfang:

- S1-1. Eine Server-Einstellung mit Status und Start/Stop steuert den
  bestehenden nativen WLAN-Endpunkt. Fertig, wenn Serverstatus und
  Benachrichtigung mit echtem Start/Stop übereinstimmen.
- S1-2. Der Server läuft als Android-Vordergrunddienst und wird nach
  Geräte-Neustart nur bei aktivierter Einstellung wieder gestartet. Fertig,
  wenn ein verweigerter Start als Fehler angezeigt wird.
- S1-3. Android-Energiesparhinweise erklären nötige Nutzerfreigaben, ohne eine
  Freigabe automatisch zu erzwingen. Fertig, wenn Jarvis keine
  Hintergrundverfügbarkeit verspricht, die das Gerät nicht bestätigt.

Gateway `offen`. Go, wenn Start, Stop, Bildschirm aus und Geräteneustart auf
den unterstützten Android-Versionen überprüft sind. No-Go, wenn die App einen
laufenden Server meldet, obwohl kein Endpunkt gebunden ist. Abbruch: Android
verweigert den Dienststart; der Server bleibt aus und zeigt den Grund.
Hängt an der vorhandenen nativen Hausstand-Übertragung.

Prompt: Baue den steuerbaren lokalen Tablet-Hausstand-Server als Android-
Vordergrunddienst mit sichtbarer Benachrichtigung und ehrlichem Status. Ein
Neustart darf ihn nur bei ausdrücklicher Nutzerfreigabe reaktivieren. Kein
WAN, kein Cloud-Relay, kein stiller Start und kein Versprechen gegen
Force-Stop oder Android-Energiesparen. Abbruch bei verweigertem Start: Server
aus, Fehler anzeigen.

### S2 — Handy sicher wiederfinden

Ziel: Das einmal bestätigte Handy findet den festgelegten Tablet-Server im
selben WLAN wieder, ohne einen neuen QR-Scan.

Anforderungen: A3, A4.

Lieferumfang:

- S2-1. Der Nutzer koppelt das Handy einmalig mit dem Tablet; Erkennung allein
  reicht nicht zur Autorisierung. Fertig, wenn unbekannte Geräte weder lesen
  noch schreiben können.
- S2-2. Das Handy entdeckt den gekoppelten Server im erlaubten LAN und
  verbindet sich nach App-Neustart selbst wieder. Fertig, wenn kein erneuter
  QR-Scan nötig ist.
- S2-3. Ein WLAN-Ausfall, eine geänderte lokale Adresse oder ein gestoppter
  Server führt zu „getrennt“ statt zu einer falschen Erfolgsmeldung. Fertig,
  wenn die App nach Rückkehr ins WLAN erneut sucht und den Status korrigiert.

Gateway `offen`. Go, wenn automatische Wiederverbindung nur mit dem bestätigten
Server im erlaubten WLAN gelingt. No-Go, wenn ein fremdes LAN-Gerät den
Hausstand lesen kann. Abbruch: Server nicht erreichbar oder Gerät nicht mehr
gekoppelt; keine Übertragung. Hängt an S1 und der vorhandenen Kopplung.

Prompt: Verbinde das einmal bestätigte Handy automatisch mit dem festgelegten
Tablet-Server im selben erlaubten LAN. Erhalte die Kopplung über App-Neustart
und WLAN-Unterbrechung. Neue oder unbekannte Geräte brauchen eine bestätigte
Kopplung. Kein WAN und kein stiller Datentransfer. Bei fehlendem Server
„getrennt“ anzeigen und später erneut suchen.

### S3 — Hausstandänderungen zuverlässig erkennen

Ziel: Beide Geräte können feststellen, ob ihre vollständigen Hausstände gleich
oder verschieden sind, ohne sie beim Vergleich zu verändern.

Anforderungen: A5, A7.

Lieferumfang:

- S3-1. Ein versionierter, validierter Hausstand-Fingerabdruck umfasst alle
  exportierten Bereiche, auch Schlüssel, ohne Schlüsselwerte in Logs oder
  Oberflächen auszugeben. Fertig, wenn identische Exporte denselben Vergleich
  ergeben und jede gespeicherte Änderung eine neue Version erzeugt.
- S3-2. Versionsdaten enthalten Gerätekennung und Änderungsreihenfolge.
  Gleichzeitige oder nicht belegbar geordnete Änderungen werden als Konflikt
  markiert. Fertig, wenn eine Uhrzeit allein keinen Gewinner erzwingt.
- S3-3. Der Vergleich wird nach Wiederverbindung und nach relevanten
  Speicheränderungen angestoßen und zusammengefasst statt in einer Schleife
  ständig neu gestartet. Fertig, wenn unveränderte Stände keine wiederholten
  Nachfragen oder Transfers auslösen.

Gateway `offen`. Go, wenn Gleichheit, eindeutiger Unterschied und Konflikt
reproduzierbar unterschieden werden und nie vor einer Entscheidung geschrieben
wird. No-Go, wenn Geheimnisse protokolliert werden oder Versionsgleichheit
fälschlich einen Gewinner auswählt. Abbruch: ungültige Versionsdaten; sicherer
Konfliktstatus ohne Schreibzugriff. Hängt an S2.

Prompt: Ergänze einen validierten Vergleich der vollständigen Hausstände mit
Versionskennung je Gerät. Verändere bei Vergleich nichts. Gleichheit muss
ruhig bleiben; gleichzeitige Änderungen und unklare Reihenfolge müssen als
Konflikt enden. Logge nie Schlüsselwerte. Starte den Vergleich nur nach
Änderung oder Wiederverbindung, nicht in einer dauernden Pollschleife.

### S4 — Differenz verständlich bestätigen lassen

Ziel: Jarvis fragt nur dann, wenn ein Stand nachweisbar neuer ist, und nennt
die Richtung des möglichen Abgleichs.

Anforderungen: A5, A6, A7.

Lieferumfang:

- S4-1. Bei gleicher Version kommt keine Frage; bei eindeutig neuerem Stand
  erscheint genau eine Bestätigungsanfrage. Fertig, wenn Wiederverbindung
  dieselbe offene Frage nicht vervielfacht.
- S4-2. Die Frage nennt Quelle und Zielgerät, ohne Schlüssel oder private
  Inhalte aufzulisten. Fertig, wenn klar ist, welches Gerät überschrieben
  würde.
- S4-3. Bei Konflikt oder gleichzeitigen Änderungen nennt Jarvis, dass er
  keinen Gewinner belegen kann, und bietet keine automatische Überschreibung
  an. Fertig, wenn beide Stände unverändert bleiben.

Gateway `offen`. Go, wenn nur ein belegter neuerer Stand zur Bestätigung
angeboten wird. No-Go, wenn bei Unsicherheit ein Gerät still gewinnt.
Abbruch: Verbindung reißt vor der Antwort; Frage bleibt offen, kein Schreiben.
Hängt an S3.

Prompt: Zeige bei verschiedenem Hausstand einmal die sichere Richtung und
frage vor dem Überschreiben: Ja ersetzt nur den älteren Stand vollständig,
Nein lässt beide unverändert. Gleiche Stände erzeugen keine Frage.
Gleichzeitige oder nicht belegbar geordnete Änderungen dürfen nicht
überschrieben werden. Wiederverbindung darf dieselbe offene Frage nicht
duplizieren. Keine Geheimnisse in der Frage.

### S5 — Bestätigten Stand atomar übertragen

Ziel: Erst nach Ja wird der neuere Hausstand sicher und vollständig auf das
ältere Gerät übertragen.

Anforderungen: A6, A8.

Lieferumfang:

- S5-1. Der Empfänger lädt in einen temporären Stand und validiert ihn vor dem
  Austausch. Fertig, wenn ungültiges oder unvollständiges JSON den aktiven
  Hausstand nicht berührt.
- S5-2. Der Austausch ist atomar und der Empfänger bestätigt erst nach
  erfolgreicher Speicherung. Fertig, wenn Abbruch vor Abschluss den vorherigen
  Stand erhält.
- S5-3. Eine Bestätigung gilt nur für genau die verglichenen Versionen.
  Fertig, wenn eine zwischenzeitliche Änderung erneut verglichen wird, statt
  einen veralteten Stand zu überschreiben.
- S5-4. Nein verwirft nur den Synchronisierungsvorschlag. Fertig, wenn beide
  Geräte danach ihre bisherigen Daten behalten und die Kopplung bestehen
  bleibt.

Gateway `offen`. Go, wenn Ja, Nein, Netzabbruch, ungültige Nutzlast und
zwischenzeitliche Änderung ohne Datenverlust getestet sind. No-Go, wenn ein
teilweiser Transfer den aktiven Stand beschädigt. Abbruch: Übertragungsfehler;
alter Stand bleibt aktiv und Fehler wird angezeigt. Hängt an S4.

Prompt: Übertrage den nach Ja bestätigten Hausstand nur an das gekoppelte
ältere Gerät. Lade und validiere zuerst temporär; ersetze den aktiven Stand
erst vollständig und atomar. Prüfe, dass Quelle und Zielversion noch dem
bestätigten Vergleich entsprechen. Bei Abbruch oder ungültigen Daten bleibt
der bisherige Stand unangetastet. Nein schreibt nichts.

### S6 — Neustart, Langlauf und Wiederherstellung abnehmen

Ziel: Der Ablauf bleibt über längere Zeit und typische Android-/Netzwerkfehler
verständlich und datenverlustfrei.

Anforderungen: A1 bis A8.

Lieferumfang:

- S6-1. Geräte-Neustart, App-Neustart, Bildschirm-aus, WLAN-Wechsel und
  Router-Neustart werden als getrennte Fälle geprüft. Fertig, wenn der
  tatsächliche Zustand jeweils korrekt angezeigt wird.
- S6-2. Ein Langzeittest prüft den eingeschalteten Tablet-Server über mindestens
  24 Stunden im normalen Heimnetz. Fertig, wenn der Test Ausfälle und
  Wiederverbindungen protokolliert, ohne sensible Hausstanddaten zu speichern.
- S6-3. Zwei Geräte mit gleichzeitig geänderten Daten, voller Speicher,
  Verbindungsabbruch und abgelehnter Android-Berechtigung werden getestet.
  Fertig, wenn kein Fall still überschreibt oder falsche Synchronität meldet.
- S6-4. Ein Nutzer kann den Server stoppen, Kopplungen widerrufen und einen
  letzten erfolgreichen Abgleich erkennen. Fertig, wenn jeder Vorgang
  verständlich bestätigt wird.

Gateway `offen`. Go, wenn alle Abnahmen A1–A8 bestanden sind und ein
Wiederherstellungstest belegt, dass fehlerhafte Transfers den vorherigen Stand
erhalten. No-Go bei unbemerktem Datenverlust, WAN-Erreichbarkeit oder
falschem Status. Abbruch: nicht reproduzierbarer Gerätefehler; Release bleibt
Test-Build. Hängt an S1 bis S5.

Prompt: Führe die End-to-End-Abnahme für Tablet-Dauerbetrieb und
Hausstand-Sync auf echten unterstützten Android-Geräten durch: Neustart,
Bildschirm aus, WLAN-/Router-Ausfall, gleichzeitige Änderungen, Ablehnung und
abgebrochene Übertragung. Belege, dass kein WAN offen ist und bei Fehlern der
vorherige Stand erhalten bleibt. Speichere keine Schlüssel oder privaten
Inhalte im Testprotokoll. Bei nicht reproduzierbaren Fehlern nicht freigeben.

## PSP

| Sprint | Paket | Ergebnis | Hängt an |
|---|---|---|---|
| S1 | P1-1 | Tablet-Server steuerbar und echter Status sichtbar | vorhandener Hausstand-Endpunkt |
| S1 | P1-2 | Vordergrunddienst und Neustartverhalten | P1-1 |
| S2 | P2-1 | Einmalige Vertrauensbindung zwischen Handy und Tablet | S1 |
| S2 | P2-2 | Automatische Entdeckung und Wiederverbindung | P2-1 |
| S3 | P3-1 | Versionierter Vergleich ohne Schreiben | S2 |
| S3 | P3-2 | Gleichheit und Konflikt sicher erkennen | P3-1 |
| S4 | P4-1 | Einmalige, verständliche Bestätigungsfrage | S3 |
| S5 | P5-1 | Validierter temporärer Empfang und atomarer Austausch | S4 |
| S5 | P5-2 | Abbruch- und Versionsschutz | P5-1 |
| S6 | P6-1 | Geräte- und Netzwerkausfälle abnehmen | S1–S5 |
| S6 | P6-2 | Langzeittest und Release-Gate | P6-1 |

## Risiken

R1. Android-Hersteller können Vordergrunddienste nach ihren Energiesparregeln
   einschränken. Jarvis kann den Status anzeigen und die nötigen Einstellungen
   erklären, aber weder Stromversorgung noch Betriebssystemgarantien ersetzen.

R2. Die Hausstand-Datei enthält Zugangsschlüssel und persönliche Daten. Token,
   Netzbeschränkung und Kopplungswiderruf sind Voraussetzung; Inhalte dürfen
   nicht in Logs, Benachrichtigungen oder Fehlermeldungen erscheinen.

R3. Ein ganzer Hausstand-Austausch kann nur auf einem Gerät vorhandene Daten
   löschen. Die Ja/Nein-Abfrage und ein atomarer Austausch sind zwingende Tore.

R4. Geräteuhren können falsch oder verschieden eingestellt sein. Ein Zeitstempel
   allein ist kein belastbarer Gewinner; unklare Versionsstände bleiben
   Konflikt und werden nicht überschrieben.

R5. Eine lokale WLAN-Adresse kann wechseln. Die Wiederverbindung muss den
   gekoppelten Server neu finden, ohne die Vertrauensprüfung zu überspringen.

## Schnittstellen

Vorhanden sind QR-basierte Hausstand-Übertragung, ein nativer temporärer
WLAN-Endpunkt, Hausstand-Export/Import, bestätigte Fensterkopplung und ein
Android-Vordergrunddienst-Muster. Neu sind ein dauerhaft steuerbarer
Hausstand-Dienst, Start nach Nutzerfreigabe, Server-Erkennung, persistente
Vertrauensbindung, Versionsvergleich, Bestätigungszustand und atomarer
Empfangs-/Austauschablauf.

## Lücken

L1. Die genaue Android-Version und die Energiesparregeln des Tablet-Herstellers
   sind nicht angegeben. S6 muss das echte Zielgerät abnehmen.

L2. Der LAN-Entdeckungsweg für dynamische IP-Adressen ist noch nicht
   festgelegt. Die Auswahl (zum Beispiel lokaler Broadcast oder mDNS) ist im
   Implementierungssprint anhand vorhandener Android-/Netzwerkschnittstellen
   zu verifizieren; bis dahin keine Quelle oder Paketabhängigkeit erfinden.

L3. Automatisches Zusammenführen einzelner Änderungen ist ausdrücklich nicht
   entschieden und daher nicht enthalten. Dieses Projekt fragt vor dem
   vollständigen Ersetzen.

## Projekt-Gateway

Gateway `offen`. Go erst, wenn A1–A8 mit echten Android-Geräten abgenommen,
Wiederverbindung und atomare Wiederherstellung bestanden und LAN-/Schlüssel-
Schutz verifiziert sind. No-Go bei stiller Überschreibung, Zugriff aus dem
Internet, falschem Serverstatus oder nicht wiederherstellbarem Transferfehler.
