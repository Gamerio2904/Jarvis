# PO-Checkliste `16.1.0`

Download: https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

Diese Version behebt Fehler, bei denen Jarvis **zurückgefragt hat, statt zu
handeln**. Bei jedem Punkt unten gilt: Jarvis darf **nicht** mit einer
Gegenfrage wie „Fernseher oder Fahrmodus?" antworten.

## 1. Lautstärke und Medien

1. Neues Gespräch, kein Medium läuft. `Lautstärke 50` → Fernseher regelt, **keine Rückfrage**.
2. `lauter um 10` → dasselbe.
3. `Spiel Dune Film` → Fernseher, **keine Rückfrage**.
4. `Spiele ein YouTube Video auf dem Fernseher` → Fernseher, **keine Rückfrage**.
5. Fahrmodus an, dann `lauter` → **Spotify**, nicht der Fernseher.

## 2. Alltag ohne Gegenfrage

1. `Was steht an?` → Tageslage, **nicht** „Erinnerung oder Notizen?".
2. `Wo ist Norden?` → Kompass, **nicht** gespeicherte Orte.
3. `Wo ist die Apotheke` → Ort in der Nähe.
4. `Termin aus dem Zettel` → Kamera/Auge, **nicht** der Kalender.

## 3. Timer — ansagen ist nicht stellen

1. `Timer 1 Minute Frühstückseier` → Chip unter dem Composer zählt runter.
2. App im Vordergrund lassen. Nach Ablauf: Jarvis **sagt an**, Chip verschwindet.
3. `Timer 5 Minuten Nudeln`, dann `Wie lange läuft der Timer?` → echte Restzeit,
   Uhrzeit als `HH:MM` **ohne Leerzeichen**.
4. `Timer stopp` → Chip weg, `Wie lange läuft der Timer?` sagt „Kein laufender Timer".
5. Benachrichtigungen in Android **verbieten**, dann `Timer 2 Minuten Test` →
   Jarvis bestätigt trotzdem und weist auf das fehlende Recht hin. Der Timer
   läuft in der App. **Kein** erfundener Text vom Modell.

## 4. Kugel und Orte

1. `Öffne die Weltkugel` → Tab **Lage**, Kugel sichtbar, Composer bleibt.
2. `Zeig Street View von London` → Absage („kann ich nicht"), und **kein Pin**
   auf Großbritannien.
3. `Zeig mir London` → Pin auf London (die Stadt, nicht das Land).
4. `Wo liegt Berlin` → Pin Berlin.

## 5. Ehrliches Scheitern

1. Fernseher ausstecken oder WLAN trennen, dann `Fernseher an` → Jarvis sagt,
   dass es **nicht** funktioniert hat. Er darf **nicht** behaupten, der
   Fernseher sei an.
2. Flugmodus an, dann `Wie wird das Wetter?` → Jarvis darf hier ans Modell
   fallen und ehrlich sagen, dass er keine Daten hat.

## 6. Nichts kaputt

1. `Hallo Jarvis.` → Smalltalk, kein Fachwissen-Text.
2. `Was kannst du?` → Hilfe, und die Version darin ist **`16.1.0`**.
3. Mehr → Suche `Fernseher` → Tab **Geräte**.
4. Hell/Dunkel umschalten → Wisch-Animation, Farben passen.
5. Kalender: Monat wischen, FAB → Bogen, Termin anlegen.
