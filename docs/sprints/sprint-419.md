# Sprint 419 — Hauptbildschirm

**Version:** `18.24.0` — **PLAN** Must
**Plan:** [`96-next.md`](../96-next.md)
**Voraussetzung:** 418. Jede Zeile hat Name und Cover.

## Ziel

Bei angeschalteter Tischplatte und ohne live Skript zeigt die Mitte
das Portfolio mit dem Shredder. Die Planung bleibt das live Skript.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S419-1 | Komponente | `Shredder.tsx` `index.css` | TS-CSS von reactbits.dev/micro/shredder kopieren. Klassen unter `.shredder`. Props aus Plan §3. `autoAnimate` false. Kein Tailwind, kein Fetch zur Laufzeit |
| S419-2 | Fläche | `HomeScreen.tsx` `PortfolioStage.tsx` | `tischplatteOn` und `plan_phase` `live`: `Workbench` wie heute. `tischplatteOn` und Phase leer oder `go`: `PortfolioStage`. Tischplatte aus: `HOME_APPS`. Die Leisten-Icons bleiben |
| S419-3 | Zeilen | `PortfolioStage.tsx` | Eine Zeile je nicht archiviertem Projekt. Bild und kurzer Name. Archivierte Zeilen fehlen. Leere Liste: `Das Portfolio ist leer.` |
| S419-4 | Bewegung | `index.css` | `prefers-reduced-motion`: die Karte geht in 120 ms Deckkraft weg, ohne Streifen. Der Schlitz setzt in diesem Sprint noch nichts um. Das Öffnen ist Sprint 420 |

## Won't

Dateiliste, Beispiele, Löschen durch den Schlitz, Icon-Raster bei angeschalteter Tischplatte.

## Abbruchkriterium

`plan_phase` `live` zeigt das Portfolio statt des Skripts, oder die Komponente lädt Quelltext von reactbits.dev.
