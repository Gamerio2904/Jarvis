# Android-APK — Test-Build `18.66.5`

Test-Build **`18.66.5`** (versionCode `186605`), debug-signiert:
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

Dieselbe Nummer steht in `frontend/package.json` und `APP_VERSION`.
`engineStamp` bleibt `18.60.0-ygo-md`. Die Android-Geräteabnahme mit ARCore
steht noch aus. Diese APK ist nur zum Testen gedacht, keine finale
Release-Freigabe.

**Neu in 18.66.5:** Der Termin-Knopf verschwindet beim Bearbeiten. Einkauf und To-do sind je eine Liste. Deadline-Aufgaben stehen in der To-do-Liste. Conrad spricht. Die Flugzeug-Schicht liegt einmal und bleibt lesbar. Der Würfel bleibt liegen, die Hand greift ihn.

**Neu in 18.66.4:** Der Würfel ist massiv und leuchtet an den Kanten. Er bleibt auf der Fläche im Blick, statt nach unten aus dem Bild zu fallen. Über der Hand liegt das Tracking-Gitter. Die Leiste unten ist auf der Welt aus.

**Neu in 18.66.3:** Der Kalender zeigt die Tage auf einen Blick, ohne Scrollen. Oben bleiben Monat, Woche, Heute und ICS klein. Einträge lassen sich ziehen. Eine Deadline-Aufgabe verschwindet aus dem Kalender, wenn sie abgehakt oder gelöscht wird, und umgekehrt. „bis Freitag nächste Woche 10 Uhr Hausaufgaben erledigen“ heißt „Hausaufgaben erledigen“ um 10:00.

**Neu in 18.66.2:** Die Welt liegt quer über den ganzen Schirm. Oben rechts klappt ein Menü auf: Sprache an und aus, Würfel dazu. Die Hand zeichnet ihr Skelett. Fehlt ARCore, bleibt die Kamera und der Würfel trotzdem da.

**Neu in 18.66.1:** Der Chat rechts liegt nur auf der Planungstafel. **Aus** nimmt ihn weg, **Chat** holt ihn zurück. Die Tafel nutzt dann die volle Breite.

**Neu in 18.66.0:** Kachel **Welt** (Sprints 551–559). Die Rückkamera ist das
Auge. Würfel sind Anker im Zimmer, höchstens acht, Kante 8 cm. Boden und Stoß
halten sie. Eine Hand greift in Reichweite und lässt los. Ohne Flächen-Erkennung
sagt die Zeile `ARCore fehlt` und es entsteht kein Würfel. `Scanne den Raum`
bleibt der Tischplatten-Scan. Fassung: [`107-next.md`](./107-next.md).

**Neu in 18.61.0:** Einkauf, Todos mit Kalender-Erinnerung, Filme, eine Lage-Kachel, CarPlay-Standort, Schritt-Anleitungen, YouTube-Suchlink und die Server-Kachel (HTTPS, QR, vereinigter Hausstand). `engineStamp` bleibt `18.60.0-ygo-md`. Im aktuellen Sideload enthalten.

**Neu in 18.60.0:** Yu-Gi-Oh!-Bedienung aus Plan 106 (Sprints 531–550) in
einem Sideload. Aktivieren-Fenster OFF/AUTO/ON, Zielwahl, Kettenstapel,
Kampf und Ende, Zonenwahl, Statussymbole, Pendel und Ritual, Deckeditor
und Duellprotokoll. `engineStamp` `18.60.0-ygo-md`. Fassung:
[`yugioh-duel.md`](./yugioh-duel.md). Prüfsätze: [`TEST-18.60.md`](./TEST-18.60.md).

**Neu in 18.51.3:** Chat und Sprache nur in der aufgeklappten Werte-Leiste.
Der Schalter „Tischplatte an“ und der Leisten-Schalter darunter sind entfernt.

**Neu in 18.51.2:** Startbildschirm mit Raster, Tausch und Ordnern. Planung im
Sparring, eine Frage nach der anderen. Einkauf teilt lose Aufzählungen.
Duell mit Extra-Monsterzonen, Link-Pfeilen und sichtbarem Bot-Duell.
Kartentexte, Beschwörungsbedingungen, Dauerregeln, Spielmarken und Token
haben einen Effekt. Fassung: [`yugioh-duel.md`](./yugioh-duel.md).

**Neu in 18.51.1:** Nachzieher zu Alltag, Planung und Duell. Nachtfenster für
„morgen“, Wochentag ohne Uhr, Erinnerungen mit Tageszeit, aktive Einkaufsliste,
Backup der Todo-Listen, Timer-Abbrechen, Plan pro Gespräch, Handlimit 6 mit
Auswahl und Escape-Rückfrage. Fassung: [`audit-bugfixes-18-51.md`](./audit-bugfixes-18-51.md).

