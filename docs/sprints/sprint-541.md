# Sprint 541 — Xyz-Material bleibt unter der Karte

**Version:** `18.56.0` — **PLAN** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 540

**Gateway:** offen

## Ziel

Xyz-Material liegt unter der Xyz-Karte und erscheint im Blatt. Es geht durch die Beschwörung nicht auf den Friedhof.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S541-1 | Material | `yugioh-duel.ts` | Material zählt nicht als zerstört. Ein Effekt, der Material abnimmt, bleibt fail-closed, bis ein späterer Sprint den Kartentext dafür hat. engineStamp erhöhen. |
| S541-2 | Tests | `test-yugioh-rules.mjs` | Nach der Beschwörung stehen die Materialien im Blatt und nicht im Friedhof. |

## Go, No-Go, Abbruch

- Go, wenn: Das Blatt zeigt dieselben Karten, die als Material gelegt wurden.
- No-Go, wenn: Material gilt als Friedhofskarte oder als zerstört.
- Abbruch: Dieser Sprint erfindet das Abnehmen von Material.
