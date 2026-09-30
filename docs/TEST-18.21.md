# TEST 18.21 — Datei-QR

In der App ab **`18.22.0`**. Dieselben Sätze in Spur Heute, Gruppe `18.21 Datei-QR`.
Zwei Geräte, derselbe Datei-Knopf. Jede Box ist ein Satz. Einmal tippen, kopieren, in den Chat.

## 1. Leer

Ohne Datei und ohne Kopierzeile:

```
Übertrage das fürs Tablet
```

Antwort: `Keine Datei im Gespräch. Zuerst den Datei-Knopf.`

## 2. Nur Dateien

Auf Gerät A eine kleine Textdatei über den Datei-Knopf schicken. Dann:

```
Übertrage das fürs Tablet
```

Die Antwort zeigt einen QR und `Drin:` mit dem Dateinamen.

```
Übertrage das fürs Handy
```

Auf Gerät B ein Foto dieses Codes in den Chat. Der Knopf heißt `Dateien laden`.
Ein Tippen speichert die Datei unter demselben Namen. Kein Öffnen von selbst.

## 3. Nur Text

```
Das hier zum Kopieren als Anhang in der Nachricht: WLAN Blau12
```

```
Zum Kopieren: Türcode 4711
```

```
Mach den QR-Code
```

```
Mach den QR Code
```

Auf Gerät B steht ein Feld mit `Kopieren`. Kein Lade-Knopf, wenn keine Datei im Satz war.

## 4. Beides

Zuerst eine kleine Datei schicken, dann diese eine Box:

```
Übertrage das fürs Tablet. Zum Kopieren:
WLAN Blau12
Türcode 4711
```

Zwei Felder und ein Knopf `Dateien laden`.

## 5. Zu groß

Eine große PDF schicken, dann:

```
Mach den QR Code
```

Die Antwort nennt die PDF bei `Fehlt:` und schneidet sie nicht still ab.
Eine kleine Datei desselben Gesprächs darf trotzdem in den Code.

## 6. Fremd

```
PC QR scannen
```

Das bleibt das Koppeln mit JarvisPC. Kein Lade-Knopf.

```
Lies das PDF
```

Das bleibt das Lesen. Kein Lade-Knopf.

Ein Foto ohne diesen Code bleibt beim bisherigen Lesen. Liegen mehrere Codes
in einer Antwort und es fehlt ein Foto, sagt die Antwort wie viele noch fehlen.
Kein Knopf, bevor der Satz vollständig ist.
