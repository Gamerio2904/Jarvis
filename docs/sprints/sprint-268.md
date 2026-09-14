# Sprint 268 — Kugel: Tag/Nacht und ISS-Bahn

**Schiene:** 18.0 Sicht + Schach. **Version nach diesem Sprint:** `17.9.0`. **Davor:** Sprint 267 (`17.8.0` Coach). **Danach:** Sprint 269 (`17.10.0` Schichten). **Meilenstein:** Sprint 271 (`18.0.0`).

**Einstieg:** [`70-next.md`](../70-next.md) §0c. **Lage heute:** `frontend/src/ui/lage/GlobeView.tsx`, `globe-gibs.ts`. **Ist-Zielbild (überclaimt Terminator):** [`43-next.md`](../43-next.md); Briefing: [`48-next.md`](../48-next.md).

## Ziel

Die Kugel bleibt **Canvas 2D**. Zwei Dinge, die das Reel **sichtbar** machen, ohne 60 fps und ohne 100 000 Objekte:

1. **Tag/Nacht-Grenze** (Terminator) — Sonne auf einer Seite, Dunkelheit auf der anderen. Das ist der Effekt, den Reels als „live“ verkaufen.
2. **ISS-Bahn** — nicht nur ein Punkt. Ein Bogen der nächsten Umläufe aus den vorhandenen ISS-Positionen.

Kein neues npm. Kein Three.js. Kein Cesium. Kein EarthOS.

## Warum das zuerst

Ohne Terminator wirkt die Kugel wie ein Foto. Ohne Bahn wirkt die ISS wie ein zufälliger Punkt. Beides ist mit vorhandenem Canvas und vorhandenem `loadIss()` machbar. Schichten (Erdbeben, Feuer) kommen in 269, weil sie Netz und Parser brauchen.

## Aufgaben

| # | Aufgabe | Datei | Anleitung |
|---|---------|-------|-----------|
| 1 | Sonnenposition | `frontend/src/engine/sun.ts` (neu) | Reine Funktion: UTC → Subsolar-Punkt (Länge/Breite). Kein npm. Formel dokumentieren. Tests: Mittag am Äquator ungefähr 0° Breite; Länge folgt UTC. |
| 2 | Terminator zeichnen | `GlobeView.tsx` | Nach der Textur ein Halbtransparentes Nacht-Overlay entlang der Tag/Nacht-Grenze. Nicht schwarz-undurchsichtig — Sterne/Textur sollen durchscheinen. |
| 3 | ISS-Bahn | `globe-gibs.ts` / `GlobeView.tsx` | Aus mehreren ISS-Positionen (vorhandenes `wheretheiss.at` oder vorhandene Prognose) eine Linie auf die Kugel. Maximal wenige Dutzend Punkte. Ein Punkt bleibt der aktuelle Standort. |
| 4 | Kein „Live“ | `GlobeView.tsx` / HUD-Text | Kein Label „Live“. Alter der GIBS-Kachel bleibt ehrlich. ISS: „Position vor X Minuten“, nicht „live verfolgen“. |
| 5 | Budget | `GlobeView.tsx` | 30 fps-Deckel, Pause wenn Lage nicht sichtbar, Lite-Modus (`globe_webgl` = weniger Ringe) bleibt. Terminator + Bahn dürfen das nicht sprengen. Messung in der Konsole reicht für diesen Sprint. |
| 6 | Docs | `docs/43-next.md`, `docs/CHANGELOG.md` | Zwei Sätze: Terminator und Bahn sind da. EarthOS ist nicht da. `43-next.md` darf Terminator erst dann als CODE führen. |

## Tests

```
npx tsc --noEmit -p frontend
npx vite build --config frontend/vite.config.ts
```

Gerät:

1. Lage öffnen: Tag- und Nachtseite erkennbar (nicht die ganze Kugel gleich hell).
2. ISS-Punkt plus Bahn sichtbar.
3. Kein Text „Live“.
4. Lage verlassen: Animation pausiert (kein Dauer-Timer).
5. `globe_webgl` an: weniger Ringe, Kugel bleibt Canvas.

## Abbruch

- FPS p95 über 40 ms auf Mittelklasse **ohne** neue Schichten → nicht „dann Three.js in diesem Sprint“. Messen, in Sprint 270 entscheiden.
- EarthOS / Cesium / `globe.gl` in `package.json` → raus.
- NASA-GIBS-ToS verletzt (Kacheln cachen über den erlaubten Rahmen) → zurück auf Blue Marble ohne GIBS.

## PO-Prüfung

1. Sieht die Kugel **klarer** aus als 17.0.0? (Tag/Nacht)
2. Ist die ISS **eine Bahn**, nicht nur ein Punkt?
3. Ist irgendwo „Live“ gelogen? → Muss weg.
4. Wurde die APK größer durch npm? → Muss nein sein.