**Neu in 18.51.0:** Yu-Gi-Oh!-TCG-Subset aus Plan 105 (Sprints 511–530):
Zonenkapazität, Turn-1 ohne Battle, Spell Speed, erweiterte Effekte, Schema v2,
PSCT-Atome und Fidelity im Nachweis. `engineStamp` `18.51.0-ygo-tcg`. Grenzen:
[`yugioh-duel.md`](./yugioh-duel.md).

Diese Sideload-Datei enthält zusätzlich die Korrekturen danach: Duellfeld und
Karteneffekte, keine Battle Phase in Ultrons erstem Zug, Fallenfenster beim
Angriff, Planungsmodus, Timer-Leiste, geteilte Einkaufsliste und das Handy-Layout.
Die Fassung steht in [`audit-bugfixes-18-51.md`](./audit-bugfixes-18-51.md).

**18.45.0:** Self-Play, Zugsuche, Dev-Umschalter, Nachweis, Verify und Elo
(Sprints 503–510). Im aktuellen Sideload enthalten, nicht als eigene APK liegen
geblieben.

**18.31.7:** Yu-Gi-Oh!-Duel-KI mit lokalem Policy-Gradient-Training,
Holdout-Winrate gegen Baseline, begrenzten Effekten und Chain-Links,
vereinfachten Fusion-/Synchro-/Xyz-/Link-Beschwörungen sowie Animationen.
Kein Turnier-RL: Details und Regelgrenzen in
[`yugioh-duel.md`](./yugioh-duel.md).

**18.31.6:** Sprachtrigger, responsive Duell-Overlay, Deckeditor und
YGOPRODeck-Kartensuche.

**Neu seit 18.31.3:** 18.31.4 ergänzt Review-Fixes, Pflichtfeld-Rückfragen,
responsive Geräteklassen und Datensatz-Governance. 18.31.5 ergänzt Tabletmodus,
Wake-Wort und Hausstand-Server mit automatischem WLAN-Abgleich sowie Echo-Theme.
Testschritte für 18.31.4/18.31.5: [testanleitung-18-31-4-5.md](./testanleitung-18-31-4-5.md).

**18.31.3:** Hausstand-Import und Laden normalisieren ältere oder beschädigte
Projektpläne, damit die Tischplatte bei fehlenden Plan-Listen nicht abstürzt.

**Neu in 18.31.2:** Hausstand-Import normalisiert fehlende Kalender-Erinnerungs- und Film-Listen; Kalenderansicht toleriert ungültige Erinnerungslisten.

**18.31.1:** Hausstand-Import normalisiert ältere Fachwissens-Packs und stürzt bei fehlenden `claims` nicht mehr ab.

**Neu in 18.25.15:** Kaltstart zeigt wieder den Homescreen (Blackscreen-Fix), ErrorBoundary statt leerer WebView, stabilere IndexedDB/Einkaufs-Migration.

**18.25.14:** Mehrere Einkaufslisten, Flächen-Bugfixes. Test: [`TEST-18.25.14.md`](./TEST-18.25.14.md).

Die Kopplung hört weiter, wenn die Fläche nicht vorn liegt, und meldet sich per Benachrichtigung. `öffne den Planungsbildschirm` öffnet die Planung.

Entwurf: [`TEST-18.25.md`](./TEST-18.25.md). Testsätze ab Hausstand-Code: [`TEST-AB-18.23.12.md`](./TEST-AB-18.23.12.md). Portfolio: [`TEST-18.24.md`](./TEST-18.24.md). Raum-Scan: [`TEST-18.24.6.md`](./TEST-18.24.6.md).

Ablauf: [`TEST-18.23.md`](./TEST-18.23.md). Tafel und Datei-QR: [`TEST-18.22.md`](./TEST-18.22.md), [`TEST-18.21.md`](./TEST-18.21.md).

Tablet-Layout und Kopierboxen: [`TEST-18.20.md`](./TEST-18.20.md). YouTube-Schnitt schreibt die Datei erst auf einem Windows-PC mit JarvisPC.

**18.25.13:** Kopplung im Hintergrund, zwei Fenster — siehe Git-Historie.

**18.18.0:** Homescreen. In Sideload **`18.19.0`**.

**18.17.0:** Kalender Alltag. Sideload **`18.17.0`** (versionCode `181700`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

**18.16.0:** Personen-Knäuel. Sideload **`18.16.0`** (versionCode `181600`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

**18.15.0:** Hirn härten. Sideload **`18.15.0`** (versionCode `181500`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

**18.14.2:** Lage-Sätze, Flugzeug-Zoom, weichere Kugel. Sideload **`18.14.2`** (versionCode `181402`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

**18.12.0:** Kamera-Fähigkeiten S6+. Sideload **`18.12.0`** (versionCode `181200`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

**18.10.0:** TV-Wahrheit, Hören, Serie-Netz. Sideload **`18.10.0`** (versionCode `181000`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

**18.9.8:** Mail im Scan, Kontaktliste, IMAP-Test, Gedächtnis-Kern. Sideload **`18.9.8`** (versionCode `180908`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

**18.9.7:** E-Mail, Telefonbuch, WhatsApp. Sideload **`18.9.7`** (versionCode `180907`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk
