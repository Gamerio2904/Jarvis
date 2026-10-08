# 102 — Tablet als Server, Handy als zweiter Bildschirm **PLAN** (`18.36`–`18.38`)

**Bedingung:** Wenn Tablet und Handy dieselbe App-Version verwenden, verbindet
sich ein bereits bestätigtes Handy automatisch mit dem ausdrücklich gestarteten
Tablet-Server. Beide Geräte gleichen den Hausstand sicher ab. Ein Ultron auf dem
Tablet kann außerdem gezielt vorhandene Ansichten auf beiden Geräten öffnen,
zum Beispiel die Planung auf dem Tablet und die Sprints desselben Projekts auf
dem Handy.

**Planungsstand:** PLAN. Sprints **483–494**, drei Release-Gates
`18.36.0`–`18.38.0`. Die Freigabereihenfolge bleibt: erst Geräteabnahme des
Baseline-Builds `18.31.5`, dann Gates 467–482 aus [`101-next.md`](./101-next.md),
danach Release-Gates 483–494. Die Versionsnummern sind geplante Ziele, keine
gebauten oder freigegebenen APKs. Die Ist-Aufnahme unten beschreibt den
aktuellen Arbeitsbaum; vorhandener Code ersetzt weder die Gates noch die
Geräteabnahme.

## 1. Ist-Stand aus dem Code

- `JarvisHausPlugin` stellt den Hausstand im LAN auf Port 8765 bereit. Der
  Tabletmodus und der Server sind getrennt: `Starte den Server`,
  `Stoppe den Server` und eine Statusabfrage steuern den nativen Dienst.
  Ein gekoppeltes Handy kann den Server im /24-Netz wiederfinden.
- Der Hausstand-Kanal nutzt im Arbeitsbaum HTTPS mit TLS 1.2/1.3 und einem
  beim QR-Pairing gebundenen Zertifikat-Fingerprint. Das Token wird im
  `Authorization`-Header statt in der URL übertragen. Der Server prüft vor
  Hausstand-Payloads die exakte App-Version und Protokollversion 3.
- `JarvisFensterPlugin` verwendet weiterhin einen getrennten Kanal und eigene
  Kopplungsdaten; dessen Verkehr ist noch nicht in den gepinnten TLS-Kanal
  integriert. Auf JS-Seite tragen Fenster-Nachrichten jetzt Protokoll und
  App-Version; eingehende Befehle mit Versionsabweichung werden abgewiesen.
  Fenster-Tokens und Hausstand-Zugangsdaten sind aber noch keine gemeinsame,
  peerbezogene Vertrauensidentität mit getrennten, widerrufbaren Rechten.
- Der Hausstand-Abgleich verwendet jetzt einen persistenten Geräte-
  Revisionsvektor und SHA-256-Inhalts-Hash aus `sync-revisions.ts`. Backup,
  lokale Datenänderungen und Tablet-Sync verwenden denselben Umschlag. Gleiche
  Stände werden ausgelassen, eindeutige Dominanz wird übertragen und
  Nebenläufigkeit oder abweichender Inhalt wird als Konflikt blockiert statt
  nach Geräteuhr entschieden. Vor dem Übernehmen wird der lokale Stand
  gesichert; bei Fehlern wird eine Wiederherstellung versucht. Bei Konflikt
  wird jetzt ein kurzlebiges Konflikt-Ticket erzeugt: Die Wahl
  „Übernimm den Tablet-Stand“ oder „Übernimm den Handy-Stand“ gilt nur für
  exakt die beiden gezeigten Revisionen und läuft ab. Robuste Recovery-Goldtests
  und die Bestätigung auf realen Geräten fehlen noch.
- Eingehende Hausstand-Pushes enthalten jetzt Request-ID und Zeitprüfung,
  werden gegen Wiederholung begrenzt und erst nach JS-seitiger Prüfung und
  Anwendung nativ bestätigt. Der Pfad ist lokal gebaut, aber noch nicht auf
  Handy und Tablet ausgeführt; das ersetzt weder Replay-/Abbruchtests noch die
  Geräteabnahme.
