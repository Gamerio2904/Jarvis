# Zwei Fenster

Die bestätigte Kopplung und der begrenzte Oberflächenbefehl sind bereits als
Basis vorhanden. Der ursprüngliche Plantext unten dokumentiert die
Anforderungen dieser Lieferung. Der sichere Ausbau für denselben
Hausstand-/App-Versionsstand, expliziten Serverstart und Projekt-/Sprintansicht
steht in [`102-next.md`](./102-next.md), Sprints 483–494.

Plan nach [`plan-vorlage.md`](./plan-vorlage.md). S1, S2 und S3 sind in App-Code `18.25.12` gebaut. Ab `18.25.13` hört die Kopplung weiter, wenn die Fläche nicht vorn liegt. Der Hausstand-Abgleich ist teilweise in Test-APK `18.31.5` enthalten; sichere Weiterentwicklung und Projekt-/Sprintansicht stehen in [`102-next.md`](./102-next.md).

## Bedingung

Plane ein neue sFeature. mach dazu deep research im Internet. Ich möchte mein hnady per befehl verbinden. darauf kann ich dann verschiuedene dinge darauf öffnen. akkes aus der ajrvis ap wie tischplatte auf ahupt bildschirm handy zeigt lage oder erweiterung zur tischlage.

Danach, wörtlich: Tischlage gibt es nicht. Im Grunde möchte ich Ultron sagen, verbinde das Handy. Dann schickt Ultron eine kopplungsanfrage ans Handy. wenn die App auf dem Handy geöffnet wird soll ein kleíner bildschirm darüber egal was da ist aufploppen mit der kopplungsanfrage, die ich einfach nur bestätign muss. sonst eine Benachrichtigung aufs handy die ich anklicken kann, um die Kopplunsganfrage in derULrton app zu öffnen. Wenn beides gekoppelt ist kann Ultron per befehl alles auf dem handy bzw dem Tablett anzeigen. Es Soll ein Ultron laufen auf dem hauptgerät, aber ultron hat sozusagen 2 Fenster, die er frei steuern und nutzen kann.

Gelesen als: Ein Ultron läuft auf dem Hauptgerät. `Verbinde das Handy` schickt eine Kopplungsanfrage an das zweite Gerät. Liegt die App dort vorn, liegt ein kleines Blatt über der aktuellen Fläche, und ein Tipp bestätigt. Sonst kommt eine Benachrichtigung; ein Tipp öffnet die App auf dieser Anfrage. Danach hat dieses Ultron zwei Fenster und zeigt per Satz auf dem Handy oder dem Tablet, was die App schon kann. Eine Tischlage gibt es nicht.

## Rahmen dieses Projekts

Die Rahmen der Vorlage gelten. Dazu, enger:

1. Nur dasselbe WLAN. Ein Host nur `192.168…` oder `10…`, dieselbe Regel wie `frontend/src/engine/pc-host.ts`. Kein Relais über das Internet.
2. Kein Bildschirm-Mitschnitt, kein H.264, kein WebRTC-Bild. Jedes Fenster zeichnet die App selbst.
3. Eine Tischlage gibt es nicht. Ein Fenster zeigt eine Fläche, die es schon gibt: Start, Tischplatte, Lage, Chat, Kalender, Filme und die übrigen vorhandenen.
4. Bestätigen ist ein Tipp. Niemand tippt einen Code ab.
5. Ein Ultron auf dem Hauptgerät. Das zweite Fenster ist ein Handy oder ein Tablet, nicht ein zweites Hirn.
6. Fremder Quelltext bleibt draußen.

## Quellen

Gesucht, weil die erste Bedingung Recherche im Internet verlangt. Die zweite Bedingung setzt den Schnitt neu: Bestätigen statt Code, zwei Fenster statt Tischlage.

| Name | Adresse | Was dort steht |
|---|---|---|
| Telemachus | https://github.com/VariableThe/telemachus | Android wird ein zweiter Monitor. QR mit Token, WLAN, Bild als H.264 oder HEVC. Die Funkstrecke ist nicht verschlüsselt und nur für ein vertrautes Netz gedacht. |
| LinGlide | https://github.com/BeckhamLabsLLC/LinGlide | Das Handy ist ein zweiter Linux-Monitor im Browser. PIN, Token, H.264 über WebSocket. |
| Deskreen | https://deskreen.com/ | Browser wird zweiter Schirm, WebRTC, auch nur im lokalen WLAN. |
| VibeLink | https://github.com/IceSeaOnly/vibe_link | Handy steuert einen Mac im LAN. QR und Token. Befehle sind feste Vorgaben auf dem Rechner, keine freie Shell. |
| TVCompanion | https://github.com/avnishkirnalli/TVCompanion | Zwei Android-Apps im selben WLAN. Eine findet die andere, ein Code paart, TCP trägt Befehle. Ein Bildstrom ist ein eigener Schritt. |
| NodePilot | https://github.com/Elgeryy1/NodePilot | Gleicher LAN-Weg. Die andere Seite sagt Ja oder Nein. Der Rechner speichert nur einen Hash des Schlüssels. Kein Cloud-Weg. |
| phoneMonitor | https://github.com/mabyes1/phoneMonitor | Das zweite Gerät zeigt eine gewählte Fläche, nicht zwingend die Pixel des ersten. Die andere Seite erlaubt die Paarung. |
| LAN-browser | https://github.com/shubh2moon-hub/LAN-browser | Zwei Geräte teilen einen Stand über ein lokales WebSocket. Kein Mitschnitt des ganzen Schirms. |
| Lynk | https://github.com/am-will/lynk | Das Handy paart sich mit einem Rechner für Sprache und Chat. Nicht, um eine zweite Fläche zu öffnen. |
| Ultron-PC-Host | `frontend/src/engine/pc-host.ts` | Das Handy darf `localhost`, `192.168…` und `10…`. Nicht `172`, nicht das offene Internet, kein Hostname. |
| Dock | `frontend/src/App.tsx` | Die Flächen Start, Tisch, Lage, Chat, Kalender und Filme gibt es schon. Eine Tischlage gibt es nicht. |
| Benachrichtigung | `frontend/src/native/notify.ts` | Der jetzige Weg legt einen Alarm auf eine Uhrzeit. Er öffnet keine Kopplungsanfrage. Diesen Weg gibt es neu. |

## Anforderungen

A1. `Verbinde das Handy` und `Verbinde das Tablet` auf dem Hauptgerät schicken eine Kopplungsanfrage an das zweite Gerät im erlaubten Netz. Abnahme: Ohne antwortendes Gerät sagt das Hauptgerät, dass keins da ist. Ein Host außerhalb `192.168` oder `10` wird abgelehnt. Es entsteht keine Kopplung ohne Anfrage. Gateway `go`.

A2. Liegt die App auf dem zweiten Gerät vorn, liegt ein kleines Blatt über der aktuellen Fläche. Abnahme: Darunter bleibt, was offen war. Auf dem Blatt steht, welches Hauptgerät fragt. Ein Tipp bestätigt, ein Tipp lehnt ab. Es gibt nichts abzutippen. Ablehnen koppelt nicht. Gateway `go`.

A3. Liegt die App nicht vorn, kommt eine Benachrichtigung. Abnahme: Ein Tipp darauf öffnet die App auf dem Blatt aus A2. Öffnet man die App später von Hand, liegt dasselbe Blatt über der Fläche, solange die Anfrage gilt. Gateway `go`.

A4. Nach dem Bestätigen steuert das eine Ultron auf dem Hauptgerät zwei Fenster. Abnahme: Ein Satz nennt das Handy oder das Tablet und eine vorhandene Fläche, und die öffnet auf diesem Fenster. Das Hauptgerät bleibt das eine Ultron. Fehlt die Kopplung, sagt er das und öffnet nichts auf einem erfundenen Gerät. Gateway `go`.

## Entscheidungen

E1. Kein Bildstrom. Grund: Telemachus, LinGlide, Deskreen und VibeLink schicken Pixel. Die Fenster zeichnen die vorhandenen Flächen selbst. Gateway `go`.

E2. Die Kopplung ist eine Anfrage plus ein Tipp, kein Code zum Abtippen. Grund: Die zweite Bedingung verlangt nur das Bestätigen. NodePilot lässt die andere Seite Ja oder Nein sagen. Das Blatt nennt das Hauptgerät, damit das Ja zu dieser Anfrage gehört. Der Schlüssel nach dem Ja liegt nur als Hash. Gateway `go`.

