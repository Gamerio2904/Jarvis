# Flächen, Kopplung, Kalender, Kugel, Watchliste

Plan nach [`plan-vorlage.md`](./plan-vorlage.md). Die Sprints sind die gemeldeten Bugs. In diesem Stand ist der Code dazu gebaut, weil die Meldung beides verlangt hat: analysieren, fixen, und als Sprints in die Planung.

## Bedingung

Die Kopplung mit dem Handy funktioniert nicht. Auf dem Handy kommt die Benachrichtigung „Ultron hört im WLAN auf eine Kopplung“, koppeln geht trotzdem nicht. Termine werden nicht richtig angenommen bzw. falsch benannt. Der Knopf „Termin“ unten rechts schwebt nicht in der Mitte. „Öffne den Planungsmodus“ öffnet nicht die Tischplatte. „Zeige mir Toki“ zoomt auf den eigenen Standort, nicht auf Tokio. „Öffne Kalender“ geht nicht; interne Flächen (Tischplatte, Kalender, Lage und die übrigen) sollen per Befehl auf und zu gehen. In der Watchliste fehlt oben die Markierung der gewählten Liste, die Filme sind zu groß, der Publikumsscore fehlt in der Zeile, und ein Film darf nie doppelt in einer Liste stehen.

## Rahmen

1. Kein erfundener Publikumsscore. OMDb liefert ihn nur, wenn `tomatoUserMeter` oder eine Rotten-Tomatoes-Audience-Zeile da ist. IMDb bleibt IMDb.
2. Kein Kauf, keine neue Shop-API.
3. Kopplung bleibt im LAN (`192.168…`, `10…`, dazu `172.16…`–`172.31…` für Hotspots). Kein Weg über das Internet.

## Sprints

### S438 — Kopplung findet das Handy

Ziel: Die lauschende Benachrichtigung bedeutet, dass eine Anfrage ankommt.

Befund: UDP hing an der einzelnen LAN-IP. Android liefert Broadcasts nur an `0.0.0.0`, und ohne Multicast-Lock filtert das WLAN sie. Ein Handy im Querformat galt als Tablet (`min-width: 900px`), „Verbinde das Handy“ fand es nicht. `172.16…` (Hotspot) galt nicht als LAN.

Lieferumfang: Socket auf allen Schnittstellen, Multicast-Lock, Art über die kurze Kante (unter 700 px = Handy), privates `172.16/12` nur für die Fenster-Kopplung.

Gateway `go`. Hängt an nichts.

### S439 — Termin-Name und schwebender Knopf

Ziel: Der Titel ist der Anlass, kein Wochentag. Der Knopf „＋ Termin“ schwebt unten in der Mitte, über dem Kalender, nicht in der Liste.

Befund: „am Freitag“ wurde als Ort gelesen, der Titel verlor den Rest oder zeigte den Tag. `position: fixed` lag im Kalender mit `backdrop-filter`, der Knopf klebte in der Fläche.

Lieferumfang: Wochentag und Uhr sind kein Ort. Der Knopf geht per Portal an `document.body`, mittig, `z-index` über der Fläche.

Gateway `go`. Hängt an nichts.

### S440 — Planungsmodus öffnet die Tischplatte

Ziel: „Öffne den Planungsmodus“ zeigt die Tischplatte, auch wenn man gerade im Chat ist.

Befund: Der Parser kannte nur „Planungsbildschirm“. War die Tischplatte in den Einstellungen schon an, blieb der Chat vorn.

Lieferumfang: `Planungsmodus` wie der Planungsbildschirm. Nach der Antwort ruft die Fläche `showTischplatte` auf.

Gateway `go`. Hängt an nichts.

### S441 — Tokio, auch als „Toki“

Ziel: „Zeige mir Toki“ fliegt nach Tokio, nicht auf den eigenen Standort.

Befund: Das Ortsverzeichnis kannte `tokio` und `tokyo`, nicht die gekürzte Form. Ohne Treffer öffnet die Kugel ohne Ziel und bleibt am Standort.

Lieferumfang: `toki` zeigt auf Tokio (35.68, 139.69).

Gateway `go`. Hängt an nichts.

### S442 — Flächen per Satz auf und zu

Ziel: Kalender, Tischplatte, Lage, Filme, Chat, Start und Sprachmodus gehen per Befehl auf und zu.

Befund: „Öffne den Kalender“ traf weder den Kalender-Parser (`Kalender` ohne Verb) noch die App-Fläche. Die Stimme hat den Kalender-Befehl nicht an die Fläche gegeben.

Lieferumfang: Parser für öffnen und schließen. Chat und Stimme wenden dieselbe Fläche an.

Gateway `go`. Hängt an S440 für die Tischplatte.

### S443 — Watchliste: Reiter, Größe, Publikum, einmal

Ziel: Der gewählte Reiter ist sichtbar. Filme stehen kompakt untereinander mit Bild, Kritiker, Publikum, IMDb. Kein Film zweimal in derselben Liste.

Befund: Der aktive Reiter schrieb fast schwarze Schrift auf den dunklen Balken, der rote Daumen lag oft nicht darunter. Karten waren 76 % breit mit hohem Poster, die Noten fielen aus dem sichtbaren Bereich (`overflow: hidden`). Gleiche Titel mit Artikel („The …“) landeten als zweite Zeile.

Lieferumfang: Roter Grund am gewählten Reiter. Zeile mit kleinem Poster. Publikum aus OMDb, sonst „—“, nie die IMDb-Note als Publikum. Vor dem Anzeigen werden Doppelte zusammengelegt.

Gateway `go`. Hängt an nichts.

## Projekt-Gateway

`go`. Die sechs Sprints sind im Code dieses Stands. Ein neuer Sideload ist nicht Teil dieses Plans.
