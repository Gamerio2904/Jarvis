# PO-Checkliste `18.1.0` — Audit-Reste 272–281

App-Code **`18.1.0`**. Sideload bleibt **`18.0.7`**, bis die nächste APK gebaut
ist (versionCode dann `180100`). Download der aktuellen APK:
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

Hausstand vorher exportieren.

Diese Liste prüft, was der Rechner hier nicht messen kann: Java auf dem
Gerät, Fakten-Absage, Navigation einmal, SMS-Funk, Fahrmodus, Kalender,
Widerspruch, Abkürzungen.

---

## 1. Version

```
Was kannst du?
```

In der Antwort muss **`18.1.0`** stehen — sobald die Sideload-APK diese
Fassung trägt. Bis dahin gilt der Code auf dem Dev-Build.

---

## 2. Gerät — Java aus Sprint 272

Nach einem **App-Update** (nicht nur App-Start): gesetzte Wecker klingeln
weiter zur Uhrzeit. Kein Wecker, den niemand gestellt hat, Stunden später.

Sprachmodus: ganze Antwort am Lautsprecher, **kein** Abbruch nach dem ersten
Satz. Dazwischenreden per Antippen, nicht per Zuruf während Jarvis spricht.

Fahrmodus: eine Ansage, dann die nächste — nicht für den Rest der Fahrt stumm,
weil ein zweites `speak()` das erste Versprechen verwaist hat.

Taschenlampe braucht keine Kamera-Erlaubnis.

---

## 3. Keine erfundenen Zahlen (273)

Flugmodus oder Netz aus:

```
Was kostet E10 an der nächsten Tankstelle
```

Absage mit **„Ich rate nicht.“** — keine Preise.

```
Regnet es gleich?
```

Absage oder echte Open-Meteo-Daten, **keine** erfundenen Gradzahlen.

```
Wie steht die Bundesliga?
```

Tabelle oder ehrliche Absage, keine Platzierungen aus dem Modell.

---

## 4. Navigation einmal (274)

```
Nächste Tankstelle
```

Zielführung startet **einmal**, auch wenn die Preise langsam kommen.

---

## 5. SMS (275)

SMS ohne Funk (Flugmodus, keine SIM): Jarvis sagt **nicht** „gesendet“.
Mit Funk: „hat der Funk angenommen“ — nicht, dass sie angekommen ist.

---

## 6. Fahrmodus und Kalender (276)

Fahrmodus öffnen, Ansage laufen lassen, Fahrmodus verlassen: Stimme **sofort**
still, Mikrofon aus. Kalender-Tab: Tastatur bleibt zu, bis „＋ Termin“.

---

## 7. Widerspruch (277)

Nach einer Antwort zu einem Wahlergebnis:

```
Das stimmt nicht
```

Suche auf den **vorherigen** Satz, kein Gedächtnis-Eintrag.

Isoliert, ohne Recherche davor:

```
Das stimmt nicht
```

Gedächtnis-Korrektur, **keine** Websuche.

---

## 8. Abkürzungen (278)

Eine Antwort mit „ca. drei Kilometer“ darf nicht als abgebrochen gelten
(kein zweiter Cloud-Aufruf, kein „Satz unvollständig“).

---

## Abbruch

Einer der Sätze in 3 liefert Zahlen ohne Quelle. Ein Wecker nach Update ist
weg. „ca. drei“ gilt als Abbruch.