E3. Ein Ultron, zwei Fenster. Das Hauptgerät ist Fenster eins. Fenster zwei ist das bestätigte Handy oder das bestätigte Tablet. Eine neue bestätigte Kopplung löst das vorige zweite Fenster ab. Eine Tischlage gibt es nicht. Gateway `go`.

E4. Das Blatt liegt über der aktuellen Fläche, sobald die App vorn ist. Sonst trägt die Benachrichtigung denselben Weg. Grund: Die zweite Bedingung nennt beide Fälle. Der Wecker-Alarm in `notify.ts` ist nicht dieses Blatt. Gateway `go`.

## Sprints

### S1 — Anfrage vom Hauptgerät

Ziel: `Verbinde das Handy` oder `Verbinde das Tablet` schickt eine Kopplungsanfrage an ein Ultron im erlaubten WLAN. Ohne Antwort sagt das Hauptgerät das.

Anforderungen: A1.

Lieferumfang:

- S1-1. Der Satz sucht im erlaubten Netz ein wartendes zweites Gerät und schickt die Anfrage. Fertig, wenn das Hauptgerät die Anfrage nur bei einer Antwort als unterwegs bezeichnet. Quelle: TVCompanion, https://github.com/avnishkirnalli/TVCompanion
- S1-2. Fremde Hosts fallen durch. Fertig, wenn `172` und eine öffentliche Adresse denselben Ablehnsatz bekommen wie der PC. Quelle: `frontend/src/engine/pc-host.ts`

Gateway `go`. Go, wenn ohne Gegenstelle ein ehrlicher Satz steht und kein Host außerhalb der Regel eine Anfrage bekommt. No-Go, wenn der Satz koppelt, ohne dass eine Anfrage hinausging. Abbruch: kein Gerät hört, oder der Host ist nicht erlaubt. Dann gibt es keinen Kanal. Hängt an A1.

Prompt: Auf dem Hauptgerät schicken „Verbinde das Handy“ und „Verbinde das Tablet“ eine Kopplungsanfrage an ein Ultron im selben WLAN, nur 192.168 oder 10. Kommt keine Antwort, sagt das Hauptgerät das. Kein Code zum Abtippen, kein Bildstrom, keine Tischlage, kein fremdes Paket. Abbruch, wenn kein Gerät hört oder der Host nicht erlaubt ist.

### S2 — Blatt oder Benachrichtigung

Ziel: Die Anfrage liegt als kleines Blatt über der aktuellen Fläche, sobald die App vorn ist. Sonst kommt eine Benachrichtigung, deren Tipp die App auf diesem Blatt öffnet.

Anforderungen: A2, A3.

Lieferumfang:

- S2-1. Kleines Blatt über der offenen Fläche, Bestätigen oder Ablehnen, der Absender steht darauf. Fertig, wenn die Fläche darunter bleibt und Ablehnen nicht koppelt. Quelle: NodePilot, https://github.com/Elgeryy1/NodePilot
- S2-2. Benachrichtigung, wenn die App nicht vorn ist. Fertig, wenn ein Tipp und ein späteres Öffnen dasselbe Blatt zeigen. Quelle: `frontend/src/native/notify.ts`

Gateway `go`. Go, wenn beide Wege dasselbe Blatt öffnen und ein Tipp genügt. No-Go, wenn ein Code abzutippen ist oder das Blatt die Fläche darunter ersetzt. Abbruch: der Prozess auf dem zweiten Gerät ist tot. Dann kommt keine Benachrichtigung, und das Hauptgerät sagt, dass keine Antwort kam. Hängt an S1, A2 und A3.

Prompt: Auf dem zweiten Gerät liegt die Anfrage als kleines Blatt über der aktuellen Fläche, sobald die App vorn ist. Nur Bestätigen oder Ablehnen. Ist die App nicht vorn, kommt eine Benachrichtigung; ein Tipp öffnet die App auf diesem Blatt. Bestätigen koppelt, Ablehnen nicht. Der Wecker-Alarm ist nicht dieses Blatt. Abbruch, wenn der Prozess tot ist: dann gibt es keine Benachrichtigung.

### S3 — Zwei Fenster

