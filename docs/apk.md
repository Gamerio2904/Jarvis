# Android-APK — Test-Build `18.31.5`

Test-Build **`18.31.5`** (versionCode `183105`), debug-signiert:
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

Die Android-Geräteabnahme steht noch aus. Diese APK ist nur zum Testen gedacht,
keine finale Release-Freigabe. Die Änderungen seit 18.31.3 und die Testschritte
für 18.31.4/18.31.5 stehen in der
[detaillierten Testanleitung](./testanleitung-18-31-4-5.md).

**Neu seit 18.31.3:** 18.31.4 ergänzt Review-Fixes, Pflichtfeld-Rückfragen,
responsive Geräteklassen und Datensatz-Governance. 18.31.5 ergänzt Tabletmodus,
Wake-Wort und Hausstand-Server mit automatischem WLAN-Abgleich sowie Echo-Theme.

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
