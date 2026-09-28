# TEST 18.15 — Hirn härten

Nach Execute von [`87-next.md`](./87-next.md). App-Code **`18.15.0`**.
Sideload **`18.15.0`**, versionCode `181500`.

Gerät, nicht nur die Cloud-VM. Over `18.14.2` installieren.

## 1. Version

Einstellungen / Hilfe nennt **`18.15.0`**. Nicht `18.14.2`.

## 2. Retrieve / e5 (361)

e5-Schalter **aus**: Recall wie bisher, Keyword-RRF.

Schalter **an**, Datei fehlt: Hinweis „e5-small fehlt. Retrieve bleibt Keyword-RRF“.
Trefferliste ändert sich nicht.

`Fernseher an` bleibt Fernseher, mit und ohne Schalter. Encoder wählt nie das Gerät.

Die Sideload enthält **kein** `e5-small.onnx`.

## 3. Propose (362)

Undeutlich: `Hol die Nachrichten` → Nachrichten, nicht Smalltalk.

`Kannst du das Wetter checken` → Wetter (oder „Verstanden als … Soll ich?“ nur bei Write/Device).

`Erzähl was` / `Wie geht's` → Hirn, kein Werkzeug.

Gerät ohne Ja: `Fernseher an` nach Umschreibung wartet auf „Ja“.

## 4. Knowledge (363)

Gelerntes Film-Pack, dann Filmtitel fragen → Claim und URL.

Nachricht / Sport mit passendem Pack → URL sichtbar.

`Fernseher an` / Timer / Steckdose: kein Pack-Essay.

## 5. Abbruch (364)

Lange Suche oder Nachrichten, dann neues Wort / Antippen im Sprachmodus:
alte Antwort kommt nicht mehr, neuer Zug startet. Settings-Keys bleiben.

## 6. Presence (365)

Schalter **aus**: PC `http://HANDY:18791/` tot. Satz: Presence aus.

Schalter **an**, gleiches WLAN, Token: Verlauf lesen, Zeile senden.
Hint: „Hirn lauscht :18791 nur LAN.“

Ohne Bind (Browser, Bind fehlgeschlagen): kein „läuft“, ehrlich tot.

Gastnetz / andere Subnet-Klasse: abgewiesen. Kein WAN.

## 7. Stimme (366)

`Stell einen Timer auf zwei Minuten`: Ansage startet, ohne auf Groq zu warten.

Smalltalk: erster Satz, dann Rest, eine Lane (Edge zuerst).

Dazwischenreden / Antippen: alter Mund weg, neuer Zug.

## 8. Lage (367)

Flugzeug antippen: Rufzeichen, Höhe/Kurs nur wenn Feld da, OpenSky, kein Ziel raten, **kein Live**.

Stadt-Pin ohne Briefing: Gazetteer nur für Orts-Pins (Kiew bleibt Kiew, nicht London).

Flug-Pin ohne Satz: keine Airline erfinden.

Intel: Quelle + Alter, „kein Live“.

## 9. Gold / Korrektur (368)

`Nein, das war der Timer` nach falschem Wecker: Timer-Liste oder ehrliche Nachfrage — trifft **timer**, kein Fine-Tune.

`Hol die Nachrichten`: **ein** Satz, Tagesschau und DW genannt, kein zweiter Agent in der Trace.

Bekannter Miss steht in Auto-Debug unter Parser-Misses (lokal, kein Upload).

## 10. Won’t

Kein LLM-Schwarm. Kein zweiter Domänen-Agent im selben Zug.
Kein e5 in `pickRoute`. Kein „Live“ ohne „kein“.
Andere Drafts (Koch, Clips, Experte, Kamera-Wahl) nicht mitgeliefert.
