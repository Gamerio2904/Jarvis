# TEST 18.14 — Lage-Kugel Icons (PLAN)

Nach Execute von [`86-next.md`](./86-next.md). App-Code Ziel **`18.14.0`**.
Heute Sideload **`18.12.0`** — diese Datei ist die Abnahme, kein grüner Lauf.

Gerät, nicht die Cloud-VM (OpenSky dort oft SSL-tot).

## 1. Version

Einstellungen / Hilfe nennt **`18.14.0`**. Nicht `18.5.0`.

## 2. Ohne Satz

Lage auf: Erde, ISS darf, **keine** Flugzeug-Wolke. Kein OpenSky-Fetch
im Log / in der Intel-Leiste.

## 3. Flugzeuge

`Zeig Flugzeuge` oder `Was fliegt da`.

Erwartung: Silhouetten (kein hellblauer Punkt), Kurs stimmt grob,
Text mit OpenSky + **Stand vor N s** (oder Minuten) + **Kein Live**.
Herkunft Standort oder ausdrücklich Deutschland-Mitte.

Leerer Ausschnitt: „kein Flugzeug“, keine erfundenen Maschinen.

429: Tageslimit im Satz, Kugel bleibt.

## 4. Standort

GPS an: grüne **Stecknadel**, nicht nur ein Punkt.

Fix 15 min alt, Koordinaten noch da: Nadel gedämpft, „letzter Stand“.

Kein Fix / 0/0: keine Nadel „Sie“.

## 5. Satelliten

`Zeig Satelliten`. Körper + Paneele. ISS größer / eigene Form.
Kein Starlink-Teppich. Quelle CelesTrak und/oder Where The ISS At.
Kein „Live-Satellitenvideo“.

## 6. Schicht aus

`Schicht aus` / `Flugzeuge aus`: Overhead weg, Poll stoppt.
Standort-Nadel darf bleiben.

## 7. Kein Diebstahl

`Staffel 6 Folge 3` bleibt hud/Kamera. `Was fliegt da` bleibt
`flights` + Schicht overhead, kein neuer Agent.
`Zeig Erdbeben` bleibt Kreise/Ringe wie bisher.

## 8. Won’t auf dem Gerät

Keine Cesium-Credits. Kein `globe.gl`. Keine 9 000 Flieger.
Kein Wort „Live“ auf der Intel-Leiste.
