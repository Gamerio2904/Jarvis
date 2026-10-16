# Sprint 557 — Hand in der Welt

**Version:** `18.65.0` — **PLAN** Must

**Plan:** [`../107-next.md`](../107-next.md)

**Hängt an:** 556

**Gateway:** go

## Ziel

Die Hand hat eine Lage in derselben Welt wie die Würfel. Der Griff beginnt noch nicht.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S557-1 | Punkte | `welt-hand.ts` | 21 Handpunkte, lokal im App-Paket. Die Fundstelle bleibt leer bis `Such`. Lücke L4. |
| S557-2 | Zange | `welt-hand.ts`, `welt.ts` | Der Zangenpunkt ist die Mitte aus Daumen- und Zeigefingerspitze. Er liegt in Weltmetern oder das Feld bleibt leer. |
| S557-3 | Bild | `WeltOverlay.tsx`, `test-welt.mjs` | Das Gerüst folgt den Fingern. Ein leerer Zangenpunkt startet keinen Griff und verschiebt keinen Anker. |

## Go, No-Go, Abbruch

- Go, wenn: A10 gilt und die Würfel an ihren Ankern bleiben.
- No-Go, wenn: Der Zangenpunkt nur Bildpixel hat und der Sprint ihn trotzdem als Weltlage ausgibt. Dann wird dieses Gateway `nogo` und 558 bleibt liegen.
- Abbruch: Gelenk, Loslassen, eine zweite Hand. Die Versionsnummer `18.65.0` setzt nur dieser Sprint, und nur beim Bauen.

## Prompt

Zeichne die Hand als Gerüst und rechne den Zangenpunkt in die Welt der Würfel. Hat er keine Meterlage, bleibt das Feld leer und kein Würfel rückt. Starte keinen Griff. Gibt es keine gemeinsame Weltlage, ist dieser Sprint nogo und der Griff wird nicht gebaut.
