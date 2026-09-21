# PO-Checkliste `18.8.0` — Debug-Rollback, Termin-Fristen, Download

App-Code **`18.8.0`**. Sideload **`18.8.0`**, versionCode **`180800`**.  
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

Altes zuerst deinstallieren. Hausstand vorher exportieren.

Plan: [`79-next.md`](./79-next.md). Probe: [`TEST-PC.md`](./TEST-PC.md),
Prompts: [`TEST-1.16-plus.md`](./TEST-1.16-plus.md). 18.5 bleibt PLAN.

## 1. Version

```
Was kannst du?
```

In der Antwort muss **`18.8.0`** stehen.

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

---

Vorher: [`TEST-18.4.4.md`](./TEST-18.4.4.md).
