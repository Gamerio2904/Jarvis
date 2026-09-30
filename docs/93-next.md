# 93 — Dateien per QR aufs andere Gerät **PLAN** (`18.21`)

**Dieses Dokument ist CODE**, ausgeliefert in **`18.22.0`** (versionCode `182200`).
Sprints **398–403**.
Kein Server, kein Link, kein zweites Konto. Der PC-QR (`jarvis-pc:v1`) bleibt
das Koppeln mit JarvisPC und wird nicht wiederverwendet.

Hirn-Slots bleiben: **Groq primär → Gemini Spezialist → 0,5B.** Parser
wählen. Ein Domänen-Agent `xfer` pro Zug. Kein Schwarm.

---

## 0. Antwort in einem Satz

Dateien bleiben der bisherige Knopf im Chat. Ein Satz baut daraus einen
oder mehrere QR-Codes in der Antwort. Auf dem anderen Gerät ist ein Foto
dieses Codes die Eingabe. Jarvis antwortet mit einem Lade-Knopf für die
Dateien und, wenn Text mitgegeben wurde, mit Feldern zum einmaligen
Kopieren.

---

## 1. Ablauf

1. **Hochladen wie bisher.** Der Knopf „Datei (Foto, PDF, Text)“ bleibt.
   PDF, Text und Foto werden weiter gelesen und beantwortet. Zusätzlich
   bleiben die Originalbytes eine halbe Stunde in diesem Gespräch, nur
   dafür. Word, Excel, Folien und HEIC bleiben abgelehnt.
2. **Satz auf dem ersten Gerät.** Zum Beispiel `Übertrage das fürs Tablet`
   oder `Mach den QR-Code`. Gemeint sind die Dateien dieses Gesprächs, die
   noch daliegen.
3. **Antwort ist der Code.** Ein Bild pro Code, darunter `1/3`. Die Antwort
   nennt die Dateinamen, die hineinpassen, und die, die es nicht tun.
4. **Foto auf dem zweiten Gerät.** Kamera öffnen, den Code fotografieren,
   das Bild in den Chat schicken — derselbe Datei-Knopf wie bisher. Kein
   extra Scanner.
5. **Antwort dort.** Ein Knopf `Dateien laden`. Ein Tippen speichert jede
   Datei unter ihrem Namen. Kein automatisches Öffnen, kein Installieren.
6. **Text zum Kopieren.** Im selben Satz oder im Satz davor, nach dem
   Doppelpunkt. Jede Zeile wird auf dem zweiten Gerät ein Feld mit
   `Kopieren`, an dieselbe Nachricht gehängt wie der Knopf.

---

## 2. Sätze

Der Parser nimmt nur diese Formen. Alles andere bleibt Datei-Lesen, PC-QR
oder normaler Chat.

```
Übertrage das fürs Tablet
```

```
Übertrage das fürs Handy
```

```
Mach den QR-Code
```

```
Mach den QR Code
```

Text, eine Zeile:

```
Das hier zum Kopieren als Anhang in der Nachricht: WLAN Blau12
```

```
Zum Kopieren: Türcode 4711
```

Text und Dateien in einem Satz. Jede Zeile nach dem Doppelpunkt ist ein
eigenes Feld:

```
Übertrage das fürs Tablet. Zum Kopieren:
WLAN Blau12
Türcode 4711
```

Ohne Datei und ohne Kopierzeile: `Keine Datei im Gespräch. Zuerst den Datei-Knopf.`
Ohne Datei, nur mit Kopierzeile: der Code trägt nur die Felder, die Antwort
auf der anderen Seite hat keinen Lade-Knopf.

---

## 3. Was in den Code darf

Ein Foto liest genau einen Code. Ein Code ist klein, weil er von einem
Bildschirm fotografiert wird (Fehlerkorrektur Q, ruhiger Rand, groß genug
zum Fotografieren). Reicht ein Code nicht, zeigt dieselbe Antwort weitere,
höchstens **sechs**. Der Satz hat eine Id. Der Knopf erscheint erst, wenn
jedes Foto dieses Satzes da ist. Vorher: `Code 1 von 3. Noch 2 Fotos vom selben Satz.`

Was nicht in sechs Codes passt, wird mit Namen genannt und nicht still
verkürzt. Ein PDF oder ein Foto passt oft nicht. Kurzer Text und kleine
Textdateien passen. Die genaue Byte-Zahl setzt Sprint 399 am Fixture fest,
nicht dieses Dokument.

Präfix `jarvis-xfer:v1`, damit ein PC-Code (`jarvis-pc:v1`) nicht als
Übertrag gilt und umgekehrt. Ein fremder QR-Code im Foto bleibt beim
bisherigen Lesen und wird nicht zum Lade-Knopf.

Die Bytes verlassen die zwei Geräte nicht. Kein Hausstand-Export der
Originaldatei. Nach 30 Minuten oder nach erfolgreichem Laden sind die
gehaltenen Bytes weg. Kopierzeilen landen nicht im Gedächtnis.

---

## 4. Anzeige

| Seite | Was der Chat zeigt |
|-------|--------------------|
| Sender | QR-Bild(er), Zähler, Namen die drin sind, Namen die fehlen |
| Empfänger, unvollständig | Satz mit der Zahl, kein Knopf |
| Empfänger, vollständig | Knopf `Dateien laden` und darunter die Kopierfelder |

Die Felder sind dieselben Kästen wie in den Testprompts: antippen oder
`Kopieren` kopiert die Zeile. Der Knopf lädt alle Dateien des Satzes, nicht
eine Auswahl.

---

## 5. Won't

- Server, Link, Cloud, gleiches WLAN als Voraussetzung
- Den PC-QR ersetzen oder den Code im grauen JarvisPC-Fenster zweckentfremden
- Word, Excel, Folien, HEIC
- Datei automatisch öffnen oder installieren
- Das Modell einen Code erfinden oder einen Wechsel behaupten, den es nicht gibt
- Mehr als sechs Codes, stilles Abschneiden
- Den Übertrag in den Feature-Katalog als schon lebend eintragen, bevor der Code liegt

---

## 6. Sprints (`18.21.0` CODE, in `18.22.0`)

| Sprint | Inhalt | Klasse |
|--------|--------|--------|
| [398](./sprints/sprint-398.md) | Parser, Konflikte, Agent `xfer` | Must PLAN |
| [399](./sprints/sprint-399.md) | Codec, Grenze, Fixture hin und zurück | Must PLAN |
| [400](./sprints/sprint-400.md) | Originalbytes neben dem bisherigen Lesen, 30 min | Must PLAN |
| [401](./sprints/sprint-401.md) | QR in der Antwort, Namen ehrlich | Must PLAN |
| [402](./sprints/sprint-402.md) | Foto, Knopf, Kopierfelder | Must PLAN |
| [403](./sprints/sprint-403.md) | Gold, Testkarten, Version erst dann | Must PLAN |

Kette: 398 vor 399. 399 und 400 vor 401. 401 vor 402. 403 zuletzt.
Test-Sätze: [`TEST-18.21.md`](./TEST-18.21.md). Die Karten kommen in Spur
Heute erst, wenn 403 ausgeführt ist — vorher würde der Chat einen Satz
zeigen, den er nicht kann.
