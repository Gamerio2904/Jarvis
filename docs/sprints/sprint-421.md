# Sprint 421 — Beispiele

**Version:** `18.24.0` — **PLAN** Must
**Plan:** [`96-next.md`](../96-next.md)
**Voraussetzung:** 418 und 420. Mappe und Dateiliste existieren.

## Ziel

Ein Bild, das der Nutzer schon gezeigt hat oder das ein Satz ausdrücklich
holt, liegt unter `beispiele/` und als eigene Zeile auf dem Hauptbildschirm.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S421-1 | Satz | `portfolio-parse.ts` | `Beispiel zu <projekt>` und `Beispiel zu <projekt>: Bild …` aus Plan §4. `Zeig mir London` bleibt die Kugel. Eine Recherche ohne diesen Satz schreibt keine Datei |
| S421-2 | Quelle | `portfolio.ts` `image-fetch.ts` `agent-session.ts` | Mit Bildrest: ein Treffer über `image-fetch.ts`, Quelle behalten, `cover` darf `research` werden. Ohne Bildrest: letztes Chat-Bild, sonst `readLastEyeImage()`. Nichts da: `Kein Bild zum Speichern.` |
| S421-3 | Grenze | `portfolio.ts` | Lange Kante 1024, JPEG 0,72, höchstens 400 KB, ein zweiter Versuch bei 0,6. Sechstes Bild ist das Maximum. Darüber: `Das Bild ist zu groß.` oder die sechste Stelle bleibt, das siebte kommt nicht rein |
| S421-4 | Fläche und Ordner | `PortfolioStage.tsx` `device.ts` | Die Beispielzeile steht unter der Projektkarte. Tipp öffnet das Bild in der Dateiliste. Pfad `portfolio/<slug>/beispiele/<name>.jpg`. Schlitz auf dem Beispiel archiviert nur dieses Bild. Antwort `Beispiel liegt bei Tik Tak To.` |

## Won't

Automatischer Download jeder Suche, Imagen, ein siebtes Beispiel, Galerie-Browser.

## Abbruchkriterium

`Such Open Source …` oder `Zeig mir ein Bild der Elbe` allein schreibt eine Datei unter `beispiele/`.