- Das Fenster-Protokoll (`fenster-parse.ts`, `fenster.ts`,
  `fenster-net.ts`, `FensterSheet.tsx`) bietet bereits bestätigte Kopplung,
  LAN-Erkennung, Rückmeldung und eine Oberflächen-Allowlist. Unterstützt sind
  Start, Tischplatte, Lage, Chat, Kalender, Filme und Hören.
- Fenster-Steuerung (`fenster_pair_json`/`fenster_grant_json`) und
  Hausstand-Sync (`sync_url`/`sync_token`) haben momentan getrennte
  Vertrauensdaten und Pairing-Abläufe. Das Ziel ist eine bestätigte
  Geräteidentität mit getrennten, widerrufbaren Rechten für Sync und
  Oberflächensteuerung, nicht eine zweite Kopplung für denselben Partner.
  Das Hausstand-Token liegt derzeit in den App-Einstellungen und wird nicht
  bereits per Android-Keystore als Geheimnis geschützt.
- Ein Projekt-/Sprintfenster, ein Projektbezug zwischen den Geräten und eine
  Versionsprüfung für Fernsteuerung fehlen. Die Versionssperre des
  Hausstand-Kanals gilt nicht für Fernflächen-Befehle.
- Lokale Planrevisionen sind nicht mit dem Hausstand-Sync oder einem
  Fernflächen-Befehl verknüpft. Projekt-/Sprintansichten auf einem zweiten
  Gerät sind noch nicht implementiert.
- Die bisherige Hausstand-Sync-Planung steht in
  [`hausstand-sync-plan.md`](./hausstand-sync-plan.md); die bestätigte
  Zwei-Fenster-Kopplung ist in [`handy-flaeche-plan.md`](./handy-flaeche-plan.md)
  beschrieben. Dieser Plan erweitert beide, statt parallele Dienste oder einen
  zweiten Router anzulegen.
- Der lokale Debug-Build ließ sich mit dem installierten Android-SDK aus den
  aktuellen Quellen kompilieren. Er ist eine Test-APK, kein Release: Die
  Sprints bleiben PLAN, bis automatisierte Abnahme und reale Handy-/Tablet-
  Tests bestanden sind.

## 2. Zielverhalten

1. Auf dem Tablet sagt der Nutzer `Starte den Server`. Jarvis startet den
   LAN-Dienst sichtbar und meldet nur einen tatsächlich erreichbaren Status.
   Sobald sich das Handy verbindet, prüft Jarvis dessen App-Version vor jedem
   Sync und jeder Fernsteuerung. `Stoppe den Server` beendet den Dienst und
   widerruft die aktuelle Netzannahme.
2. Ein bereits bestätigtes Handy im selben WLAN findet den Server automatisch
   wieder und verbindet sich. Nach dem Verbindungsaufbau werden Versionen und
   Hausstand verglichen; gleiche Stände übertragen nichts.
3. Nur bei exakt gleicher App-Version und unterstütztem Protokoll sind
   automatische Hausstand-Synchronisierung und Fernsteuerung erlaubt. Bei
   Versionsunterschied gibt es keine Datenübertragung und keine
   Fernsteuerung; Jarvis nennt die Versionen und verlangt, beide Apps
   ausdrücklich zu aktualisieren.
4. Ein kausal eindeutig neuerer Hausstand wird automatisch und vollständig
   auf den älteren übernommen. Vor dem atomaren Austausch wird lokal ein
   Wiederherstellungspunkt gesichert. Der Abgleich umfasst Kalender, Aufgaben,
   Notizen und die übrigen Hausstand-Daten; Geheimnisse werden weder angezeigt
   noch protokolliert.
5. Wenn beide Geräte seit dem letzten gemeinsamen Stand Änderungen haben,
   lässt sich kein Gewinner belegen: beide Stände bleiben erhalten. Jarvis
   zeigt einen Konflikt an und verlangt eine ausdrückliche Gerätewahl. Keine
   automatische Zusammenführung und kein Last-write-wins nach Geräteuhr.
