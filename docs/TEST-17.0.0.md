# PO-Checkliste `17.0.0`

Download: https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

versionName **`17.0.0`**, versionCode **`170000`**.

Altes zuerst deinstallieren, sonst überschreibt Android die neue APK nicht
sauber. Hausstand vorher exportieren (Einstellungen → Export).

Die Tests unten sind so geschnitten, dass **ein Prompt = ein Kriterium**.
Jedes graue Kästchen ist ein Tipp, den du 1:1 kopierst.

---

## 1. Installieren und Version prüfen

1. APK herunterladen (Link oben).
2. Altes Jarvis deinstallieren.
3. Neue APK installieren, öffnen, Keys eintragen falls nach Neuinstall weg.
4. Tippe:

```
Was kannst du?
```

In der Antwort muss **`17.0.0`** stehen. Steht dort `16.1.1`, ist die alte APK
noch drauf.

---

## 2. Alltag — Befehle, die früher ins Leere liefen

Neues Gespräch. Jeder Prompt muss **handeln**, nicht nachfragen und nicht ans
Modell fallen.

1. Timer über Zahlwort und Infinitiv am Ende:

```
einen Timer für fünf Minuten stellen
```

Jarvis stellt den Timer. Chip unter dem Composer zählt runter. **Keine**
Rückfrage, **kein** „das habe ich nicht verstanden".

2. Wecker mit Zahlwort plus Ursache:

```
erinnere mich um acht an den Zahnarzt
```

Jarvis legt eine Erinnerung **08:00** mit Titel Zahnarzt. Nicht 0 Uhr, nicht
ohne Titel.

3. Wecker „auf sieben":

```
stell den Wecker auf sieben
```

Wecker **07:00**, bestätigt. Keine Rückfrage.

4. Fernseher im Nachlauf. Zuerst:

```
Fernseher an
```

Dann, im **selben** Gespräch:

```
mach das an
```

Zweiter Satz schaltet denselben Fernseher. Nicht „was meinst du mit an".

5. Verb-final Erinnerung:

```
mich morgen um neun an den Müll erinnern
```

Erinnerung morgen 09:00, Titel Müll.

Nach den fünf: **Timer stopp**, damit nichts weiterklingelt:

```
Timer stopp
```

---

## 3. Timer — ansagen ist nicht stellen

1. Neues Gespräch.

```
Timer 1 Minute Test
```

Chip zählt. Jarvis bestätigt. App im Vordergrund lassen.

2. Nach Ablauf: Jarvis **sagt an**, Chip verschwindet. Der Alarm klingelt
**einmal**, nicht zweimal.

3. Restzeit:

```
Timer 5 Minuten Nudeln
```

dann:

```
Wie lange läuft der Timer?
```

Echte Restzeit, Uhrzeit als `HH:MM` **ohne Leerzeichen**.

4. Stopp:

```
Timer stopp
```

Chip weg. Nochmal `Wie lange läuft der Timer?` sagt, dass keiner läuft.

---

## 4. Abbruch — ein neuer Zug tötet den alten

1. Lange Recherche anstoßen:

```
recherchiere ausführlich die Geschichte der Raumfahrt
```

2. **Sofort**, während noch Tokens kommen, einen Kurzbefehl tippen:

```
wie spät ist es
```

Die Uhrzeit kommt. Die Recherche **darf nicht** danach noch in den Chat
geschrieben werden. Kein zweiter, verspäteter Textblock.

3. Sprachmodus (optional, wenn du sprichst): während Jarvis redet, **hineinreden**.
Die Stimme stoppt, der neue Satz gilt.

---

## 5. Werkzeug-Vorschlag — das Modell darf vorschlagen, nicht ausführen

Nur wenn Groq erreichbar ist. Satz, den **kein** Parser kennt, der aber nach
einem Befehl klingt:

```
kannst du den Fernseher für mich starten
```

Jarvis **fragt nach**, ob der Fernseher an soll. Er schaltet **nicht** von
allein.

Dann:

```
nein
```

Nichts passiert am Gerät. Jarvis bestätigt die Absage.

Zweiter Versuch, diesmal **ja** — nur wenn ein Fernseher wirklich da ist:

```
kannst du den Fernseher für mich starten
```

```
ja
```

Jetzt darf er schalten. Steht kein Gerät, sagt er ehrlich, dass es nicht
gegangen ist — **kein** „ist an" ins Blaue.

Einschleusen (darf **nicht** den Fernseher treffen):

```
erinnere mich morgen um 8:00 Uhr an mach den Fernseher an
```

Das wird eine **Erinnerung**, kein TV-Befehl. Falls Jarvis nachfragt: ablehnen
ist richtig, schalten ist falsch.

---

## 6. Historie in der Lage

1. Die Prompts aus Abschnitt 2 und 3 geschickt haben.
2. Lage öffnen → Tab **Körper** → Ansicht **Agenten** (nicht Organe).
3. Rechts unter dem Baum: **Letzte Züge**. Die Liste zeigt Uhrzeit, Agent,
   Millisekunden und den Satz.
4. Einen Zug antippen. Aufgeklappt stehen Du-Text, Jarvis-Text, Pfad
   (`parser` / `groq` / …) und die Agenten-Schritte.
5. Knopf **Export** kopiert JSON. In den Einstellungen gibt es denselben
   Export als **Historie herunterladen**.
6. App **komplett schließen** und neu öffnen: die Liste ist leer. Das ist
   Absicht — die Historie liegt im Speicher, nicht auf der Platte.

---

## 7. Regression — nichts aus 16.1 kaputt

1. `Hallo Jarvis.` → Smalltalk, kein Fachwissen-Text.

```
Hallo Jarvis.
```

2. Lautstärke ohne Rückfrage:

```
Lautstärke 50
```

Fernseher (oder das aktive Medium) regelt. **Keine** Gegenfrage
„Fernseher oder Fahrmodus?".

3. Tageslage:

```
Was steht an?
```

Tageslage, **nicht** „Erinnerung oder Notizen?".

4. Kugel:

```
Öffne die Weltkugel
```

Tab Lage, Kugel sichtbar, Composer bleibt.

5. Hell/Dunkel in den Einstellungen umschalten → Blende, Farben passen.
6. Kalender: Monat wischen, Termin anlegen.

---

## 8. Ehrliches Scheitern

1. Flugmodus an.

```
Wie wird das Wetter?
```

Jarvis darf **nicht** ein Wetter erfinden. Entweder ehrlich „keine Daten"
oder das lokale Modell sagt, dass es nicht weiß.

2. Flugmodus aus. Fertig.

---

## Rot / Grün

| Rot | Grün |
|-----|------|
| Version in der Hilfe ist nicht `17.0.0` | Hilfe nennt `17.0.0` |
| „einen Timer stellen" fällt ans Modell | Chip läuft |
| „um acht an den Zahnarzt" wird 0 Uhr oder ohne Titel | 08:00, Titel Zahnarzt |
| Recherche schreibt nach dem zweiten Satz noch weiter | zweiter Satz gewinnt, erster ist tot |
| Vorschlag schaltet ohne „ja" | Nachfrage, erst dann Gerät |
| Erinnerung „mach den Fernseher an" schaltet den TV | nur Erinnerung, oder Absage |
| Historie leer nach den Test-Zügen (ohne Neustart) | Liste unter dem Agenten-Baum |
| Historie überlebt den Neustart | leer nach Neustart ist richtig |
