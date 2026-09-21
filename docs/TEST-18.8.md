# PO-Checkliste `18.8.3` — Debug-Rollback, Termin-Fristen, Kalender-Design

App-Code **`18.8.3`**. Sideload **`18.8.3`**, versionCode **`180803`**.  
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

Altes zuerst deinstallieren. Hausstand vorher exportieren.

Plan: [`79-next.md`](./79-next.md). Probe: [`TEST-PC.md`](./TEST-PC.md),
Prompts: [`TEST-1.16-plus.md`](./TEST-1.16-plus.md). 18.5 bleibt PLAN.

## 1. Version

```
Was kannst du?
```

In der Antwort muss **`18.8.3`** stehen.

## 2. Dock

Chat Lage Hören Kalender **Filme** Mehr. Tap Filme öffnet die Watchliste.

## 3. Termin-Erinnerungen

```
Termin morgen 15 Uhr Zahnarzt
```

Jarvis fragt, wann er erinnern soll. Der Termin steht schon im Kalender.

```
24 Stunden davor und 2 Stunden davor
```

Zwei Fristen, bestätigt. GUI: Speichern → Chips, Mehrfachwahl, übernehmen.

```
Termin absagen
```

Löscht den letzten Termin, fragt nicht nach Fristen.

## 4. Debug-Rollback und Download

Einstellungen → Tests → Lauf starten (Timer + Kalender). Dock sichtbar.
Nach dem ersten Turn: **Chat herunterladen** am Dock aktiv.
Fertig oder Stop: Test-Timer und Test-Termine weg, Debug-Chat bleibt,
Download schreibt JSON+TXT in Downloads. Keys unangetastet.

## 5. Prompt-Pakete

Einstellungen → Tests: Kategorien ohne V2–V9. Spur Probe beginnt mit
Memory-10, 13 Packs. Suche findet Zahnarzt und Watchliste.

## 6. Watchliste-Noten

Filme → Dune. **Kritiker** aus Rotten Tomatoes, zweite Zahl **IMDb**
wenn OMDb kein Publikum liefert. Kein Strich hinter Publikum, solange
IMDb da ist. Keine IMDb-Zahl als „Publikum“ beschriftet.

## 7. Erinnerungen am Tag

Erinnerung auf morgen legen, dann:

```
Entferne alle Erinnerungen am morgen
```

Die Erinnerung ist weg. Jarvis sagt das nur, wenn sie wirklich gelöscht
ist. Termine am selben Tag erwähnt er, löscht sie nicht still.

## 8. Lage / Osiris

Lage → Kugel. Keine leere **Sicht**-Karte. Hinweis: Schicht per Satz.

```
Zeig Erdbeben
```

Pins und Intel-Leiste. Chat und wieder Lage: Schicht bleibt.

## 9. Kalender-Themen

Dock Kalender. `Termin morgen 15 Uhr Zahnarzt` → Karte **Arzt**.
Teammeeting → **Arbeit**. Reiter Monat / Liste / Jahr.

Reiter gleitet. Monat wischen wechselt mit Richtung. Karten tragen die
Themenfarbe. Sheet hat einen Griff; nach unten wischen schließt.

## 10. Debug-Lauf

Einstellungen → Tests: Spur **Lauf** bleibt rechts. `Öffne Debug` zeigt **Start**.

---

Vorher: [`TEST-18.4.4.md`](./TEST-18.4.4.md).