6. Von einem Satz auf dem Tablet können gezielt Ansichten auf jedem Gerät
   geöffnet werden. Beispiel: `Öffne den Planungsmodus` öffnet die Planung auf
   dem Tablet; `Öffne die Sprints auf dem Handy` zeigt auf dem Handy die
   Sprintansicht des ausgewählten Projekts. Ein zusammengesetzter Befehl darf
   beide Schritte ausführen, muss aber beide Bestätigungen des Zielgeräts
   erhalten.
7. Der zweite Bildschirm rendert die vorhandene App-Oberfläche selbst. Es
   werden weder Bildschirmbilder noch Chatverläufe übertragen. Ein Projekt wird
   über seine ID und eine bestätigte, aktuelle Planrevision referenziert.

## 3. Sicherheits- und Betriebsregeln

- **Kein Erstvertrauen durch Erkennung:** Eine erstmalige Kopplung erfordert
  weiterhin eine sichtbare Bestätigung auf dem Handy. Nur ein gespeichertes,
  widerrufbares Pairing darf sich danach automatisch verbinden. Eine
  Bestätigung stellt einmalig die Geräteidentität her; Sync und
  Oberflächensteuerung erhalten getrennte, widerrufbare Rechte. Ein
  Startbefehl autorisiert kein unbekanntes Gerät.
- **Geschützter Transport:** Vor Sync oder Fernsteuerung muss der native
  Gerätekanal TLS 1.2+ mit gepinntem Geräte-Zertifikat verwenden. Das Zertifikat
  wird beim bestätigten Pairing gebunden. Der Hausstand-Kanal hat diese
  Absicherung im Arbeitsbaum bereits; die Fenster-Steuerung muss sie noch
  erhalten. Falls die native Implementierung die Vertrauensbindung nicht
  zuverlässig herstellt, gilt der Sicherheits-Gate als No-Go; kein
  unverschlüsselter Rückfall.
- **Keine Geheimnisse in URLs:** Tokens und Schlüssel wechseln aus URL,
  Querystring und Logs in authentifizierte Header und geschützte lokale
  Speicherung. Das Hausstand-Token wird im Arbeitsbaum bereits als Bearer-
  Header übertragen. Geschützte Speicherung, getrennte Peer-Rechte sowie
  Nonce, Ablaufzeit und Request-ID gegen Wiederholung bleiben offen.
- **Begrenztes LAN:** Nur direkte private IPv4-LAN-Adressen der bestehenden
  Freigabe (`10/8` und `192.168/16`) und die vorhandenen
  Android-Network-Permissions. Keine Internet-Weiterleitung, Cloud, Port-
  Freigabe, Hostname-Umgehung oder Bindung an öffentliche Interfaces.
  Eingehende Daten haben Größenlimits, Schema-/Versionsvalidierung und
  Rate-Limits.
- **Versionssperre vor Inhalt:** Handshake tauscht zuerst nur Protokollversion,
  App-Version, Gerätekennung und Hausstand-Revision aus. Unpassende Versionen
  erhalten keine Hausstand-Payload und keine Fernsteuerungsrechte.
- **Allowlist statt Fernbedienung:** Zulässig sind nur benannte Oberflächen-
  Aktionen und validierte Projekt-IDs. Kein beliebiger URL-Aufruf, JavaScript,
  Shell-Befehl, Chattext oder stilles Ausführen von Tools. Das Zielgerät
  bestätigt Empfang und tatsächlich geöffnete Fläche.
- **Android-Grenzen ehrlich anzeigen:** Der Dienst läuft nur nach Nutzerstart
  oder explizit aktivierter Wiederaufnahme mit sichtbarer Benachrichtigung.
  Android kann ihn bei Force-Stop, Neustart ohne Erlaubnis oder
  Energiesparregeln beenden. Ohne freigegebenen Handy-Hintergrunddienst
  verbindet sich das Handy automatisch, sobald die App geöffnet wird oder
  zurückkehrt; Jarvis verspricht kein heimliches Aufwecken der App.
- **Datenschutz:** Hausstand-Payloads werden nur zwischen dem bestätigten
  Geräte-Paar verarbeitet. Diagnose enthält Status, Version, Revision und
  Fehlercode, niemals Schlüsselwerte, Notiztexte oder vollständige Payloads.

## 4. Synchronisationsmodell