Ziel: Nach dem Bestätigen steuert das eine Ultron auf dem Hauptgerät das Hauptfenster und das zweite Fenster. Ein Satz zeigt auf dem Handy oder dem Tablet eine vorhandene Fläche.

Anforderungen: A4.

Lieferumfang:

- S3-1. Ein Satz nennt Handy oder Tablet und eine vorhandene Fläche, und die öffnet auf diesem Fenster. Fertig, wenn Tischplatte, Lage, Chat und Kalender so auf dem zweiten Fenster ankommen. Quelle: Dock in `frontend/src/App.tsx`
- S3-2. Ohne Kopplung ein ehrlicher Satz. Fertig, wenn nichts auf einem erfundenen Gerät aufgeht. Quelle: leer.

Gateway `go`. Go, wenn das Hauptgerät das eine Ultron bleibt und das zweite Fenster nur nach A2 existiert. No-Go, wenn eine Tischlage, ein zweites Hirn oder ein Bildstrom dazukommt. Abbruch: die Kopplung fehlt oder reißt. Dann sagt das Hauptgerät das und lässt das zweite Fenster los. Hängt an S2 und A4.

Prompt: Nach dem Bestätigen steuert das eine Ultron auf dem Hauptgerät beide Fenster. Ein Satz nennt Handy oder Tablet und eine vorhandene Fläche, und die öffnet dort. Kein zweites Hirn, keine Tischlage, kein Bildstrom. Fehlt die Kopplung, sagt er das und öffnet nichts auf einem erfundenen Gerät.

## PSP

P1. Anfrage vom Hauptgerät. Paket P1-1: Satz schickt die Anfrage nur an ein hörendes Gerät im erlaubten Netz. Ergebnis: A1. Fertig, wenn ohne Antwort ein ehrlicher Satz steht. Abbruch, wenn keines hört oder der Host fremd ist. Hängt an nichts.

P2. Blatt oder Benachrichtigung. Paket P2-1: Blatt über der Fläche und Benachrichtigung auf dasselbe Blatt. Ergebnis: A2 und A3. Fertig, wenn ein Tipp bestätigt und Ablehnen nicht koppelt. Abbruch, wenn der Prozess tot ist. Hängt an P1.

P3. Zwei Fenster. Paket P3-1: Satz öffnet eine vorhandene Fläche auf dem zweiten Fenster. Ergebnis: A4. Fertig, wenn das Hauptgerät das eine Ultron bleibt. Abbruch ohne Kopplung. Hängt an P2.

## Risiken

R1. Jemand im selben WLAN kann eine Anfrage schicken. Das Blatt nennt das Hauptgerät, und erst der Tipp koppelt. Quelle: NodePilot.

R2. Ein Bildstrom bräuchte Aufnahme-Recht und ein fremdes Verfahren. Deshalb ist er nicht im Plan. Quelle: Telemachus, Deskreen.

R3. Ist der Prozess auf dem zweiten Gerät tot, erreicht ihn keine Anfrage aus dem WLAN. Eine Cloud-Zustellung gibt es nicht. Siehe L1.

## Schnittstellen

Vorhanden: die Flächen im Dock, die Host-Regel des PC, das Recht für Benachrichtigungen. Neu: die Anfrage, das Blatt, die Benachrichtigung, die auf dieses Blatt öffnet, und der Satz, der ein Fenster und eine vorhandene Fläche nennt.

## Lücken

L1. Eine vom System beendete App hört nicht und kann die Benachrichtigung nicht selbst legen. Diese Sprints holen sie nicht über einen Cloud-Dienst zurück.

L2. Handy und Tablet gleichzeitig wären ein drittes Fenster. Hier bleibt es bei zwei: Hauptgerät und ein bestätigtes zweites Gerät. Eine neue Kopplung löst die vorige ab.

L3. Ob ein Finger auf der Tischplatte im einen Fenster dieselbe Tafel im anderen sofort schiebt. Diese Sprints öffnen und nutzen je Fenster eine vorhandene Fläche. Das gleichzeitige Schieben ist nicht entschieden.

## Projekt

Gateway `go`. Go, weil A1 bis A4, E1 bis E4 und S1 bis S3 je Abnahme und Abbruch haben und L1 bis L3 benannt sind. No-Go, wenn ein Sprint eine Tischlage, einen Bildstrom, einen öffentlichen Host oder fremden Quelltext will.
