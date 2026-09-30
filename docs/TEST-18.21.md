# TEST 18.21 — Datei-QR **PLAN**

Noch nicht in der App. Sideload bleibt **`18.20.1`**, bis [`93-next.md`](./93-next.md)
ausgeführt ist. Danach: zwei Geräte, derselbe Chat-Knopf für Dateien.
Jede Box ist ein Satz.

## 1. Nur Dateien

Auf Gerät A eine kleine Textdatei über den bisherigen Datei-Knopf schicken.
Dann:

```
Übertrage das fürs Tablet
```

Die Antwort zeigt einen QR und den Dateinamen. Kein „fertig“, wenn der
Code fehlt.

Auf Gerät B ein Foto dieses Codes in den Chat:

Der Chat zeigt den Knopf `Dateien laden`. Ein Tippen speichert die Datei
unter demselben Namen. Kein zweites Tippen, kein Öffnen von selbst.

## 2. Nur Text

```
Das hier zum Kopieren als Anhang in der Nachricht: WLAN Blau12
```

```
Mach den QR-Code
```

Auf Gerät B steht unter der Antwort ein Feld `WLAN Blau12` mit `Kopieren`.
Kein Lade-Knopf, weil keine Datei im Satz war.

## 3. Beides, mehrere Zeilen

```
Übertrage das fürs Handy. Zum Kopieren:
WLAN Blau12
Türcode 4711
```

Zwei Felder, ein Knopf, wenn auch eine Datei im Gespräch lag.

## 4. Zu groß

Eine große PDF schicken, dann:

```
Mach den QR Code
```

Die Antwort nennt die PDF beim Namen und baut keinen Code, der sie
still abschneidet. Kleine Dateien desselben Satzes dürfen trotzdem
hinein, wenn sie in die sechs Codes passen.

## 5. Unvollständig und fremd

Liegen drei Codes in der Antwort, ein Foto schicken. Die Antwort sagt,
wie viele noch fehlen. Kein Knopf.

Ein Foto ohne diesen Code, und ein Foto des PC-QR aus JarvisPC, bleiben
beim bisherigen Lesen beziehungsweise beim PC-Koppeln. Kein Lade-Knopf.

## 6. Leer

```
Übertrage das fürs Tablet
```

Ohne Datei und ohne Kopierzeile: `Keine Datei im Gespräch. Zuerst den Datei-Knopf.`