`stand_at` bleibt Anzeigeinformation, ist aber kein Beweis für die Reihenfolge.
Der Sync-Umschlag bekommt eine Schema-Version, kanonischen Inhalts-Hash, stabile
Geräte-IDs und einen persistenten Revisionsvektor je gekoppeltem Gerät. Eine
Revision dominiert eine andere nur, wenn sie deren Zähler für alle Geräte
mindestens erreicht und für mindestens ein Gerät überschreitet.

| Vergleich | Verhalten |
|---|---|
| Gleicher Revisionsvektor und gleicher Hash | Kein Transfer |
| Eine Revision dominiert die andere | Neueren vollständigen Stand automatisch und atomar übernehmen; vorher lokalen Wiederherstellungspunkt sichern |
| Vektoren sind gleich, Hashes verschieden oder Änderungen sind nebenläufig | Konflikt; beide Stände behalten, Quelle ausdrücklich wählen |
| Unbekanntes Schema, ungültige Nutzlast oder Versionsmismatch | Abbrechen; kein aktiver Stand wird verändert |

Nach erfolgreicher Übernahme bestätigen Empfänger und Server dieselbe
Request-ID, Revision und Inhalts-Hash. Wiederholte oder verspätete Requests sind
idempotent und dürfen keinen älteren Stand erneut einsetzen.

## 5. Anforderungen und Abnahme

| ID | Muss |
|---|---|
| A1 | Server explizit starten/stoppen; sichtbarer Status entspricht dem nativen Listener. |
| A2 | Vor Sync und Fernsteuerung exakte App-Version und Protokoll prüfen; Mismatch blockiert sicher. |
| A3 | Nach einmaliger Gerätebestätigung dasselbe Handy im selben WLAN automatisch wiederfinden; unbekannte Geräte bleiben ausgeschlossen. |
| A4 | Hausstandänderungen kausal vergleichen; eindeutigen neueren Stand automatisch übertragen; Konflikt bewahrt beide Stände. |
| A5 | Transfer validieren, lokal wiederherstellen können und atomar anwenden; Abbruch oder fehlerhafte Daten lassen den aktiven Stand unverändert. |
| A6 | Planung und Sprints des ausgewählten Projekts gezielt auf getrennten Geräten öffnen; Oberfläche, Projekt-ID und Revision werden bestätigt. |
| A7 | Schlüssel/Token geschützt übertragen und lokal schützen; keine Secrets in URL, Benachrichtigung, UI oder Logs. |
| A8 | WLAN-Verlust, Dienstende, Permission-Fehler, Versionsmismatch und Ablehnung sichtbar als getrennte Zustände melden. |

## 6. Sprints und Versionen

| Version | Sprints | Ziel |
|---|---:|---|
| `18.36.0` (`183600`) | 483–486 | Expliziter Server, geschütztes Pairing/Transport, Versionshandshake und Sicherheits-Gate |
| `18.37.0` (`183700`) | 487–490 | Revisionsvektor, konfliktfester automatischer Hausstand-Abgleich und Wiederherstellung |
| `18.38.0` (`183800`) | 491–494 | Zielgerichtete Zwei-Bildschirm-Befehle, Projekt-/Sprintansicht und End-to-End-Gate |

Die letzte Sprintgruppe jedes Release prüft Android real auf Tablet und Handy.
Unit-Tests oder ein APK-Build allein geben keine Version frei. Bei einem
Sicherheits- oder Datenverlustfehler wird das Release-Gate nicht bestanden.

Details: [`sprints/README.md`](./sprints/README.md) und
[`sprint-483.md`](./sprints/sprint-483.md) bis
[`sprint-494.md`](./sprints/sprint-494.md).

## 7. Nicht-Ziele

- Automatisches Installieren/Updaten einer App oder erzwungene Gleichschaltung
  der Versionen.
- Sync über Internet, Cloud, fremde Netze oder ohne Nutzer-Pairing.
- Zusammenführen beliebig verschiedener Datensätze ohne Konfliktentscheidung.
- Bildschirmspiegelung, Dateiübertragung beliebiger Dateien oder Fernzugriff
  auf Betriebssystemfunktionen.
- Neue zweite KI-Instanz, eigener Projektstore oder paralleler Sprachrouter.
