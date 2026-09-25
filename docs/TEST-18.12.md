# TEST 18.12 — Kamera-Fähigkeiten S6+

Nach Execute von [`83-next.md`](./83-next.md) §3. App-Code **`18.12.1`**,
versionCode `181201`. Sideload **`18.12.0`**.

## 1. Version

Einstellungen / Hilfe nennt **`18.12.1`**. Nicht `18.5.0`, nicht unter `18.10.0`.

## 2. Foto + Staffel 6

Foto-Knopf: eine Rick-and-Morty-Szene. Dann `Staffel 6 Folge 3`.

Erwartung: Jarvis nennt nur Sichtbares, fragt „Aufschreiben?“, sagt
`laut Ihnen, nicht in der offenen API`. Kein Folgentitel, kein Wiki.

`Ja` → Steckbrief zeigt die Fähigkeit mit `· Kamera`.

## 3. Ohne Foto / zu alt

`Staffel 6 Folge 3` ohne Foto → Foto-Knopf, nichts erfunden.

`Staffel 3 Folge 5` → kein Kamera-Write (API-Staffel).

`Staffel 3 Folge 5 Fähigkeiten` → ehrlich: ab Staffel 6.

## 4. Recall / Vergessen

`Welche Kamera-Fähigkeiten habe ich?` listet nur Kamera-Zeilen.

`Vergiss die Kamera-Fähigkeiten` räumt IndexedDB, Dossier ohne Kamera-Zeile.

## 5. Kein Diebstahl

`Zutaten von Nutella` / `Suche im Internet nach Carbonara-Rezept` bleiben
food/search, nicht hud.

## 6. Foto-Knopf — Kamera oder Datei (`18.12.1`)

Kamera-Knopf unten: zwei Optionen, **Kamera** und **Datei**.

Kamera öffnet die Linse, nicht die Galerie. Datei bleibt Galerie/PDF/Text.

Escape oder Tippen daneben schließt die Wahl.

## 7. Unbekanntes Gesicht

Sichtbare Figur ohne API-Knoten (S01–S05): Chat-Notiz, kein neuer Punkt
im Netz.
