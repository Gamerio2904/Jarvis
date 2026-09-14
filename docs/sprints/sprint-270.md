# Sprint 270 — Freeze: `globe.gl` nur nach Messung

**Schiene:** 18.0 Sicht + Schach. **Kein eigener SemVer-Schritt**, solange der Freeze **nicht** gezogen wird. Wenn gezogen: Patch auf `17.10.0` oder mit Sprint 271 als `18.0.0` — PO entscheidet nach Messung. **Davor:** Sprint 269. **Danach:** Sprint 271 (`18.0.0`).

**Einstieg:** [`70-next.md`](../70-next.md) §0c. **API, die bleiben muss:** `GlobeView.tsx` Props (Kamera, Pins, Schichten, Lite).

## Ziel

**Nicht** die Kugel neu schreiben. **Nur** wenn Sprint 268+269 auf einem Mittelklasse-Gerät **messbar** an der 30-fps-Wand sind (p95 Framezeit über 40 ms bei offenen Schichten), darf der Renderer intern auf **`globe.gl` (MIT)** wechseln.

Die Hülle bleibt `GlobeView`. Parser, Schichten, Pins, GIBS-Alter, kein „Live“ — unverändert.

## Wann dieser Sprint **nicht** läuft

Standard: **überspringen**. Canvas 2D in 17.0.0 ist bewusst. `globe.gl` zieht Three.js nach. Das ist Gewicht, WebView-Risiko und ein zweiter Pfad zum Testen.

Der Sprint läuft nur, wenn **alle** gelten:

1. Messung mit Terminator + Bahn + mindestens einer Schicht: p95 > 40 ms auf dem Gerät, das 17.0.0 noch flüssig hatte.
2. Lite-Modus reicht nicht (auch mit weniger Markern über Budget).
3. PO sagt ja zum Gewicht ( grobe Größenordnung: Three.js + globe.gl, nicht Cesium).

Sonst: Datei bleibt eine Seite „nicht gezogen“, `package.json` unverändert, Sprint 271 ohne `globe.gl`.

## Wenn gezogen — Aufgaben

| # | Aufgabe | Datei | Anleitung |
|---|---------|-------|-----------|
| 1 | Messung dokumentieren | `docs/43-next.md` + `docs/CHANGELOG.md` | Gerät, Build, Framezeiten vorher/nachher. Ohne Zahl kein Merge. Kein neues `48-ist.md`. |
| 2 | Adapter | `GlobeView.tsx` oder `GlobeViewGl.tsx` | Gleiche Props. Feature-Flag, Default **aus**, bis Messung auf dem Gerät grün ist. |
| 3 | Kein iframe | — | **Verboten:** `earthos.efolusi.com` oder Worldlens in einem iframe. Auch nicht „nur zum Vergleich im Release“. |
| 4 | Kein Cesium | `package.json` | Nur `globe.gl` + was es zwingend braucht. Nicht die EarthOS-Monorepo-Deps. |
| 5 | Fallback | `GlobeView.tsx` | WebGL weg / Kontext verloren → Canvas-Pfad, Text „3D-Kugel nicht verfügbar“. |
| 6 | GIBS | — | Textur-Quelle bleibt GIBS/Blue Marble. `globe.gl` malt die Kugel, erfindet keine Live-Satellitenbilder. |

## Tests (nur wenn gezogen)

```
npx tsc --noEmit -p frontend
npx vite build --config frontend/vite.config.ts
```

Gerät: Lage mit Schichten, Flag an und aus, WebGL aus (falls simulierbar), Flugmodus.

## Abbruch

- EarthOS / Worldlens / Cesium / `react-globe.gl` ohne Flag → raus.
- iframe auf eine fremde Erde-Website → raus.
- Flag default an ohne Messung → raus.
- Zweiter sichtbarer Kugel-Screen neben Lage → raus.

## PO-Prüfung

1. Gibt es eine Zahl (Framezeit), nicht nur „fühlt sich besser an“?
2. Kannst du das Flag ausmachen und die alte Kugel sehen?
3. Ist in den Netz-Requests **kein** earthos.efolusi.com?
