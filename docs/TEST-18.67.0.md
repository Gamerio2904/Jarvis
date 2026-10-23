# Test-Anleitung 18.67.0 — Bibliothek, Tags, Ordner-Grid

> Stand: `18.67.0` (versionCode `186700`), APK: `releases/Jarvis.apk` bzw. Release-Asset `Jarvis-18.67.0.apk`.
> Vor der Neuinstallation: **Einstellungen → Hausstand → Exportieren** (Deinstallation löscht Keys).
> Nach der Installation: **Groq-Key** eintragen (Smalltalk), **Gemini-Key** eintragen (Pflicht fürs Bild-Lesen in der Bibliothek).

---

## 1. Ordner-Grid (Regression)

| # | Schritt | Erwartet |
|---|---------|----------|
| 1.1 | Auf dem Homescreen einen Ordner antippen | Ordner öffnet sich und **bleibt offen** (vorher: schloss nach ~0,1 s wieder) |
| 1.2 | Direkt nochmal auf denselben Ordner tippen, mehrfach hintereinander | Öffnet jedes Mal sauber |
| 1.3 | Ordner mit zittrigem Finger antippen (leicht verwackeln) | Öffnet trotzdem (vorher: „passierte nichts") |
| 1.4 | Ordner öffnen → außerhalb des Dialogs tippen | Schließt (Backdrop-Klick funktioniert nach ~0,5 s wieder) |
| 1.5 | Im Ordner nach links/rechts wischen (2 Seiten befüllen) | Blättert Seiten, Punkte unten zeigen die Seite |
| 1.6 | App im Ordner antippen | Öffnet die App, Ordner schließt sich |
| 1.7 | App lange drücken und in den Ordner ziehen | Verschieben funktioniert weiterhin |
| 1.8 | Im Ordner App lange drücken (Kontextmenü) | App wird aus dem Ordner entnommen |

---

## 2. Bibliothek

### 2.1 Upload + Lesen (Gemini-Key nötig)

| # | Schritt | Erwartet |
|---|---------|----------|
| 2.1.1 | Homescreen → **Bibliothek** öffnen | Leere Liste mit Hinweis |
| 2.1.2 | **Hochladen** → ein Foto mit handschriftlichen Notizen/Ideen wählen | Karte erscheint, Status „werden gelesen…", danach Zusammenfassung „Was drin ist" |
| 2.1.3 | Karte antippen | Detail: Bildvorschau, Zusammenfassung mit **Inhalt / Themen / Ideen** |
| 2.1.4 | **Nochmal lesen** antippen | Liest das Bild erneut, Zusammenfassung aktualisiert |
| 2.1.5 | Eine .md- oder .txt-Datei hochladen | „Text gelesen und verknüpft", Text ist in der Detail-Ansicht sichtbar |

### 2.2 Fragen stellen (Recall)

| # | Schritt | Erwartet |
|---|---------|----------|
| 2.2.1 | Bild mit 3 Projektthemen hochladen → dann im Chat fragen: „**Was hatte ich für Ideen?**" | Antwort nennt die Themen vom Bild (Recall aus Bibliothek) |
| 2.2.2 | „**Was ist in der Bibliothek?**" | Listet Einträge mit Zusammenfassung |
| 2.2.3 | „**Was ist in der Bibliothek zu Projekt?**" | Filtert nach Treffern |
| 2.2.4 | „**Such in der Bibliothek nach ecommerce**" | Findet Einträge, die das Wort enthalten |
| 2.2.5 | „**Öffne die Bibliothek**" | Öffnet die Bibliotheks-GUI |

### 2.3 Speicherregel (kein redundanter Speicher)

| # | Schritt | Erwartet |
|---|---------|----------|
| 2.3.1 | Eintrag in der Detail-Ansicht ansehen | Kopf zeigt „auf diesem Gerät" |
| 2.3.2 | Hausstand-Sync durchführen (Einstellungen → Hausstand → Sync) | Backup-Zusammenfassung zählt Bibliotheks-Verknüpfungen; der Hausstand kennt Name, Tags, Lesetext |
| 2.3.3 | Eintrag löschen | Karte und Datei-Bytes sind weg (Vorschau danach leer) |

---

## 3. Tags für Todos und Notizen

### 3.1 GUI

| # | Schritt | Erwartet |
|---|---------|----------|
| 3.1.1 | Todos → „+" → Aufgabe anlegen, Tag-Feld `haushalt einkauf` | Todo zeigt farbige Tag-Chips, Karte hat farbigen Rahmen (Farbe vom ersten Tag) |
| 3.1.2 | Gleichen Tag bei mehreren Todos setzen | Rahmenfarbe ist **identisch** (stabile Farbe pro Tag) |
| 3.1.3 | Tag-Chip über der Liste antippen | Liste filtert auf diesen Tag; „Alle" hebt den Filter auf |
| 3.1.4 | „nach Tag sortieren" antippen | Liste gruppiert nach erstem Tag (A–Z), ungetaggte hinten |
| 3.1.5 | Notizen: neue Notiz mit `#projekt` im Text | Tag wird **automatisch** erkannt und als Chip angezeigt |
| 3.1.6 | Notiz-Editor: Tags `arbeit, ideen` eintragen und speichern | Chips erscheinen, Karte bekommt Rahmen |

### 3.2 Sprache

| # | Satz | Erwartet |
|---|------|----------|
| 3.2.1 | „**Tagge die Notiz Projekt Ideen mit Arbeit**" | „Tag ‚arbeit' hängt jetzt an der Notiz …" |
| 3.2.2 | „**Setze Tag Werkstatt auf die Aufgabe Regale aufbauen**" | Tag landet am Todo |
| 3.2.3 | „**Tagge die Datei projekt-themen mit Projekt**" | Tag landet am Bibliothekseintrag |
| 3.2.4 | „**Zeig mir Notizen mit Tag Arbeit**" | Listet passende Notizen und öffnet die GUI |
| 3.2.5 | „**Zeig Todos mit Tag Haushalt**" | Listet offene Todos mit dem Tag |
| 3.2.6 | Neue Aufgabe per Sprache: „**Todo: Müll rausbringen #haushalt**" | Tag `haushalt` hängt automatisch, Titel bleibt sauber ohne `#haushalt` |

---

## 4. Intelligenz (Gesamt-Regression)

| # | Satz | Erwartet |
|---|------|----------|
| 4.1 | „**Was muss ich noch tun?**" | Offene Todos mit Liste/Deadline |
| 4.2 | „**Ich muss noch die Steuererklärung verpennen bis Freitag**" | Todo mit Frist, Kalender-Eintrag, ohne Modellaufruf |
| 4.3 | „**Setz Milch auf die Einkaufsliste**" | Einkaufsliste erweitert |
| 4.4 | „**Nein auf die To-do-Liste**" | Letzter Einkaufsposten wandert ins Todo |
| 4.5 | „**Stell einen Timer für 3 Minuten**" | Läuft lokal ohne Modellaufruf |
| 4.6 | „**Na wie läufts bei dir so heute?**" | Normaler Smalltalk über Groq (Streaming) |
| 4.7 | „**Erinnere mich morgen um 15 Uhr an den Anruf**" | Erinnerung mit Alarm |
| 4.8 | „**Merke: Der Schlüssel hängt beim Nachbarn**" | Gedächtnis-Eintrag; später „Wo ist der Schlüssel?" |
| 4.9 | Buchfrage: „**Wer schrieb Der Schwarm?**" | Bibliotheks-Buchsuche (Open Library) — weiterhin intakt |
| 4.10 | Bildfrage mit Gemini: „**Was siehst du?**" (Kamera) | Vision-Antwort |
| 4.11 | „**Notfallprotokoll 187**" | Deinstallations-Dialog erscheint (Abbruch möglich) |

---

## 5. Hausstand / Tablet

| # | Schritt | Erwartet |
|---|---------|----------|
| 5.1 | Sync von Gerät A (mit Bibliothekseinträgen) zum Hausstand | Verknüpfungen kommen an, keine Datei-Bytes nötig |
| 5.2 | Auf Gerät B (Hausstand) Bibliothek öffnen | Einträge mit Namen, Tags, Lesetext sichtbar; Kopf zeigt „auf dem Ursprungsgerät" |
| 5.3 | Auf Gerät B Frage zu den Einträgen | Recall beantwortet aus dem Lesetext |
| 5.4 | Todo-/Notiz-Tags nach Sync | Tags und Farben kommen mit |

---

## 6. Build/CI-Selbsttest (PC)

```bash
cd frontend
npm install
npx tsc -b          # Typen sauber
npm run build       # vite-Build
npm run test:tags       # Tags: Extraktion, Farben, Filter, Intents
npm run test:library    # Bibliothek: Upload, Lesen, Recall, Backup
bash scripts/run-all-tests.sh   # komplette Suite
```

---

## Beispielprompts (zum Kopieren)

**Bibliothek:**
- „Ich habe dir ein Bild hochgeladen zu den 3 Themen, die wir für das Projekt verwenden."
- „Was hatte ich für Ideen?"
- „Welche Themen waren auf dem Bild für das Projekt?"
- „Such in der Bibliothek nach Preis-Wecker."
- „Tagge die Datei projekt-themen mit ecommerce."
- „Zeig alle Dateien mit Tag Projekt."

**Tags:**
- „Todo: Angebot vorbereiten #arbeit #projekt"
- „Tagge die Notiz Schlüssel mit Haushalt."
- „Zeig mir Todos mit Tag Einkaufen."
- „Setze Tag Finanzamt auf die Aufgabe Steuererklärung."

**Alltag/Intelligenz:**
- „Ich muss noch das Praktikumsgesuch fertig schreiben bis Mittwoch."
- „Was ist morgen alles an?"
- „Nein auf die Einkaufsliste."
- „Merke: Parkhaus B ist ab 18 Uhr günstig."
- „Was hatte ich für Ideen?" (Antwort aus Bibliothek + Notizen + Gedächtnis)

---

## Bekannte Grenzen (18.67.0)

- **PDF-Textauslesung** folgt in einem nächsten Stand — PDFs werden verknüpft und gelistet, aber noch nicht automatisch gelesen.
- **Bild-Lesen braucht einen Gemini-Key** ohne Key bleibt das Bild abrufbar, aber ohne Zusammenfassung.
- Datei-Bytes liegen am Ursprungsgerät; ein zweites Gerät sieht Verknüpfung + Lesetext, aber nicht die Vorschau-Datei.
