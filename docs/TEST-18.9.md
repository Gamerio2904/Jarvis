# TEST 18.9 — Recover + Hirn

Nach Execute von [`80-next.md`](./80-next.md). Sideload **`18.9.0`**,
versionCode `180900`. `18.5` nicht parallel.

## 1. Ansage

Netz aus oder Tagesschau-Mock tot. `Nachrichten`.

Erwartung: Satz mit **geht nicht** und **versuche** oder ehrliche Absage.
Keine erfundenen Schlagzeilen.

## 2. Zweite Methode trifft

Erste Quelle 503, zweite 200 (Dev-Mock). Reply nennt die **zweite** Quelle.

## 3. Write bleibt einmal

`Termin morgen 15 Uhr Zahnarzt` während News-Recover läuft: **ein** Termin.

## 4. OMDb ohne Key

Key leer. Film auf die Liste. **Publikum —** / keine erfundene Prozentzahl.

## 5. Gold + Auto-Debug

`GOLD_EXPECT`-Keys = `TEST_PROMPTS`. Probe **13** Spuren, kein Pack „Recover“.
Happy-Path (`Nachrichten`, `Zeig Erdbeben`, Termin) läuft in Spur **Lauf**.
Wechsel 503→200 nur im Skript `test-recover.mjs`, nicht im Auto-Debug.

## 6. Kalender 18.9.4

`Samstag Geburtstag Jakob 18 Uhr` — Chat nennt Titel und Tag, Kalender
zeigt den Termin am nächsten Samstag 18:00, nicht „Nichts an diesem Tag“.
`Verschieb Jakob auf Sonntag 19 Uhr` rückt ihn. Woche-Reiter und
Wochenstreifen zeigen denselben Eintrag.

## 8. Agenten-Sweep 18.9.6

`npm run test:agents-sweep` — 63 Katalog-Agenten, je ein Satz, Route trifft.
Gold enthält jeden Agenten (Todo als `tools`). Probe bleibt 13 Packs.

## 9. Post / Telefonbuch / WhatsApp 18.9.7

`Kontakte scannen` — Nachfrage, dann Ja, Recht, Anzahl.  
`Lies meine E-Mails` ohne Key — Zugang fehlt, nichts erfinden.  
`Schreib mir eine E-Mail` — An wen, nicht Won’t. Entwurf nach Ja.  
`Was steht auf WhatsApp` ohne Meldungsrecht — ehrlich + Einstellungen.  
Antwort nach Ja über die Meldung oder Chat-Link. Nie „ist gesendet“.

## 10. Plan-81 Lücken 18.9.8

`Zeig meine Kontakte` listet lokal merkte Nummern und Adressen.  
`Mama, Mail name@gmx.de` legt die Adresse. Scan übernimmt Mail, wenn
die Telefonbuchzeile eine hat. IMAP-Karte: Testen erreicht das Postfach
oder sagt ehrlich aus. `Schreib mir eine E-Mail` dann `name@…` fragt
nach dem Text, verliert die Adresse nicht. Nie „ist gesendet“.

## 11. Gedächtnis-Kern 18.9.8

Zwei zitierte Quellen zur selben Frage bleiben beide (verschiedene Keys).
„Ich arbeite bei …“ liegt unter Arbeit. „Was weißt du über mich“ nennt
Gelerntes mit Quelle. Lookup „Was ist der BIP“ trifft die Pin, nicht
irgendeine andere Recherche. e5 ändert die Route nicht.

## 7. Watchliste 18.9.5

`Inglorious Basterds zu Lieblingsfilmen hinzufügen` — Chat nennt den
Titel bei den Lieblingen, Folie Filme zeigt ihn. `Ja entfernen es`
nimmt denselben Eintrag weg. Zwei Zeilen Star Wars 3 / Episode III:
`Star Wars 3 ist doppelt auf der Liste fixe das` lässt eine übrig.

Vorher: [`TEST-18.8.md`](./TEST-18.8.md).
